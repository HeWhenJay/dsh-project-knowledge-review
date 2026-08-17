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
  updatedAt?: string
  summary?: string
  summarySource?: 'extractive' | 'model'
  systemCategory?: string
  userCategory?: string | null
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
  updatedAt?: string
  contentLength: number
  summary?: string
  summarySource?: 'extractive' | 'model'
  systemCategory?: string
  userCategory?: string | null
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
  version: 1 | 2
  document: LocalKnowledgeDocument
  record: LocalKnowledgeIndexRecord
}

interface LocalUserCategoryStore {
  version: 1
  categories: string[]
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
function categoriesPath(path: string): string { return `${path}.categories.json` }
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
    updatedAt: document.updatedAt ?? document.createdAt,
    summary: document.summary,
    summarySource: document.summarySource,
    systemCategory: document.systemCategory,
    userCategory: document.userCategory,
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
  if (journal.version === 2) await replaceIndexRecord(path, journal.record)
  else if (!(await indexContainsId(path, journal.record.id))) await appendFile(indexPath(path), `${JSON.stringify(journal.record)}\n`, 'utf8')
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

/** 原子替换一条轻量索引记录，保持其他资料的 sequence 与顺序不变。 */
async function replaceIndexRecord(path: string, replacement: LocalKnowledgeIndexRecord): Promise<void> {
  const temporary = `${indexPath(path)}.${process.pid}.${randomUUID()}.tmp`
  const handle = await open(temporary, 'w')
  let replaced = false
  try {
    await forEachIndex(path, async (record) => {
      const value = record.id === replacement.id ? replacement : record
      if (record.id === replacement.id) replaced = true
      await handle.write(`${JSON.stringify(value)}\n`)
    })
    if (!replaced) throw new Error('要更新的本地资料索引不存在')
  } finally { await handle.close() }
  await rename(temporary, indexPath(path))
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
    const now = new Date().toISOString()
    const document: LocalKnowledgeDocument = {
      id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      source: source.trim() || '用户粘贴文本',
      content: cleanContent,
      createdAt: now,
      updatedAt: now,
      summary: buildExtractiveSummary(cleanContent, cleanTitle),
      summarySource: 'extractive',
      systemCategory: classifyLocalDocument(cleanTitle, cleanContent),
      userCategory: null,
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
      items: page.map(({ id, title, source, createdAt, updatedAt, contentLength, summary, summarySource, systemCategory, userCategory }) => ({ id, title, source, createdAt, updatedAt, contentLength, summary, summarySource, systemCategory, userCategory })),
      ...(eligible > page.length && oldest ? { nextCursor: String(oldest.sequence) } : {}),
      hasMore: eligible > page.length,
      total: keyword ? total : manifest.documentCount,
    }
  })
}

/** 分页读取摘要工作区元数据，并按系统分类或用户二次分类过滤。 */
export async function listLocalSummaries(
  path: string,
  cursor: string | undefined,
  limit: number,
  query = '',
  systemCategory = '',
  userCategory: string | undefined = undefined,
): Promise<LocalKnowledgeDocumentPage & { systemCategoryCounts: Record<string, number>; userCategoryCounts: Record<string, number>; userCategories: string[] }> {
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    const keyword = query.trim().toLowerCase()
    const normalizedSystem = systemCategory.trim()
    const boundary = cursor && /^\d+$/.test(cursor) ? Number(cursor) : Number.POSITIVE_INFINITY
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 30, 100))
    const page: LocalKnowledgeIndexRecord[] = []
    const systemCategoryCounts: Record<string, number> = {}
    const userCategoryCounts: Record<string, number> = {}
    let total = 0
    let eligible = 0
    await forEachIndex(path, (record) => {
      const category = record.systemCategory || '待分类'
      const personal = record.userCategory || '未分类'
      systemCategoryCounts[category] = (systemCategoryCounts[category] ?? 0) + 1
      userCategoryCounts[personal] = (userCategoryCounts[personal] ?? 0) + 1
      const matchesQuery = !keyword || `${record.title}\n${record.source}\n${record.summary ?? ''}`.toLowerCase().includes(keyword)
      const matchesSystem = !normalizedSystem || category === normalizedSystem
      const matchesUser = userCategory === undefined || (userCategory === '' ? !record.userCategory : record.userCategory === userCategory)
      if (!matchesQuery || !matchesSystem || !matchesUser) return
      total += 1
      if (record.sequence >= boundary) return
      eligible += 1
      page.push(record)
      if (page.length > safeLimit) page.shift()
    })
    page.reverse()
    const oldest = page.at(-1)
    const categories = await readUserCategories(path)
    return {
      items: page.map(({ id, title, source, createdAt, updatedAt, contentLength, summary, summarySource, systemCategory: category, userCategory: personal }) => ({ id, title, source, createdAt, updatedAt, contentLength, summary, summarySource, systemCategory: category, userCategory: personal })),
      ...(eligible > page.length && oldest ? { nextCursor: String(oldest.sequence) } : {}),
      hasMore: eligible > page.length,
      total: keyword || normalizedSystem || userCategory !== undefined ? total : manifest.documentCount,
      systemCategoryCounts,
      userCategoryCounts,
      userCategories: categories,
    }
  })
}

