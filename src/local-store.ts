import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'

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

interface LocalKnowledgeStoreData {
  version: 1
  documents: LocalKnowledgeDocument[]
}

const TOKEN_PATTERN = /[\p{Script=Han}]|[a-zA-Z][a-zA-Z0-9_+#.-]*/gu

/** 将用户目录快捷写法解析为实际本地资料库路径。 */
export function resolveLocalStorePath(configuredPath: string): string {
  const expanded = configuredPath.trim().replace(/^~(?=[\\/])/, homedir())
  return resolve(expanded || `${homedir()}/.dsh/project-knowledge-review/knowledge.json`)
}

/** 从中文、英文和技术标识中提取可用于零配置词法检索的 token。 */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_PATTERN) ?? []).filter((token) => token.length > 0)
}

async function readStore(path: string): Promise<LocalKnowledgeStoreData> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<LocalKnowledgeStoreData>
    return { version: 1, documents: Array.isArray(parsed.documents) ? parsed.documents : [] }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, documents: [] }
    throw new Error('本地知识库文件无法读取，请检查 localStorePath 是否指向合法 JSON 文件')
  }
}

async function saveStore(path: string, data: LocalKnowledgeStoreData): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.tmp`
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(temporary, path)
}

/** 将纯文本资料持久化到插件本地 JSON 知识库，不依赖数据库、向量或 API Key。 */
export async function addLocalDocument(path: string, title: string, content: string, source = '用户粘贴文本'): Promise<LocalKnowledgeDocument> {
  const cleanTitle = title.trim()
  const cleanContent = content.trim()
  if (!cleanTitle || !cleanContent) throw new Error('资料标题和内容不能为空')
  const store = await readStore(path)
  const document: LocalKnowledgeDocument = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: cleanTitle,
    source: source.trim() || '用户粘贴文本',
    content: cleanContent,
    createdAt: new Date().toISOString(),
  }
  store.documents.push(document)
  await saveStore(path, store)
  return document
}

/** 使用 BM25 风格的词项覆盖率检索本地资料，并返回可追溯文本片段。 */
export async function searchLocalKnowledge(path: string, question: string, topK: number): Promise<LocalEvidence[]> {
  const terms = [...new Set(tokenize(question))]
  if (!terms.length) return []
  const store = await readStore(path)
  const results: LocalEvidence[] = []
  for (const document of store.documents) {
    const text = `${document.title}\n${document.content}`
    const normalized = text.toLowerCase()
    const matches = terms.filter((term) => normalized.includes(term))
    if (!matches.length) continue
    const coverage = matches.length / terms.length
    const titleBoost = terms.filter((term) => document.title.toLowerCase().includes(term)).length / terms.length * 0.15
    const position = Math.min(...matches.map((term) => normalized.indexOf(term)))
    const start = Math.max(0, position - 180)
    const snippet = text.slice(start, start + 700).replace(/\s+/g, ' ').trim()
    results.push({ documentTitle: document.title, source: document.source, snippet, score: Number((coverage + titleBoost).toFixed(3)) })
  }
  return results.sort((left, right) => right.score - left.score).slice(0, Math.max(1, Math.min(topK, 10)))
}

/** 返回本地知识库概览，供用户确认资料是否已真正写入。 */
export async function localKnowledgeOverview(path: string): Promise<{ documentCount: number; storePath: string }> {
  const store = await readStore(path)
  return { documentCount: store.documents.length, storePath: path }
}
