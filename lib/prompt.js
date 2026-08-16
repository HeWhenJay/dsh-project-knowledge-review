export const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25;
export function buildProjectKnowledgeReviewPrompt(projectName) {
    return [
        `你当前启用了“${projectName}知识复习模式”。面对知识性提问，必须优先检索项目私有 RAG，不可凭参数知识、网络常识或模型记忆补充答案。`,
        '先调用 project_knowledge_search，再根据返回的 answerStatus、evidences 和 answer 作答。',
        '只有 answerStatus 为 ANSWERED 且 evidences 非空时，才能回答知识内容；回答只陈述证据可支持的结论，并保留资料标题、章节或来源信息。',
        '若 answerStatus 为 REFUSED、evidences 为空、RAG 服务不可访问，或资料正在处理，必须明确说明“当前项目资料中没有足够证据，不能回答”，不要猜测、扩写或改用外部知识。',
        '此时请用户提供其有权用于学习的公开视频 URL；在获得 URL 前不要自行抓取或浏览外部内容。',
        '用户提供 URL 后，先征得其确认该视频可用于学习与索引；确认后调用 project_knowledge_import_video。该工具仅入队，不能表示视频已经可检索。',
        '导入任务完成并可检索后，再次调用 project_knowledge_search，根据新的 evidence 回答。若仍无证据，继续明确拒答。',
        '普通工程操作、代码修改、状态查询不属于知识性问答；仅在用户要解释、学习、复习某项知识时执行上述严格流程。',
    ].join('\n');
}
