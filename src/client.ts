import type { RagQueryPayload, VideoImportPayload } from './types.js'

export interface RagClientConfig {
  ragBaseUrl: string
  requestTimeoutMs: number
}

const JSON_HEADERS: HeadersInit = { 'content-type': 'application/json' }

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

async function requestJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  const body = await response.text()
  let parsed: T
  try {
    parsed = JSON.parse(body) as T
  } catch {
    throw new Error(`RAG 服务返回了非 JSON 响应（HTTP ${response.status}）`)
  }
  if (!response.ok) throw new Error(`RAG 服务请求失败（HTTP ${response.status}）`)
  return parsed
}

export async function searchProjectKnowledge(config: RagClientConfig, question: string, topK = 5): Promise<RagQueryPayload> {
  return requestJson<RagQueryPayload>(endpoint(config.ragBaseUrl, '/api/dsh-plugin/rag/query'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ question, topK }),
  }, config.requestTimeoutMs)
}

export async function importProjectVideo(config: RagClientConfig, url: string, highPrecision = false): Promise<VideoImportPayload> {
  return requestJson<VideoImportPayload>(endpoint(config.ragBaseUrl, '/api/dsh-plugin/rag/materials/url'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ url, highPrecision, confirmedAuthorized: true }),
  }, config.requestTimeoutMs)
}
