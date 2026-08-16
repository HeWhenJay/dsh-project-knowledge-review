import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type {} from '@deepseek-ai/dsh-host-webserver'
import {
  createLocalUserCategory,
  getLocalDocument,
  listLocalDocuments,
  listLocalSummaries,
  localKnowledgeOverview,
  resolveLocalStorePath,
  updateLocalDocumentMetadata,
} from './local-store.js'
import { KNOWLEDGE_SETTINGS_NAMESPACE, type KnowledgeSettings } from './settings.js'

const SETTINGS_PATH = '/api/project-knowledge-review/settings'
const KNOWLEDGE_PREFIX = '/api/project-knowledge-review/knowledge'
const MAX_BODY_BYTES = 64 * 1024

/** 注册独立插件的本机设置、资料浏览、摘要和分类桥接。 */
export function registerSettingsBridge(ctx: Context, current: () => KnowledgeSettings): void {
  ctx.inject(['webServer', 'settings'], (bridgeCtx) => {
    bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'exact', path: SETTINGS_PATH, handler: (req, res) => handleSettings(bridgeCtx, req, res) }), 'project-knowledge-review: settings bridge')
    bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'prefix', path: KNOWLEDGE_PREFIX, handler: (req, res) => handleKnowledge(current, req, res) }), 'project-knowledge-review: local knowledge bridge')
  })
}

async function handleSettings(ctx: Context, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isTrustedLocalRequest(req)) return send(res, 403, { ok: false, message: '设置接口仅允许当前 DSH 页面在本机访问' })
  try {
    if (req.method === 'GET') {
      const descriptor = ctx.settings.describe({ redactSecrets: true }).find((item) => item.ns === KNOWLEDGE_SETTINGS_NAMESPACE)
      if (!descriptor) return send(res, 404, { ok: false, message: '知识复习设置尚未注册' })
      return send(res, 200, { ok: true, value: descriptor.value, revision: descriptor.revision, writable: ctx.settings.writable })
    }
    if (req.method === 'POST') {
      requireJsonContentType(req)
      const body = await readJson(req)
      if (typeof body.field !== 'string' || !ALLOWED_FIELDS.has(body.field)) return send(res, 400, { ok: false, message: '不允许修改该字段' })
      await ctx.settings.update(KNOWLEDGE_SETTINGS_NAMESPACE, { [body.field]: body.value }, typeof body.expectedRevision === 'number' ? body.expectedRevision : undefined)
      const descriptor = ctx.settings.describe({ redactSecrets: true }).find((item) => item.ns === KNOWLEDGE_SETTINGS_NAMESPACE)
      return send(res, 200, { ok: true, value: descriptor?.value, revision: descriptor?.revision, writable: ctx.settings.writable })
    }
    return send(res, 405, { ok: false, message: '请求方法不支持' })
  } catch (error) {
    return send(res, 400, { ok: false, message: messageOf(error) })
  }
}

