import { createHash, randomUUID } from 'node:crypto'
import { constants, createReadStream } from 'node:fs'
import { appendFile, copyFile, mkdir, open, readFile, readdir, rename, stat, unlink, utimes, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { createInterface } from 'node:readline'

export interface LocalKnowledgeDocument {
  id: string
  title: string
  source: string
  content: string
  createdAt: string
}

export interface LocalEvidence {
  documentTitle: string
  source: string
  snippet: string
  score: number
}

export interface LocalKnowledgeDocumentSummary {
  id: string
  title: string
  source: string
  createdAt: string
  contentLength: number
}

export interface LocalKnowledgeDocumentPage {
  items: LocalKnowledgeDocumentSummary[]
  nextCursor?: string
  hasMore: boolean
  total: number
}

interface LegacyLocalKnowledgeStoreData {
  version: 1
  documents: LocalKnowledgeDocument[]
}

interface LocalKnowledgeManifest {
  version: 2
  documentCount: number
}

interface LocalKnowledgeIndexRecord extends LocalKnowledgeDocumentSummary {
  sequence: number
  tokens: string[]
  contentFile: string
}

interface LocalWriteJournal {
  version: 1
  document: LocalKnowledgeDocument
  record: LocalKnowledgeIndexRecord
}

const TOKEN_PATTERN = /[\p{Script=Han}]|[a-zA-Z][a-zA-Z0-9_+#.-]*/gu
const processQueues = new Map<string, Promise<void>>()

/** 将用户目录快捷写法解析为实际本地资料库路径。 */
export function resolveLocalStorePath(configuredPath: string): string {
  const expanded = configuredPath.trim().replace(/^~(?=[\\/])/, homedir())
  return resolve(expanded || `${homedir()}/.dsh/project-knowledge-review/knowledge.json`)
}

/** 从中文、英文和技术标识中提取可用于零配置词法检索的 token。 */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_PATTERN) ?? []).filter((token) => token.length > 0)
}

function indexPath(path: string): string { return `${path}.index.jsonl` }
function documentsPath(path: string): string { return `${path}.documents` }
function journalPath(path: string): string { return `${path}.journal.json` }
function lockDirectory(path: string): string { return `${path}.locks` }
function contentFileName(id: string): string { return `${createHash('sha256').update(id).digest('hex')}.json` }

/** 同一进程按库排队，再用独占锁协调其他 DSH 进程，防止 sequence 与计数竞争。 */
async function withStoreLock<T>(path: string, action: () => Promise<T>): Promise<T> {
  const key = resolve(path)
  const previous = processQueues.get(key) ?? Promise.resolve()
  let releaseQueue!: () => void
  const current = new Promise<void>((resolvePromise) => { releaseQueue = resolvePromise })
  const queued = previous.then(() => current)
  processQueues.set(key, queued)
  await previous
  let releaseFile: (() => Promise<void>) | undefined
  try {
    releaseFile = await acquireFileLock(key)
    return await action()
  } finally {
    await releaseFile?.()
    releaseQueue()
    if (processQueues.get(key) === queued) processQueues.delete(key)
  }
}

