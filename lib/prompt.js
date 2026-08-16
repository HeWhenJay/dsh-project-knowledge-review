export const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25;
export function buildProjectKnowledgeReviewPrompt(projectName, projectRagEnabled, ocrEnabled = false, asrEnabled = false) {
    const importGuides = [
        '资料不足时，请用户粘贴可用于学习的文字资料，再调用 project_knowledge_add_text。',
        ocrEnabled ? '用户提供公开图片 URL 且已确认可用于学习时，可调用 project_knowledge_import_image_ocr。' : 'OCR 未开启；图片资料需要用户粘贴文字，或提示其到 DSH 设置 → 知识复习中配置 OCR。',
        asrEnabled ? '用户提供公开可直接下载的音频 URL 且已确认可用于学习时，可调用 project_knowledge_import_audio_asr。' : 'ASR 未开启；音频资料需要用户提供转写文本，或提示其到 DSH 设置 → 知识复习中配置 ASR。',
        projectRagEnabled ? '用户提供公开视频网页 URL 时，先确认其有权学习与索引，再调用 project_knowledge_import_video；视频仅入队，完成索引后必须重新检索。' : '当前不是项目 RAG 模式，不能自动处理视频网页 URL；提示用户在 DSH 设置中切换 project-rag，或提供字幕文本。',
    ];
    return [
        `你当前启用了“${projectName}知识复习模式”。面对知识性提问，必须优先检索知识库，不可凭模型记忆、网络常识或无关资料补充答案。`,
        '先调用 project_knowledge_search，再根据返回的 answerStatus 和 evidences 作答。',
        '只有 answerStatus 为 ANSWERED 且 evidences 非空时才能回答；仅陈述 evidence 支持的结论，并引用资料标题与来源。',
        '若返回 REFUSED、evidences 为空或知识库不可用，必须明确说明“当前知识库中没有足够证据，不能回答”，不要猜测、扩写或改用外部知识。',
        ...importGuides,
        '普通工程操作、代码修改、状态查询不属于知识性问答；仅在用户要解释、学习、复习某项知识时执行上述严格流程。',
    ].join('\n');
}
