import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
const AUDIO_MAX_BYTES = 100 * 1024 * 1024;
/** 使用 OpenAI 兼容视觉接口识别图片文字。 */
export async function recognizeImageUrl(config, imageUrl) {
    const media = await downloadPublicMedia(imageUrl, IMAGE_MAX_BYTES, config.timeoutMs);
    if (!media.contentType.startsWith('image/'))
        throw new Error('URL 返回的内容不是图片');
    const endpoint = joinApiPath(config.baseUrl, 'chat/completions');
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: apiHeaders(config.apiKey),
        signal: AbortSignal.timeout(config.timeoutMs),
        body: JSON.stringify({
            model: config.model,
            temperature: 0,
            messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: '请完整识别图片中的文字，保留标题、段落、列表和表格语义。只输出识别文本，不要解释。' },
                        { type: 'image_url', image_url: { url: `data:${media.contentType};base64,${media.bytes.toString('base64')}` } },
                    ],
                }],
        }),
    });
    const payload = await jsonResponse(response);
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim())
        throw new Error('OCR 服务没有返回可用文字');
    return text.trim();
}
/** 使用 OpenAI 兼容 audio/transcriptions 接口转写可直接下载的音频 URL。 */
export async function transcribeAudioUrl(config, audioUrl) {
    const media = await downloadPublicMedia(audioUrl, AUDIO_MAX_BYTES, config.timeoutMs);
    const form = new FormData();
    form.set('model', config.model);
    const arrayBuffer = media.bytes.buffer.slice(media.bytes.byteOffset, media.bytes.byteOffset + media.bytes.byteLength);
    form.set('file', new Blob([arrayBuffer], { type: media.contentType }), media.filename);
    const headers = {};
    if (config.apiKey?.trim())
        headers.authorization = `Bearer ${config.apiKey.trim()}`;
    const response = await fetch(joinApiPath(config.baseUrl, 'audio/transcriptions'), {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(config.timeoutMs),
        body: form,
    });
    const payload = await jsonResponse(response);
    const text = payload?.text;
    if (typeof text !== 'string' || !text.trim())
        throw new Error('ASR 服务没有返回可用转写文本');
    return text.trim();
}
function apiHeaders(apiKey) {
    return {
        'content-type': 'application/json',
        ...(apiKey?.trim() ? { authorization: `Bearer ${apiKey.trim()}` } : {}),
    };
}
function joinApiPath(baseUrl, path) {
    return `${baseUrl.replace(/\/$/, '')}/${path}`;
}
async function jsonResponse(response) {
    const text = await response.text();
    let payload;
    try {
        payload = JSON.parse(text);
    }
    catch {
        throw new Error(`模型服务返回了非 JSON 响应（HTTP ${response.status}）`);
    }
    if (!response.ok) {
        const message = payload?.error?.message ?? payload?.message ?? `HTTP ${response.status}`;
        throw new Error(`模型服务请求失败：${String(message)}`);
    }
    return payload;
}
async function downloadPublicMedia(rawUrl, maxBytes, timeoutMs) {
    let current = new URL(rawUrl);
    for (let redirect = 0; redirect < 5; redirect += 1) {
        await assertPublicHttpUrl(current);
        const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location)
                throw new Error('媒体 URL 重定向缺少 Location');
            current = new URL(location, current);
            continue;
        }
        if (!response.ok)
            throw new Error(`媒体下载失败（HTTP ${response.status}）`);
        const declared = Number(response.headers.get('content-length') ?? 0);
        if (declared > maxBytes)
            throw new Error(`媒体文件超过大小限制 ${Math.floor(maxBytes / 1024 / 1024)}MB`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.byteLength > maxBytes)
            throw new Error(`媒体文件超过大小限制 ${Math.floor(maxBytes / 1024 / 1024)}MB`);
        const contentType = (response.headers.get('content-type') ?? 'application/octet-stream').split(';')[0].trim();
        const filename = decodeURIComponent(current.pathname.split('/').pop() || 'media.bin');
        return { bytes, contentType, filename };
    }
    throw new Error('媒体 URL 重定向次数过多');
}
async function assertPublicHttpUrl(url) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
        throw new Error('媒体 URL 只允许 http 或 https');
    if (url.username || url.password)
        throw new Error('媒体 URL 不允许携带用户名或密码');
    const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address)))
        throw new Error('媒体 URL 不能指向本机或私有网络地址');
}
function isPrivateAddress(address) {
    const normalized = address.toLowerCase();
    if (normalized === '::1' || normalized === '0.0.0.0' || normalized === '127.0.0.1')
        return true;
    if (normalized.startsWith('10.') || normalized.startsWith('127.') || normalized.startsWith('169.254.') || normalized.startsWith('192.168.'))
        return true;
    const match = /^172\.(\d+)\./.exec(normalized);
    if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
        return true;
    return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:') || normalized === '::';
}
