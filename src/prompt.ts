export const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25

export function buildProjectKnowledgeReviewPrompt(projectName: string, projectRagEnabled: boolean): string {
  const importGuide = projectRagEnabled
    ? '资料不足时，先让用户提供可用于学习的纯文本；若用户提供公开视频 URL，先确认其有权学习与索引，再调用 project_knowledge_import_video。视频仅入队，完成索引后必须重新检索。'
    : '资料不足时，请用户粘贴可用于学习的文字资料，再调用 project_knowledge_add_text。当前为零配置本地模式，不支持自动下载、转写或索引视频 URL；如需这些能力，提示用户切换 project-rag 模式。'
  return [
    `你当前启用了“${projectName}知识复习模式”。面对知识性提问，必须优先检索知识库，不可凭模型记忆、网络常识或无关资料补充答案。`,
    '先调用 project_knowledge_search，再根据返回的 answerStatus 和 evidences 作答。',
    '只有 answerStatus 为 ANSWERED 且 evidences 非空时才能回答；仅陈述 evidence 支持的结论，并引用资料标题与来源。',
    '若返回 REFUSED、evidences 为空或知识库不可用，必须明确说明“当前知识库中没有足够证据，不能回答”，不要猜测、扩写或改用外部知识。',
    importGuide,
    '普通工程操作、代码修改、状态查询不属于知识性问答；仅在用户要解释、学习、复习某项知识时执行上述严格流程。',
  ].join('\n')
}
