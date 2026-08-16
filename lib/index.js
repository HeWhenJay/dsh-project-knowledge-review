import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { importProjectVideo, searchProjectKnowledge } from './client.js';
import { buildProjectKnowledgeReviewPrompt, PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER } from './prompt.js';
export const name = 'project-knowledge-review';
export const inject = ['tools', 'systemPrompt'];
export const Config = Schema.object({
    ragBaseUrl: Schema.string().default('http://127.0.0.1:8090'),
    projectName: Schema.string().default('学迹智配 Agent'),
    authorizationToken: Schema.string().default(process.env.PROJECT_RAG_BEARER_TOKEN ?? ''),
    requestTimeoutMs: Schema.number().default(120_000),
});
function renderSearchResult(value) {
    const data = value.data;
    if (!data || data.answerStatus !== 'ANSWERED' || !data.evidences?.length) {
        return JSON.stringify({
            answerStatus: 'REFUSED',
            message: '当前项目资料中没有足够证据，不能回答。请用户提供其有权用于学习的公开视频 URL，完成 RAG 索引后再提问。',
            refusalReason: data?.refusalReason ?? value.msg ?? 'RAG 证据不足或不可用',
            evidences: [],
        });
    }
    return JSON.stringify({
        answerStatus: 'ANSWERED',
        answer: data.answer,
        confidence: data.confidence,
        evidences: data.evidences,
    });
}
export function apply(ctx, config) {
    ctx.systemPrompt.section({
        name: 'project-knowledge-review',
        order: PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER,
        text: buildProjectKnowledgeReviewPrompt(config.projectName),
    });
    const ragConfig = {
        ragBaseUrl: config.ragBaseUrl,
        authorizationToken: config.authorizationToken,
        requestTimeoutMs: config.requestTimeoutMs,
    };
    ctx.tools.register(defineTool({
        name: 'project_knowledge_search',
        description: '在当前项目的私有 RAG 学习资料中检索知识。知识性问题必须先调用；证据不足时会返回 REFUSED，禁止自行补充答案。',
        parameters: {
            question: { type: 'string', required: true, description: '用户希望学习或复习的具体知识问题。' },
            topK: { type: 'integer', description: '返回证据数，默认 5，建议 1 到 10。' },
        },
        output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
        async execute(args) {
            if (!ragConfig.authorizationToken.trim()) {
                return JSON.stringify({
                    answerStatus: 'REFUSED',
                    message: '未配置项目 RAG 登录令牌，不能跨过项目的用户资料隔离回答。请设置 PROJECT_RAG_BEARER_TOKEN 后重试。',
                    evidences: [],
                });
            }
            try {
                return renderSearchResult(await searchProjectKnowledge(ragConfig, args.question, args.topK ?? 5));
            }
            catch (error) {
                return JSON.stringify({
                    answerStatus: 'REFUSED',
                    message: '当前项目 RAG 服务不可访问，不能依据项目资料回答。请先启动项目服务或稍后再试。',
                    refusalReason: error instanceof Error ? error.message : '未知 RAG 调用错误',
                    evidences: [],
                });
            }
        },
    }));
    ctx.tools.register(defineTool({
        name: 'project_knowledge_import_video',
        description: '把用户已确认有权用于学习的公开视频 URL 加入当前项目 RAG。仅创建后台索引任务；完成后必须再次检索才可回答。',
        parameters: {
            url: { type: 'string', required: true, description: '用户提供且已确认可用于学习的公开视频 URL。' },
            highPrecision: { type: 'boolean', description: '是否使用高精度解析，默认 false。' },
        },
        output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
        async execute(args) {
            if (!ragConfig.authorizationToken.trim()) {
                return JSON.stringify({
                    status: 'FAILED',
                    message: '未配置项目 RAG 登录令牌，不能跨过项目的用户资料隔离提交视频。请设置 PROJECT_RAG_BEARER_TOKEN 后重试。',
                });
            }
            try {
                const value = await importProjectVideo(ragConfig, args.url, args.highPrecision ?? false);
                return JSON.stringify({
                    status: value.data?.status ?? 'QUEUED',
                    materialId: value.data?.id,
                    title: value.data?.title,
                    message: '学习视频已提交到项目 RAG 索引队列。索引完成前不能据此回答；完成后请重新提出问题。',
                });
            }
            catch (error) {
                return JSON.stringify({
                    status: 'FAILED',
                    message: '视频未能提交到项目 RAG，请检查链接、服务状态和平台支持范围。',
                    error: error instanceof Error ? error.message : '未知导入错误',
                });
            }
        },
    }));
    console.log(`[project-knowledge-review] 已启用 ${config.projectName} 的严格知识复习模式，RAG=${config.ragBaseUrl}`);
}