/** 只访问插件自己的 v2 本地资料库，不代理或识别任何外部项目。 */
async function handleKnowledge(current: () => KnowledgeSettings, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isTrustedLocalRequest(req)) return send(res, 403, { ok: false, message: '知识库接口仅允许当前 DSH 页面在本机访问' })
  const settings = current()
  const path = resolveLocalStorePath(settings.localStorePath)
  try {
    const url = new URL(req.url ?? KNOWLEDGE_PREFIX, 'http://127.0.0.1')
    const suffix = url.pathname.slice(KNOWLEDGE_PREFIX.length)
    if (req.method === 'GET' && suffix === '/overview') {
      const overview = await localKnowledgeOverview(path)
      return send(res, 200, { ok: true, mode: 'local', ...overview, sharedWithCurrentProject: false })
    }
    if (req.method === 'GET' && suffix === '/materials') {
      const page = await listLocalDocuments(path, url.searchParams.get('cursor') || undefined, Number(url.searchParams.get('limit') || 30), url.searchParams.get('query') || '')
      return send(res, 200, { ok: true, mode: 'local', ...page })
    }
    if (req.method === 'GET' && suffix === '/summaries') {
      const userCategoryParam = url.searchParams.has('userCategory') ? url.searchParams.get('userCategory') ?? '' : undefined
      const page = await listLocalSummaries(path, url.searchParams.get('cursor') || undefined, Number(url.searchParams.get('limit') || 30), url.searchParams.get('query') || '', url.searchParams.get('systemCategory') || '', userCategoryParam)
      return send(res, 200, { ok: true, ...page })
    }
    if (req.method === 'POST' && suffix === '/categories') {
      requireJsonContentType(req)
      const body = await readJson(req)
      const categories = await createLocalUserCategory(path, typeof body.name === 'string' ? body.name : '')
      return send(res, 201, { ok: true, categories })
    }
    const contentMatch = /^\/materials\/([^/]+)\/content$/.exec(suffix)
    if (req.method === 'GET' && contentMatch) {
      const id = decodeURIComponent(contentMatch[1])
      const document = await getLocalDocument(path, id)
      if (!document) return send(res, 404, { ok: false, message: '资料不存在' })
      return send(res, 200, { ok: true, id: document.id, title: document.title, source: document.source, contentType: 'text/plain; charset=UTF-8', ...previewText(document.content) })
    }
    const metadataMatch = /^\/materials\/([^/]+)\/metadata$/.exec(suffix)
    if (req.method === 'PUT' && metadataMatch) {
      requireJsonContentType(req)
      const body = await readJson(req)
      const patch: { summary?: string; summarySource?: 'extractive' | 'model'; systemCategory?: string; userCategory?: string | null } = {}
      if (typeof body.summary === 'string') patch.summary = body.summary
      if (body.summarySource === 'extractive' || body.summarySource === 'model') patch.summarySource = body.summarySource
      if (typeof body.systemCategory === 'string') patch.systemCategory = body.systemCategory
      if (typeof body.userCategory === 'string' || body.userCategory === null) patch.userCategory = body.userCategory
      if (!Object.keys(patch).length) return send(res, 400, { ok: false, message: '没有可更新的资料元数据' })
      const document = await updateLocalDocumentMetadata(path, decodeURIComponent(metadataMatch[1]), patch)
      return send(res, 200, { ok: true, item: publicSummary(document) })
    }
    return send(res, 404, { ok: false, message: '知识库路径不存在' })
  } catch (error) {
    return send(res, req.method === 'GET' ? 502 : 400, { ok: false, message: `知识库操作失败：${messageOf(error)}` })
  }
}

const ALLOWED_FIELDS = new Set([
  'enabled', 'answerPolicy', 'localStorePath', 'projectName', 'requestTimeoutMs',
  'ocrEnabled', 'ocrBaseUrl', 'ocrModel', 'ocrApiKeyEnv',
  'asrEnabled', 'asrBaseUrl', 'asrModel', 'asrApiKeyEnv',
])

function publicSummary(document: Awaited<ReturnType<typeof updateLocalDocumentMetadata>>) {
  return { id: document.id, title: document.title, source: document.source, createdAt: document.createdAt, updatedAt: document.updatedAt, contentLength: document.content.length, summary: document.summary, summarySource: document.summarySource, systemCategory: document.systemCategory, userCategory: document.userCategory }
}

function previewText(content: string): { content: string; contentLength: number; truncated: boolean } {
  const maxCharacters = 2_000_000
  return { content: content.slice(0, maxCharacters), contentLength: content.length, truncated: content.length > maxCharacters }
}

function requireJsonContentType(req: IncomingMessage): void {
  const value = req.headers['content-type'] ?? ''
  if (!/^application\/json(?:\s*;|$)/i.test(value)) throw new Error('写入接口只接受 application/json')
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.byteLength
    if (size > MAX_BODY_BYTES) throw new Error('知识库请求体过大')
    chunks.push(bytes)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

export function isTrustedLocalRequest(req: IncomingMessage): boolean {
  const address = req.socket.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') return false
  const origin = req.headers.origin
  if (!origin) return req.method === 'GET' || req.method === 'HEAD'
  try {
    const originUrl = new URL(origin)
    const requestHost = req.headers.host?.toLowerCase()
    const loopbackHost = originUrl.hostname === '127.0.0.1' || originUrl.hostname === 'localhost' || originUrl.hostname === '[::1]' || originUrl.hostname === '::1'
    return loopbackHost && (originUrl.protocol === 'http:' || originUrl.protocol === 'https:') && Boolean(requestHost) && originUrl.host.toLowerCase() === requestHost
  } catch { return false }
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

function messageOf(error: unknown): string { return error instanceof Error ? error.message : '未知错误' }
