import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { importProjectVideo, searchProjectKnowledge } from './client.js';
import { addLocalDocument, localKnowledgeOverview, resolveLocalStorePath, searchLocalKnowledge } from './local-store.js';
import { buildProjectKnowledgeReviewPrompt, PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER } from './prompt.js';
export const name = 'project-knowledge-review';
export const inject = ['tools', 'systemPrompt'];
export const Config = Schema.object({
    mode: Schema.union(['local', 'project-rag']).default('local'),
    localStorePath: Schema.string().default('~/.dsh/project-knowledge-review/knowledge.json'),
    ragBaseUrl: Schema.string().default('http://127.0.0.1:8090'),
    projectName: Schema.string().default('我的知识库'),
    requestTimeoutMs: Schema.number().default(120_000),
});
function refused(message, refusalReason) {
    return JSON.stringify({ answerStatus: 'REFUSED', message, refusalReason, evidences: [] });
}
function renderProjectSearch(value) {
    const data = value.data;
    if (!data || data.answerStatus !== 'ANSWERED' || !data.evidences?.length) {
        return refused('当前知识库中没有足够证据，不能回答。请提供可用于学习的资料文本、文件内容或公开视频 URL。', data?.refusalReason ?? value.msg ?? '项目 RAG 证据不足');
    }
    return JSON.stringify({ answerStatus: 'ANSWERED', answer: data.answer, confidence: data.confidence, evidences: data.evidences });
}
export function apply(ctx, config) {
    const localStorePath = resolveLocalStorePath(config.localStorePath);
    const projectRagEnabled = config.mode === 'project-rag';
    const ragConfig = { ragBaseUrl: config.ragBaseUrl, requestTimeoutMs: config.requestTimeoutMs };
    ctx.systemPrompt.section({
        name: 'project-knowledge-review',
        order: PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER,
        text: buildProjectKnowledgeReviewPrompt(config.projectName, projectRagEnabled),
    });
    ctx.tools.register(defineTool({
        name: 'project_knowledge_search',
        description: projectRagEnabled
            ? '在项目 RAG 知识库中检索知识。知识性问题必须先调用；证据不足时返回 REFUSED。'
            : '在零配置本地知识库中检索用户已添加的纯文本资料。知识性问题必须先调用；不使用向量模型或外部 API。',
        parameters: {
            question: { type: 'string', required: true, description: '用户希望学习或复习的具体知识问题。' },
            topK: { type: 'integer', description: '返回证据数，默认 5，范围 1 到 10。' },
        },
        output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
        async execute(args) {
            try {
                if (projectRagEnabled)
                    return renderProjectSearch(await searchProjectKnowledge(ragConfig, args.question, args.topK ?? 5));
                const evidences = await searchLocalKnowledge(localStorePath, args.question, args.topK ?? 5);
                if (!evidences.length)
                    return refused('本地知识库没有足够证据，不能回答。请让用户粘贴学习资料文本，或切换到项目 RAG 模式后提供公开视频 URL。', '本地资料未命中');
                return JSON.stringify({ answerStatus: 'ANSWERED', answer: '请仅依据 evidences 中的资料片段回答，并明确引用资料标题。', confidence: evidences[0].score, evidences });
            }
            catch (error) {
                return refused('知识库当前不可用，不能依据资料回答。请检查本地文件权限或项目 RAG 服务状态。', error instanceof Error ? error.message : '未知知识库错误');
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_add_text',
        description: '把用户提供或确认有权使用的纯文本学习资料写入零配置本地知识库。无需数据库、向量模型或 API Key。',
        parameters: {
            title: { type: 'string', required: true, description: '资料标题，例如“React Hooks 笔记”。' },
            content: { type: 'string', required: true, description: '要保存的学习资料正文。' },
            source: { type: 'string', description: '资料来源，例如课程讲义或用户粘贴笔记。' },
        },
        output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
        async execute(args) {
            try {
                const document = await addLocalDocument(localStorePath, args.title, args.content, args.source);
                const overview = await localKnowledgeOverview(localStorePath);
                return JSON.stringify({ status: 'READY', documentId: document.id, title: document.title, documentCount: overview.documentCount, message: '资料已写入本地知识库；现在可以基于该资料进行严格问答。' });
            }
            catch (error) {
                return JSON.stringify({ status: 'FAILED', message: '资料未能写入本地知识库。', error: error instanceof Error ? error.message : '未知写入错误' });
            }
        },
    }));
    if (projectRagEnabled) {
        ctx.tools.register(defineTool({
            name: 'project_knowledge_import_video',
            description: '把用户已确认有权用于学习的公开视频 URL 加入项目 RAG。仅创建后台索引任务；完成后必须再次检索才可回答。仅 project-rag 模式可用。',
            parameters: {
                url: { type: 'string', required: true, description: '用户提供且已确认可用于学习的公开视频 URL。' },
                highPrecision: { type: 'boolean', description: '是否使用高精度解析，默认 false。' },
            },
            output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
            async execute(args) {
                try {
                    const value = await importProjectVideo(ragConfig, args.url, args.highPrecision ?? false);
                    return JSON.stringify({ status: value.data?.status ?? 'QUEUED', materialId: value.data?.id, title: value.data?.title, message: '学习视频已提交到项目 RAG 索引队列。索引完成前不能据此回答；完成后请重新提出问题。' });
                }
                catch (error) {
                    return JSON.stringify({ status: 'FAILED', message: '视频未能提交到项目 RAG，请检查链接、服务状态和平台支持范围。', error: error instanceof Error ? error.message : '未知导入错误' });
                }
            },
        }));
    }
    console.log(`[project-knowledge-review] 已启用 ${config.projectName} 知识复习模式，mode=${config.mode}，localStore=${localStorePath}`);
}
