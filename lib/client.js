const JSON_HEADERS = { 'content-type': 'application/json' };
function endpoint(baseUrl, path) {
    return `${baseUrl.replace(/\/$/, '')}${path}`;
}
async function requestJson(url, init, timeoutMs) {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const body = await response.text();
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        throw new Error(`RAG 服务返回了非 JSON 响应（HTTP ${response.status}）`);
    }
    if (!response.ok)
        throw new Error(`RAG 服务请求失败（HTTP ${response.status}）`);
    return parsed;
}
export async function searchProjectKnowledge(config, question, topK = 5) {
    return requestJson(endpoint(config.ragBaseUrl, '/api/dsh-plugin/rag/query'), {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ question, topK }),
    }, config.requestTimeoutMs);
}
export async function projectKnowledgeOverview(config) {
    return requestJson(endpoint(config.ragBaseUrl, '/api/dsh-plugin/rag/overview'), { method: 'GET' }, config.requestTimeoutMs);
}
export async function listProjectMaterials(config, cursor, limit = 30, query = '') {
    const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 100))) });
    if (cursor)
        params.set('cursor', cursor);
    if (query.trim())
        params.set('query', query.trim());
    return requestJson(endpoint(config.ragBaseUrl, `/api/dsh-plugin/rag/materials?${params}`), { method: 'GET' }, config.requestTimeoutMs);
}
export async function previewProjectMaterial(config, materialId) {
    if (!/^\d+$/.test(materialId))
        throw new Error('资料 ID 不合法');
    return requestJson(endpoint(config.ragBaseUrl, `/api/dsh-plugin/rag/materials/${materialId}/preview`), { method: 'GET' }, config.requestTimeoutMs);
}
export async function importProjectVideo(config, url, highPrecision = false) {
    return requestJson(endpoint(config.ragBaseUrl, '/api/dsh-plugin/rag/materials/url'), {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ url, highPrecision, confirmedAuthorized: true }),
    }, config.requestTimeoutMs);
}