/** 创建用户二次分类；空分类也独立持久化，便于先建目录再整理资料。 */
export async function createLocalUserCategory(path: string, name: string): Promise<string[]> {
  const normalized = name.replace(/\s+/g, ' ').trim()
  if (!normalized || normalized.length > 80) throw new Error('分类名称必须为 1 到 80 个字符')
  return withStoreLock(path, async () => {
    await ensureIndexedStore(path)
    const current = await readUserCategories(path)
    if (current.some((value) => value.toLowerCase() === normalized.toLowerCase())) throw new Error('已存在同名分类')
    const categories = [...current, normalized]
    await atomicWrite(categoriesPath(path), `${JSON.stringify({ version: 1, categories } satisfies LocalUserCategoryStore, null, 2)}\n`)
    return categories
  })
}

/** 替换一份本地资料正文并原子重建摘要、分类和检索索引。 */
export async function replaceLocalDocumentContent(path: string, id: string, content: string, summary?: string): Promise<LocalKnowledgeDocument> {
  const cleanContent = content.trim()
  if (!cleanContent) throw new Error('资料正文不能为空')
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    const document = await readIndexedDocument(path, id)
    const sequence = await findSequence(path, id)
    if (sequence === undefined) throw new Error('资料不存在')
    const updated: LocalKnowledgeDocument = {
      ...document,
      content: cleanContent,
      updatedAt: new Date().toISOString(),
      summary: summary === undefined ? buildExtractiveSummary(cleanContent, document.title) : normalizeMarkdownSummary(summary),
      summarySource: 'extractive',
      systemCategory: classifyLocalDocument(document.title, cleanContent),
    }
    if (!updated.summary) throw new Error('资料摘要不能为空')
    const record = toIndexRecord(updated, sequence)
    await atomicWrite(journalPath(path), `${JSON.stringify({ version: 2, document: updated, record } satisfies LocalWriteJournal)}\n`)
    await atomicWrite(resolveContentPath(path, record.contentFile), `${JSON.stringify(updated)}\n`)
    await replaceIndexRecord(path, record)
    await saveManifest(path, manifest)
    await unlink(journalPath(path))
    return updated
  })
}

