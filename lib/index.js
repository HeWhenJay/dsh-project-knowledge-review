import { defineTool } from '@deepseek-ai/dsh-tools';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { installSettingsSection } from '@deepseek-ai/dsh-settings';
import { importProjectVideo, listProjectMaterials, projectKnowledgeOverview, searchProjectKnowledge } from './client.js';
import { addLocalDocument, listLocalDocuments, localKnowledgeOverview, resolveLocalStorePath, searchLocalKnowledge } from './local-store.js';
import { classifyKnowledgeIntent } from './intent.js';
import { recognizeImageUrl, transcribeAudioUrl } from './media-services.js';
import { buildProjectKnowledgeReviewPrompt, PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER } from './prompt.js';
import { registerSettingsBridge } from './settings-bridge.js';
import { KnowledgeSettingsSchema, KNOWLEDGE_SETTINGS_NAMESPACE, validateKnowledgeSettings } from './settings.js';
export const name = 'project-knowledge-review';
export const inject = ['tools', 'systemPrompt'];
export const Config = KnowledgeSettingsSchema;
function refused(message, refusalReason) {
    return JSON.stringify({ answerStatus: 'REFUSED', message, refusalReason, evidences: [] });
}
function disabled() {
    return refused('知识复习服务当前已在 DSH 设置中关闭，不能检索或写入资料。', '服务已关闭');
}
function renderProjectSearch(value, policy) {
    const data = value.data;
    if (!data || data.answerStatus !== 'ANSWERED' || !data.evidences?.length) {
        if (policy === 'reference')
            return JSON.stringify({ answerStatus: 'REFERENCE_MISS', answerPolicy: policy, knowledgeBaseMatched: false, modelSupplementAllowed: true, requiredSections: ['知识库内容', '模型补充'], message: '知识库未命中。“知识库内容”必须明确写未命中；通用知识只能放在“模型补充”小节，不能冒充知识库结论。', evidences: [] });
        return refused('当前知识库中没有足够证据，不能回答。请提供可用于学习的资料文本、文件内容或公开视频 URL。', data?.refusalReason ?? value.msg ?? '项目 RAG 证据不足');
    }
    return JSON.stringify({ answerStatus: 'ANSWERED', answerPolicy: policy, knowledgeBaseMatched: true, modelSupplementAllowed: policy === 'reference', requiredSections: policy === 'reference' ? ['知识库内容', '模型补充'] : ['知识库内容'], answer: data.answer, confidence: data.confidence, evidences: data.evidences, instruction: policy === 'strict' ? '仅依据 evidence 回答。' : '优先依据 evidence，并将额外模型知识单独放入“模型补充”小节。' });
}
export function apply(ctx, config) {
    let current = () => config;
    installSettingsSection(ctx, KNOWLEDGE_SETTINGS_NAMESPACE, KnowledgeSettingsSchema, config, {
        setSource: (source) => { current = source; },
        onChange: () => ctx.emit('system-prompt/change'),
        validate: validateKnowledgeSettings,
    });
    registerSettingsBridge(ctx, () => current());
    ctx.systemPrompt.section({
        name: 'project-knowledge-review',
        order: PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER,
        text: () => {
            const settings = current();
            return settings.enabled ? buildProjectKnowledgeReviewPrompt(settings) : '';
        },
    });
    ctx.tools.register(defineTool({
        name: 'project_knowledge_overview',
        description: '查询知识库自身信息：已有资料数量/标题/来源、存储位置、作用域、是否与当前项目共用。此类问题不要调用 project_knowledge_search。',
        parameters: {
            question: { type: 'string', required: true, description: '用户关于知识库状态、清单、位置或共享范围的问题。' },
            limit: { type: 'integer', description: '随概览返回的最近资料标题数，默认 10，最大 50。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            const intent = classifyKnowledgeIntent(args.question);
            const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
            try {
                if (settings.mode === 'local') {
                    const path = resolveLocalStorePath(settings.localStorePath);
                    const [overview, page] = await Promise.all([localKnowledgeOverview(path), listLocalDocuments(path, undefined, limit)]);
                    return JSON.stringify({ intent, mode: 'local', answerPolicy: settings.answerPolicy, documentCount: overview.documentCount, storePath: overview.storePath, scope: 'DSH 用户级全局本地库', sharedWithCurrentProject: false, sharingExplanation: '资料存于 DSH 用户目录，不按当前工作区隔离；同一 DSH 用户的其他项目会使用同一 localStorePath。', recentMaterials: page.items });
                }
                const ragConfig = { ragBaseUrl: settings.ragBaseUrl, requestTimeoutMs: settings.requestTimeoutMs };
                const [payload, page] = await Promise.all([projectKnowledgeOverview(ragConfig), listProjectMaterials(ragConfig, undefined, limit)]);
                return JSON.stringify({ intent, mode: 'project-rag', answerPolicy: settings.answerPolicy, materialCount: payload.data?.materialCount ?? 0, chunkCount: payload.data?.chunkCount ?? 0, scope: 'DSH 插件固定 RAG 分区', partition: 'DSH_PLUGIN_RAG_USER_ID（默认 dsh-plugin）', sharedWithCurrentProject: false, sharingExplanation: '插件使用独立固定用户分区，不自动等同于当前项目网站登录用户的资料库。', lastIndexedTitle: payload.data?.lastIndexedTitle, recentMaterials: page.data?.items ?? [] });
            }
            catch (error) {
                return JSON.stringify({ status: 'UNAVAILABLE', intent, mode: settings.mode, message: '知识库状态接口当前不可用。', error: messageOf(error), knownConfiguration: settings.mode === 'local' ? { storePath: resolveLocalStorePath(settings.localStorePath), scope: 'DSH 用户级全局本地库' } : { ragBaseUrl: settings.ragBaseUrl, partition: 'DSH_PLUGIN_RAG_USER_ID' } });
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_search',
        description: '检索知识复习插件当前配置的知识库。必须先检索、有 evidence 才能回答；服务关闭或证据不足时返回 REFUSED。',
        parameters: {
            question: { type: 'string', required: true, description: '用户希望学习或复习的具体知识问题。' },
            topK: { type: 'integer', description: '返回证据数，默认 5，范围 1 到 10。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            const intent = classifyKnowledgeIntent(args.question);
            if (intent === 'knowledge-inventory')
                return JSON.stringify({ answerStatus: 'ROUTE_TO_OVERVIEW', intent, message: '这是知识库状态/清单问题，请改调 project_knowledge_overview，不要执行 evidence 问答检索。', evidences: [] });
            try {
                if (settings.mode === 'project-rag') {
                    return renderProjectSearch(await searchProjectKnowledge({ ragBaseUrl: settings.ragBaseUrl, requestTimeoutMs: settings.requestTimeoutMs }, args.question, args.topK ?? 5), settings.answerPolicy);
                }
                const evidences = await searchLocalKnowledge(resolveLocalStorePath(settings.localStorePath), args.question, args.topK ?? 5);
                if (!evidences.length) {
                    if (settings.answerPolicy === 'reference')
                        return JSON.stringify({ answerStatus: 'REFERENCE_MISS', intent, answerPolicy: settings.answerPolicy, knowledgeBaseMatched: false, modelSupplementAllowed: true, requiredSections: ['知识库内容', '模型补充'], message: '知识库未命中。“知识库内容”必须明确写未命中；通用知识只能放在“模型补充”小节。', evidences: [] });
                    return refused('本地知识库没有足够证据，不能回答。请让用户粘贴学习资料文本，或在设置中启用 OCR/ASR、切换项目 RAG 模式。', '本地资料未命中');
                }
                return JSON.stringify({ answerStatus: 'ANSWERED', intent, answerPolicy: settings.answerPolicy, knowledgeBaseMatched: true, modelSupplementAllowed: settings.answerPolicy === 'reference', requiredSections: settings.answerPolicy === 'reference' ? ['知识库内容', '模型补充'] : ['知识库内容'], answer: settings.answerPolicy === 'strict' ? '请仅依据 evidences 中的资料片段回答，并明确引用资料标题。' : '请优先依据 evidences 回答；额外模型知识必须单独放入“模型补充”小节。', confidence: evidences[0].score, evidences });
            }
            catch (error) {
                return refused('知识库当前不可用，不能依据资料回答。请检查设置、文件权限或项目 RAG 服务状态。', messageOf(error));
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_add_text',
        description: '把用户提供或确认有权使用的纯文本资料写入本地知识库。无需数据库、向量模型或 API Key。',
        parameters: {
            title: { type: 'string', required: true, description: '资料标题，例如“React Hooks 笔记”。' },
            content: { type: 'string', required: true, description: '要保存的学习资料正文。' },
            source: { type: 'string', description: '资料来源，例如课程讲义或用户粘贴笔记。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            try {
                const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, args.content, args.source);
                return JSON.stringify({ status: 'READY', documentId: document.id, title: document.title, message: '资料已写入本地知识库；现在可以基于该资料进行严格问答。' });
            }
            catch (error) {
                return JSON.stringify({ status: 'FAILED', message: '资料未能写入本地知识库。', error: messageOf(error) });
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_import_image_ocr',
        description: '使用 DSH 设置中配置的 OCR 模型识别公开图片 URL，并把识别文本写入本地知识库。仅在 OCR 已开启时使用。',
        parameters: {
            title: { type: 'string', required: true, description: '资料标题。' },
            imageUrl: { type: 'string', required: true, description: '公开可下载的图片 URL，不允许本机或私有网络地址。' },
            source: { type: 'string', description: '资料来源说明。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            if (!settings.ocrEnabled)
                return JSON.stringify({ status: 'DISABLED', message: 'OCR 服务未开启，请在 DSH 设置 → 知识复习中配置并启用。' });
            try {
                const text = await recognizeImageUrl({
                    baseUrl: settings.ocrBaseUrl,
                    model: settings.ocrModel,
                    apiKey: await resolveCredential(ctx, settings.ocrApiKeyEnv),
                    timeoutMs: settings.requestTimeoutMs,
                }, args.imageUrl);
                const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, text, args.source || args.imageUrl);
                return JSON.stringify({ status: 'READY', documentId: document.id, title: document.title, recognizedCharacters: text.length, message: '图片文字已识别并写入本地知识库。' });
            }
            catch (error) {
                return JSON.stringify({ status: 'FAILED', message: 'OCR 识别或资料写入失败。', error: messageOf(error) });
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_import_audio_asr',
        description: '使用 DSH 设置中配置的 ASR 模型转写公开可下载音频 URL，并把转写文本写入本地知识库。仅在 ASR 已开启时使用。',
        parameters: {
            title: { type: 'string', required: true, description: '资料标题。' },
            audioUrl: { type: 'string', required: true, description: '公开可直接下载的音频 URL，不是视频网页分享页。' },
            source: { type: 'string', description: '资料来源说明。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            if (!settings.asrEnabled)
                return JSON.stringify({ status: 'DISABLED', message: 'ASR 服务未开启，请在 DSH 设置 → 知识复习中配置并启用。' });
            try {
                const text = await transcribeAudioUrl({
                    baseUrl: settings.asrBaseUrl,
                    model: settings.asrModel,
                    apiKey: await resolveCredential(ctx, settings.asrApiKeyEnv),
                    timeoutMs: settings.requestTimeoutMs,
                }, args.audioUrl);
                const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, text, args.source || args.audioUrl);
                return JSON.stringify({ status: 'READY', documentId: document.id, title: document.title, transcribedCharacters: text.length, message: '音频已转写并写入本地知识库。' });
            }
            catch (error) {
                return JSON.stringify({ status: 'FAILED', message: 'ASR 转写或资料写入失败。', error: messageOf(error) });
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_import_video',
        description: '把用户已确认有权学习的公开视频网页 URL 加入项目 RAG。仅在服务开启且 mode=project-rag 时可用。',
        parameters: {
            url: { type: 'string', required: true, description: '用户提供且已确认可用于学习的公开视频 URL。' },
            highPrecision: { type: 'boolean', description: '是否使用高精度解析，默认 false。' },
        },
        output: jsonOutput(),
        async execute(args) {
            const settings = current();
            if (!settings.enabled)
                return disabled();
            if (settings.mode !== 'project-rag')
                return JSON.stringify({ status: 'DISABLED', message: '当前是本地模式；视频网页 URL 需要在设置中切换为项目 RAG 模式。' });
            try {
                const value = await importProjectVideo({ ragBaseUrl: settings.ragBaseUrl, requestTimeoutMs: settings.requestTimeoutMs }, args.url, args.highPrecision ?? false);
                return JSON.stringify({ status: value.data?.status ?? 'QUEUED', materialId: value.data?.id, title: value.data?.title, message: '学习视频已提交到项目 RAG 索引队列。索引完成前不能据此回答；完成后请重新提出问题。' });
            }
            catch (error) {
                return JSON.stringify({ status: 'FAILED', message: '视频未能提交到项目 RAG。', error: messageOf(error) });
            }
        },
    }));
    console.log(`[project-knowledge-review] 已加载可热配置知识复习服务，baseMode=${config.mode}`);
}
function jsonOutput() {
    return { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] };
}
async function resolveCredential(ctx, rawRef) {
    const ref = rawRef.trim();
    if (!ref)
        return undefined;
    const value = await ctx.get('credentials')?.resolve(credentialRef(ref));
    if (!value)
        throw new Error(`未配置凭据 ${ref}，请在 DSH 设置 → 知识复习中填写 API Key`);
    return value.value;
}
function messageOf(error) {
    return error instanceof Error ? error.message : '未知错误';
}
