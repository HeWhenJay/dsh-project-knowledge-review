export const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25;
export function buildProjectKnowledgeReviewPrompt(settings) {
    const importGuides = [
        '资料不足时，请用户粘贴可用于学习的文字资料，再调用 project_knowledge_add_text。',
        settings.ocrEnabled ? '用户提供公开图片 URL 且已确认可用于学习时，可调用 project_knowledge_import_image_ocr。' : 'OCR 未开启；图片资料需要用户粘贴文字，或提示其到 DSH 设置 → 知识复习中配置 OCR。',
        settings.asrEnabled ? '用户提供公开可直接下载的音频 URL 且已确认可用于学习时，可调用 project_knowledge_import_audio_asr。' : 'ASR 未开启；音频资料需要用户提供转写文本，或提示其到 DSH 设置 → 知识复习中配置 ASR。',
        '插件不处理视频分享网页；请用户提供有权使用的字幕文本，或先把音频转换为公开可直接下载的 URL。',
    ];
    const policy = settings.answerPolicy === 'strict'
        ? [
            '当前回答策略为“严格知识库”：知识性提问先调用 project_knowledge_search；只有 answerStatus=ANSWERED 且 evidences 非空时才能回答。',
            '仅陈述 evidence 支持的结论并引用资料标题与来源；REFUSED 或无 evidence 时必须明确说明“当前知识库中没有足够证据，不能回答”，不可用模型记忆补齐。',
        ]
        : [
            '当前回答策略为“知识库仅供参考”：知识性提问先调用 project_knowledge_search，把 evidences 作为优先参考上下文。',
            '允许使用当前模型知识补充，但回答必须使用固定小标题“知识库内容”和“模型补充”；无 evidence 时“知识库内容”要明确写未命中，不能把通用知识伪装成资料结论。',
        ];
    return [
        `你当前启用了“${settings.projectName}知识复习模式”。`,
        '先识别用户意图：若用户询问知识库内容、数量、标题、来源、存储位置、作用域或是否与当前项目共享，必须调用 project_knowledge_overview。',
        '若用户在学习或复习某项知识，再按当前回答策略调用 project_knowledge_search。若用户要导入资料，调用对应 add/import 工具。普通工程操作、代码修改、状态查询不属于知识问答。',
        '资料入库后，把工具返回的知识点摘要、系统初分类和保存结果告诉用户；不要声称资料已同步到任何外部项目。',
        ...policy,
        ...importGuides,
    ].join('\n');
}