/** 更新本地摘要、摘要来源、系统初分类或用户二次分类。 */
export async function updateLocalDocumentMetadata(
  path: string,
  id: string,
  patch: { summary?: string; summarySource?: 'extractive' | 'model'; systemCategory?: string; userCategory?: string | null },
): Promise<LocalKnowledgeDocument> {
  return withStoreLock(path, async () => {
    const manifest = await ensureIndexedStore(path)
    const document = await readIndexedDocument(path, id)
    const sequence = await findSequence(path, id)
    if (sequence === undefined) throw new Error('资料不存在')
    const summary = patch.summary === undefined ? document.summary : normalizeMarkdownSummary(patch.summary)
    if (summary !== undefined && (!summary || summary.length > 5000)) throw new Error('摘要必须为 1 到 5000 个字符')
    const systemCategory = patch.systemCategory === undefined ? document.systemCategory : patch.systemCategory.replace(/\s+/g, ' ').trim()
    if (systemCategory !== undefined && (!systemCategory || systemCategory.length > 80)) throw new Error('系统分类必须为 1 到 80 个字符')
    const userCategory = patch.userCategory === undefined ? document.userCategory : patch.userCategory?.replace(/\s+/g, ' ').trim() || null
    if (userCategory && userCategory.length > 80) throw new Error('用户分类最多 80 个字符')
    const updated: LocalKnowledgeDocument = {
      ...document,
      updatedAt: new Date().toISOString(),
      ...(summary !== undefined ? { summary } : {}),
      ...(patch.summarySource !== undefined ? { summarySource: patch.summarySource } : {}),
      ...(systemCategory !== undefined ? { systemCategory } : {}),
      ...(patch.userCategory !== undefined ? { userCategory } : {}),
    }
    if (userCategory) {
      const categories = await readUserCategories(path)
      if (!categories.includes(userCategory)) await atomicWrite(categoriesPath(path), `${JSON.stringify({ version: 1, categories: [...categories, userCategory] } satisfies LocalUserCategoryStore, null, 2)}\n`)
    }
    const record = toIndexRecord(updated, sequence)
    await atomicWrite(journalPath(path), `${JSON.stringify({ version: 2, document: updated, record } satisfies LocalWriteJournal)}\n`)
    await atomicWrite(resolveContentPath(path, record.contentFile), `${JSON.stringify(updated)}\n`)
    await replaceIndexRecord(path, record)
    await saveManifest(path, manifest)
    await unlink(journalPath(path))
    return updated
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

async function findSequence(path: string, id: string): Promise<number | undefined> {
  let sequence: number | undefined
  await forEachIndex(path, (record) => { if (record.id === id) sequence = record.sequence })
  return sequence
}

async function readUserCategories(path: string): Promise<string[]> {
  try {
    const value = JSON.parse((await readFile(categoriesPath(path), 'utf8')).replace(/^\uFEFF/, '')) as Partial<LocalUserCategoryStore>
    return value.version === 1 && Array.isArray(value.categories)
      ? [...new Set(value.categories.map((item) => String(item).replace(/\s+/g, ' ').trim()).filter(Boolean))]
      : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw new Error('本地知识库分类文件无法读取')
  }
}

function buildExtractiveSummary(content: string, title = ''): string {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, '')
  const candidates = normalized
    .split(/(?<=[。！？!?\.])\s+|\n+/)
    .map((value) => value.replace(/^#{1,6}\s+|^[-*+]\s+/, '').trim())
    .filter((value) => isSummaryCandidate(value) && value.toLowerCase().replace(/\s+/g, '') !== normalizedTitle)
  const selected: string[] = []
  const seen = new Set<string>()
  let length = 0
  for (const segment of candidates) {
    const key = segment.toLowerCase().replace(/\s+/g, '')
    if (seen.has(key)) continue
    if (selected.length >= 5 || length + segment.length > 700) break
    seen.add(key); selected.push(segment); length += segment.length
  }
  const fallback = normalized.split('\n').map((value) => value.trim()).find((value) => isSummaryCandidate(value) && value.toLowerCase().replace(/\s+/g, '') !== normalizedTitle) || '暂无可提取的知识点摘要。'
  const bullets = (selected.length ? selected : [fallback.slice(0, 600)]).map((value) => `- ${value}`)
  return `## 知识点摘要\n\n${bullets.join('\n')}`
}

/** 自动提要忽略导入元数据、RAG 预览模板、纯时间标题和其他非知识内容。 */
function isSummaryCandidate(value: string): boolean {
  if (!value || /^\d+[.)、]?$/u.test(value)) return false
  if (/^(?:>\s*)?当前项目资料导入[；;]/u.test(value)) return false
  if (/^(?:>\s*)?当前页面由该资料已入库的\s*RAG\s*原文片段组成/u.test(value)) return false
  if (/^(?:>\s*)?(?:幻灯片\s*\d+\s*[·・]?\s*)?时间\s*\d{1,2}:\d{2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2}:\d{2})?$/u.test(value)) return false
  if (/^\d{1,2}:\d{2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2}:\d{2})?$/u.test(value)) return false
  if (/^当前页面由/u.test(value) || /^RAG Source$/iu.test(value)) return false
  return value.length >= 12
}

/** 复用当前项目的 Markdown 摘要规范：保留标题、列表、表格和代码块结构。 */
export function normalizeMarkdownSummary(value: string): string {
  const lines = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').map((line) => line.replace(/[ \t]+$/g, ''))
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return ''
  const markdown = /^#{1,6}\s|^[-*+]\s|^\d+[.)]\s|^>\s|^```|^\|/m.test(text)
  return markdown ? text.slice(0, 5000) : `## 知识点摘要\n\n${text.slice(0, 4950)}`
}

function classifyLocalDocument(title: string, content: string): string {
  const corpus = `${title}\n${content}`.toLowerCase()
  const categories: Array<[string, RegExp]> = [
    ['面试复习', /面经|面试题|八股|interview question/],
    ['课程笔记', /课程|教程|讲义|课堂|教学|course|tutorial|lesson/],
    ['技术原理', /原理|机制|算法|架构|分布式|数据库|缓存|向量|rag|embedding|algorithm|architecture|database|distributed/],
    ['语言学习', /英语|日语|韩语|语法|词汇|口语|english|japanese|grammar|vocabulary/],
    ['考试复习', /考试|考纲|真题|错题|quiz|exam|test preparation/],
  ]
  return categories.find(([, pattern]) => pattern.test(corpus))?.[0] ?? '学习资料'
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
