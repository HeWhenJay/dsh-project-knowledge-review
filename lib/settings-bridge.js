import { KNOWLEDGE_SETTINGS_NAMESPACE } from './settings.js';
const PREFIX = '/api/project-knowledge-review/settings';
const MAX_BODY_BYTES = 64 * 1024;
/** 为 rc.6 的第三方 namespace 白名单限制提供仅回环设置桥接。 */
export function registerSettingsBridge(ctx) {
    ctx.inject(['webServer', 'settings'], (bridgeCtx) => {
        bridgeCtx.effect(() => bridgeCtx.webServer.register({ kind: 'exact', path: PREFIX, handler: (req, res) => handleSettings(bridgeCtx, req, res) }), 'project-knowledge-review: settings bridge');
    });
}
async function handleSettings(ctx, req, res) {
    if (!isLoopback(req.socket.remoteAddress))
        return send(res, 403, { ok: false, message: '设置接口仅允许本机访问' });
    try {
        if (req.method === 'GET') {
            const descriptor = ctx.settings.describe({ redactSecrets: true }).find((item) => item.ns === KNOWLEDGE_SETTINGS_NAMESPACE);
            if (!descriptor)
                return send(res, 404, { ok: false, message: '知识复习设置尚未注册' });
            return send(res, 200, { ok: true, value: descriptor.value, revision: descriptor.revision, writable: ctx.settings.writable });
        }
        if (req.method === 'POST') {
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
        return send(res, 400, { ok: false, message: error instanceof Error ? error.message : '设置写入失败' });
    }
}
const ALLOWED_FIELDS = new Set([
    'enabled', 'mode', 'localStorePath', 'projectName', 'ragBaseUrl', 'requestTimeoutMs',
    'ocrEnabled', 'ocrBaseUrl', 'ocrModel', 'ocrApiKeyEnv',
    'asrEnabled', 'asrBaseUrl', 'asrModel', 'asrApiKeyEnv',
]);
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
function isLoopback(address) {
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}
function send(res, status, payload) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(payload));
}
