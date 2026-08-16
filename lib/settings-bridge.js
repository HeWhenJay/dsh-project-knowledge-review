import { getLocalDocument, listLocalDocuments, localKnowledgeOverview, resolveLocalStorePath } from './local-store.js';
import { listProjectMaterials, previewProjectMaterial, projectKnowledgeOverview } from './client.js';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { KnowledgeSetupService } from './setup-service.js';
import { KNOWLEDGE_SETTINGS_NAMESPACE } from './settings.js';
const SETTINGS_PATH = '/api/project-knowledge-review/settings';
const KNOWLEDGE_PREFIX = '/api/project-knowledge-review/knowledge';
const SETUP_PREFIX = '/api/project-knowledge-review/setup';
const MAX_BODY_BYTES = 64 * 1024;
/** 为 rc.6 的第三方 namespace 白名单限制提供仅回环设置与知识浏览桥接。 */
export function registerSettingsBridge(ctx, current) {
    ctx.inject(['webServer', 'settings'], (bridgeCtx) => {
        const setup = new KnowledgeSetupService(undefined, async () => { await bridgeCtx.settings.update(KNOWLEDGE_SETTINGS_NAMESPACE, { mode: 'project-rag', ragBaseUrl: 'http://127.0.0.1:8090' }); });
        bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'exact', path: SETTINGS_PATH, handler: (req, res) => handleSettings(bridgeCtx, req, res) }), 'project-knowledge-review: settings bridge');
        bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'prefix', path: KNOWLEDGE_PREFIX, handler: (req, res) => handleKnowledge(current, req, res) }), 'project-knowledge-review: knowledge browser bridge');
        bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'prefix', path: SETUP_PREFIX, handler: (req, res) => handleSetup(bridgeCtx, setup, current, req, res) }), 'project-knowledge-review: setup bridge');
    });
}
async function handleSettings(ctx, req, res) {
    if (!isTrustedLocalRequest(req))
        return send(res, 403, { ok: false, message: '设置接口仅允许当前 DSH 页面在本机访问' });
    try {
        if (req.method === 'GET') {
            const descriptor = ctx.settings.describe({ redactSecrets: true }).find((item) => item.ns === KNOWLEDGE_SETTINGS_NAMESPACE);
            if (!descriptor)
                return send(res, 404, { ok: false, message: '知识复习设置尚未注册' });
            return send(res, 200, { ok: true, value: descriptor.value, revision: descriptor.revision, writable: ctx.settings.writable });
        }
        if (req.method === 'POST') {
            requireJsonContentType(req);
            const body = await readJson(req);
            if (typeof body.field !== 'string' || !ALLOWED_FIELDS.has(body.field))
                return send(res, 400, { ok: false, message: '不允许修改该字段' });
            await ctx.settings.update(KNOWLEDGE_SETTINGS_NAMESPACE, { [body.field]: body.value }, typeof body.expectedRevision === 'number' ? body.expectedRevision : undefined);
            const descriptor = ctx.settings.describe({ redactSecrets: true }).find((item) => item.ns === KNOWLEDGE_SETTINGS_NAMESPACE);
            return send(res, 200, { ok: true, value: descriptor?.value, revision: descriptor?.revision, writable: ctx.settings.writable });
        }
        return send(res, 405, { ok: false, message: '请求方法不支持' });
    }
    catch (error) {
        return send(res, 400, { ok: false, message: messageOf(error) });
    }
}
/** 分页返回元数据；原文仅按单条 ID 请求，避免大知识库压入浏览器内存。 */
async function handleKnowledge(current, req, res) {
    if (!isTrustedLocalRequest(req))
        return send(res, 403, { ok: false, message: '知识浏览接口仅允许当前 DSH 页面在本机访问' });
    if (req.method !== 'GET')
        return send(res, 405, { ok: false, message: '请求方法不支持' });
    const settings = current();
    try {
        const url = new URL(req.url ?? KNOWLEDGE_PREFIX, 'http://127.0.0.1');
        const suffix = url.pathname.slice(KNOWLEDGE_PREFIX.length);
        const ragConfig = { ragBaseUrl: settings.ragBaseUrl, requestTimeoutMs: settings.requestTimeoutMs };
        if (suffix === '/overview') {
            if (settings.mode === 'local') {
                const overview = await localKnowledgeOverview(resolveLocalStorePath(settings.localStorePath));
                return send(res, 200, { ok: true, mode: 'local', ...overview, sharedWithCurrentProject: false });
            }
            const payload = await projectKnowledgeOverview(ragConfig);
            return send(res, 200, { ok: true, mode: 'project-rag', scope: 'dsh-plugin-fixed-partition', sharedWithCurrentProject: false, partition: 'DSH_PLUGIN_RAG_USER_ID', ...payload.data });
        }
        if (suffix === '/materials') {
            const cursor = url.searchParams.get('cursor') || undefined;
            const query = url.searchParams.get('query') || '';
            const limit = Number(url.searchParams.get('limit') || 30);
            if (settings.mode === 'local')
                return send(res, 200, { ok: true, mode: 'local', ...(await listLocalDocuments(resolveLocalStorePath(settings.localStorePath), cursor, limit, query)) });
            const payload = await listProjectMaterials(ragConfig, cursor, limit, query);
            return send(res, 200, { ok: true, mode: 'project-rag', items: payload.data?.items ?? [], nextCursor: payload.data?.nextCursor, hasMore: payload.data?.hasMore ?? false, total: payload.data?.total ?? 0 });
        }
        const match = /^\/materials\/([^/]+)\/content$/.exec(suffix);
        if (match) {
            const id = decodeURIComponent(match[1]);
            if (settings.mode === 'local') {
                const document = await getLocalDocument(resolveLocalStorePath(settings.localStorePath), id);
                if (!document)
                    return send(res, 404, { ok: false, message: '资料不存在' });
                return send(res, 200, { ok: true, id: document.id, title: document.title, source: document.source, contentType: 'text/plain; charset=UTF-8', ...previewText(document.content) });
            }
            const payload = await previewProjectMaterial(ragConfig, id);
            if (!payload.data?.content)
                return send(res, 404, { ok: false, message: payload.msg || '资料原文不可用' });
            return send(res, 200, { ok: true, id, ...payload.data, ...previewText(payload.data.content) });
        }
        return send(res, 404, { ok: false, message: '知识浏览路径不存在' });
    }
    catch (error) {
        return send(res, 502, { ok: false, message: `知识浏览失败：${messageOf(error)}` });
    }
}
/** 一键准备只允许本机明确 POST 启动；GET 仅查询状态。 */
async function handleSetup(ctx, setup, current, req, res) {
    if (!isTrustedLocalRequest(req))
        return send(res, 403, { ok: false, message: '一键准备接口仅允许当前 DSH 页面在本机访问' });
    const url = new URL(req.url ?? SETUP_PREFIX, 'http://127.0.0.1');
    const suffix = url.pathname.slice(SETUP_PREFIX.length);
    try {
        if (req.method === 'GET' && (suffix === '' || suffix === '/status'))
            return send(res, 200, { ok: true, ...(await setup.describe()) });
        if (req.method === 'POST' && suffix === '/start') {
            requireJsonContentType(req);
            const body = await readJson(req);
            const settings = current();
            const key = await ctx.get('credentials')?.resolve(credentialRef(settings.ragApiKeyEnv));
            return send(res, 202, { ok: true, ...setup.start(typeof body.installRoot === 'string' ? body.installRoot : undefined, key?.value) });
        }
        return send(res, 404, { ok: false, message: '一键准备路径不存在' });
    }
    catch (error) {
        return send(res, 400, { ok: false, message: messageOf(error) });
    }
}
const ALLOWED_FIELDS = new Set([
    'enabled', 'mode', 'answerPolicy', 'localStorePath', 'projectName', 'ragBaseUrl', 'ragApiKeyEnv', 'requestTimeoutMs',
    'ocrEnabled', 'ocrBaseUrl', 'ocrModel', 'ocrApiKeyEnv',
    'asrEnabled', 'asrBaseUrl', 'asrModel', 'asrApiKeyEnv',
]);
function previewText(content) {
    const maxCharacters = 200_000;
    return { content: content.slice(0, maxCharacters), contentLength: content.length, truncated: content.length > maxCharacters };
}
function requireJsonContentType(req) {
    const value = req.headers['content-type'] ?? '';
    if (!/^application\/json(?:\s*;|$)/i.test(value))
        throw new Error('写入接口只接受 application/json');
}
async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.byteLength;
        if (size > MAX_BODY_BYTES)
            throw new Error('设置请求体过大');
        chunks.push(bytes);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
export function isTrustedLocalRequest(req) {
    const address = req.socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1')
        return false;
    const fetchSite = req.headers['sec-fetch-site'];
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none')
        return false;
    const origin = req.headers.origin;
    if (!origin)
        return req.method === 'GET' || req.method === 'HEAD';
    try {
        const originUrl = new URL(origin);
        const requestHost = req.headers.host?.toLowerCase();
        const loopbackHost = originUrl.hostname === '127.0.0.1' || originUrl.hostname === 'localhost' || originUrl.hostname === '[::1]' || originUrl.hostname === '::1';
        return loopbackHost && (originUrl.protocol === 'http:' || originUrl.protocol === 'https:') && Boolean(requestHost) && originUrl.host.toLowerCase() === requestHost;
    }
    catch {
        return false;
    }
}
function send(res, status, payload) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(payload));
}
function messageOf(error) { return error instanceof Error ? error.message : '未知错误'; }