async function acquireFileLock(path: string): Promise<() => Promise<void>> {
  const directory = lockDirectory(path)
  await mkdir(directory, { recursive: true })
  const token = randomUUID()
  const ticket = resolve(directory, `${Date.now()}-${process.pid}-${token}.ticket`)
  await writeFile(ticket, `${process.pid}\n${token}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  for (let attempt = 0; attempt < 400; attempt += 1) {
    await removeDeadTickets(directory, ticket)
    const tickets = (await readdir(directory)).filter((name) => name.endsWith('.ticket')).sort()
    if (tickets[0] === ticket.slice(directory.length + 1)) {
      const heartbeat = setInterval(() => { void utimes(ticket, new Date(), new Date()).catch(() => undefined) }, 15_000)
      heartbeat.unref()
      return async () => { clearInterval(heartbeat); try { await unlink(ticket) } catch { /* ticket 名唯一，只删除自身。 */ } }
    }
    await delay(25)
  }
  try { await unlink(ticket) } catch { /* 超时清理自身票据。 */ }
  throw new Error('本地知识库正被另一个进程写入，请稍后重试')
}

async function removeDeadTickets(directory: string, ownTicket: string): Promise<void> {
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.ticket')) continue
    const target = resolve(directory, name)
    if (target === ownTicket) continue
    try {
      const [ownerPidText] = (await readFile(target, 'utf8')).split(/\r?\n/)
      const ownerPid = Number(ownerPidText)
      const info = await stat(target)
      if ((!Number.isSafeInteger(ownerPid) || !processExists(ownerPid)) && Date.now() - info.mtimeMs > 2_000) await unlink(target)
    } catch { /* 票据可能正被其所有者释放。 */ }
  }
}

/** 读取 v2 清单；首次遇到旧 v1 JSON 时自动迁移且保留原始备份。 */
async function ensureIndexedStore(path: string): Promise<LocalKnowledgeManifest> {
  try {
    const parsed = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, '')) as Partial<LocalKnowledgeManifest> | Partial<LegacyLocalKnowledgeStoreData>
    if (parsed.version === 2 && typeof parsed.documentCount === 'number') return recoverPendingWrite(path, { version: 2, documentCount: parsed.documentCount })
    if ('documents' in parsed && Array.isArray(parsed.documents)) return migrateLegacyStore(path, parsed.documents)
    throw new Error('本地知识库格式不受支持')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('本地知识库文件无法读取，请检查 localStorePath 是否指向合法 JSON 文件')
    const manifest: LocalKnowledgeManifest = { version: 2, documentCount: 0 }
    await mkdir(dirname(path), { recursive: true })
    await mkdir(documentsPath(path), { recursive: true })
    await writeFile(indexPath(path), '', 'utf8')
    await saveManifest(path, manifest)
    return manifest
  }
}

/** 将旧版整库 JSON 一次迁移为轻量 JSONL 索引与按单条保存的原文。 */
async function migrateLegacyStore(path: string, documents: LocalKnowledgeDocument[]): Promise<LocalKnowledgeManifest> {
  await mkdir(dirname(path), { recursive: true })
  await mkdir(documentsPath(path), { recursive: true })
  await preserveLegacyBackup(path)
  const temporaryIndex = `${indexPath(path)}.tmp`
  const handle = await open(temporaryIndex, 'w')
  try {
    for (let sequence = 0; sequence < documents.length; sequence += 1) {
      const document = documents[sequence]
      const record = toIndexRecord(document, sequence + 1)
      await atomicWrite(resolveContentPath(path, record.contentFile), `${JSON.stringify(document)}\n`)
      await handle.write(`${JSON.stringify(record)}\n`)
    }
  } finally { await handle.close() }
  await rename(temporaryIndex, indexPath(path))
  const manifest: LocalKnowledgeManifest = { version: 2, documentCount: documents.length }
  await saveManifest(path, manifest)
  return manifest
}

async function preserveLegacyBackup(path: string): Promise<void> {
  const preferred = `${path}.v1.backup.json`
  try {
    await copyFile(path, preferred, constants.COPYFILE_EXCL)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    const unique = `${path}.v1.backup.${Date.now()}-${randomUUID().slice(0, 8)}.json`
    await copyFile(path, unique, constants.COPYFILE_EXCL)
  }
}

function toIndexRecord(document: LocalKnowledgeDocument, sequence: number): LocalKnowledgeIndexRecord {
  return {
    sequence,
    id: document.id,
    title: document.title,
    source: document.source,
    createdAt: document.createdAt,
    contentLength: document.content.length,
    tokens: [...new Set(tokenize(`${document.title}\n${document.content}`))],
    contentFile: contentFileName(document.id),
  }
}

async function saveManifest(path: string, manifest: LocalKnowledgeManifest): Promise<void> {
  await atomicWrite(path, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function atomicWrite(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(temporary, content, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, path)
}

/** 若上次进程在写入中退出，按 journal 幂等补齐原文、索引与清单。 */
async function recoverPendingWrite(path: string, manifest: LocalKnowledgeManifest): Promise<LocalKnowledgeManifest> {
  let journal: LocalWriteJournal
  try { journal = JSON.parse((await readFile(journalPath(path), 'utf8')).replace(/^\uFEFF/, '')) as LocalWriteJournal } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return manifest
    throw new Error('本地知识库恢复日志损坏，请检查 journal 文件')
  }
  await atomicWrite(resolveContentPath(path, journal.record.contentFile), `${JSON.stringify(journal.document)}\n`)
  await repairTrailingIndexLine(path)
  if (!(await indexContainsId(path, journal.record.id))) await appendFile(indexPath(path), `${JSON.stringify(journal.record)}\n`, 'utf8')
  const recovered = { version: 2 as const, documentCount: Math.max(manifest.documentCount, journal.record.sequence) }
  await saveManifest(path, recovered)
  await unlink(journalPath(path))
  return recovered
}

/** 流式遍历轻量索引；不会把全部原文或全部元数据同时载入内存。 */
async function forEachIndex(path: string, visit: (record: LocalKnowledgeIndexRecord) => void | Promise<void>): Promise<void> {
  const lines = createInterface({ input: createReadStream(indexPath(path), { encoding: 'utf8' }), crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    try { await visit(JSON.parse(line.replace(/^\uFEFF/, '')) as LocalKnowledgeIndexRecord) } catch (error) {
      if (error instanceof SyntaxError) throw new Error('本地知识库轻量索引损坏，请从 v1 备份恢复或重新导入资料')
      throw error
    }
  }
}

async function indexContainsId(path: string, id: string): Promise<boolean> {
  let found = false
  await forEachIndex(path, (record) => { if (record.id === id) found = true })
  return found
}

/** journal 存在时只修复末尾半行；中间损坏不会被静默吞掉。 */
async function repairTrailingIndexLine(path: string): Promise<void> {
  const target = indexPath(path)
  const handle = await open(target, 'r+')
  try {
    const info = await handle.stat()
    if (!info.size) return
    const readSize = Math.min(info.size, 1024 * 1024)
    const buffer = Buffer.alloc(readSize)
    await handle.read(buffer, 0, readSize, info.size - readSize)
    if (buffer[readSize - 1] === 0x0a) return
    const lastNewline = buffer.lastIndexOf(0x0a)
    const truncateAt = info.size - readSize + lastNewline + 1
    await handle.truncate(Math.max(0, truncateAt))
  } finally { await handle.close() }
}

/** 将纯文本资料持久化到零配置本地库，journal 保证中断后可自动补偿。 */
export async function addLocalDocument(path: string, title: string, content: string, source = '用户粘贴文本'): Promise<LocalKnowledgeDocument> {
  const cleanTitle = title.trim()
  const cleanContent = content.trim()
  if (!cleanTitle || !cleanContent) throw new Error('资料标题和内容不能为空')
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    const document: LocalKnowledgeDocument = {
      id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      source: source.trim() || '用户粘贴文本',
      content: cleanContent,
      createdAt: new Date().toISOString(),
    }
    const record = toIndexRecord(document, manifest.documentCount + 1)
    const journal: LocalWriteJournal = { version: 1, document, record }
    await atomicWrite(journalPath(path), `${JSON.stringify(journal)}\n`)
    await atomicWrite(resolveContentPath(path, record.contentFile), `${JSON.stringify(document)}\n`)
    await appendFile(indexPath(path), `${JSON.stringify(record)}\n`, 'utf8')
    await saveManifest(path, { version: 2, documentCount: record.sequence })
    await unlink(journalPath(path))
    return document
  })
}

/** 先扫描轻量 token 索引选出有限候选，再按需读取候选原文生成 evidence。 */
export async function searchLocalKnowledge(path: string, question: string, topK: number): Promise<LocalEvidence[]> {
  const terms = [...new Set(tokenize(question))]
  if (!terms.length) return []
  return withStoreLock(path, async () => {
    await ensureIndexedStore(path)
    const candidateLimit = Math.max(20, Math.min(topK, 10) * 8)
    const candidates: Array<{ record: LocalKnowledgeIndexRecord; score: number }> = []
    await forEachIndex(path, (record) => {
      const tokenSet = new Set(record.tokens)
      const matches = terms.filter((term) => tokenSet.has(term))
      if (!matches.length) return
      const coverage = matches.length / terms.length
      const titleBoost = terms.filter((term) => record.title.toLowerCase().includes(term)).length / terms.length * 0.15
      candidates.push({ record, score: coverage + titleBoost })
      candidates.sort((left, right) => right.score - left.score)
      if (candidates.length > candidateLimit) candidates.length = candidateLimit
    })
    const results: LocalEvidence[] = []
    for (const candidate of candidates.slice(0, Math.max(1, Math.min(topK, 10)))) {
      const document = await readIndexedDocument(path, candidate.record.id)
      const text = `${document.title}\n${document.content}`
      const normalized = text.toLowerCase()
      const positions = terms.map((term) => normalized.indexOf(term)).filter((position) => position >= 0)
      const start = Math.max(0, (positions.length ? Math.min(...positions) : 0) - 180)
      results.push({ documentTitle: document.title, source: document.source, snippet: text.slice(start, start + 700).replace(/\s+/g, ' ').trim(), score: Number(candidate.score.toFixed(3)) })
    }
    return results
  })
}

/** 返回本地知识库概览，只读取常数大小清单。 */
export async function localKnowledgeOverview(path: string): Promise<{ documentCount: number; storePath: string; scope: 'dsh-user-global' }> {
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    return { documentCount: manifest.documentCount, storePath: path, scope: 'dsh-user-global' }
  })
}

/** 流式分页返回元数据，内存仅保留当前页；原文不进入列表请求。 */
export async function listLocalDocuments(path: string, cursor: string | undefined, limit: number, query = ''): Promise<LocalKnowledgeDocumentPage> {
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    const keyword = query.trim().toLowerCase()
    const boundary = cursor && /^\d+$/.test(cursor) ? Number(cursor) : Number.POSITIVE_INFINITY
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 30, 100))
    const page: LocalKnowledgeIndexRecord[] = []
    let total = 0
    let eligible = 0
    await forEachIndex(path, (record) => {
      const matches = !keyword || `${record.title}\n${record.source}`.toLowerCase().includes(keyword)
      if (!matches) return
      total += 1
      if (record.sequence >= boundary) return
      eligible += 1
      page.push(record)
      if (page.length > safeLimit) page.shift()
    })
    page.reverse()
    const oldest = page.at(-1)
    return {
      items: page.map(({ id, title, source, createdAt, contentLength }) => ({ id, title, source, createdAt, contentLength })),
      ...(eligible > page.length && oldest ? { nextCursor: String(oldest.sequence) } : {}),
      hasMore: eligible > page.length,
      total: keyword ? total : manifest.documentCount,
    }
  })
}

/** 单条原文文件名由 ID 哈希直接推导，展开无需扫描整个索引。 */
export async function getLocalDocument(path: string, id: string): Promise<LocalKnowledgeDocument | undefined> {
  return withStoreLock(path, async () => {
    await ensureIndexedStore(path)
    try { return await readIndexedDocument(path, id) } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
  })
}

async function readIndexedDocument(path: string, id: string): Promise<LocalKnowledgeDocument> {
  const target = resolveContentPath(path, contentFileName(id))
  const document = JSON.parse((await readFile(target, 'utf8')).replace(/^\uFEFF/, '')) as LocalKnowledgeDocument
  if (document.id !== id) throw new Error('本地知识库原文 ID 校验失败')
  return document
}

function resolveContentPath(path: string, fileName: string): string {
  const base = resolve(documentsPath(path))
  const target = resolve(base, fileName)
  const rel = relative(base, target)
  if (!rel || rel.startsWith('..') || resolve(rel) === rel) throw new Error('本地知识库索引包含非法原文路径')
  return target
}

function processExists(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (error) { return (error as NodeJS.ErrnoException).code === 'EPERM' }
}

function delay(ms: number): Promise<void> { return new Promise((resolvePromise) => setTimeout(resolvePromise, ms)) }
