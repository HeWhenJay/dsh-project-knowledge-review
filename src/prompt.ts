import type { KnowledgeSettings } from './settings.js'

export const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25

export function buildProjectKnowledgeReviewPrompt(settings: Pick<KnowledgeSettings, 'projectName' | 'mode' | 'answerPolicy' | 'ocrEnabled' | 'asrEnabled'>): string {
  const projectRagEnabled = settings.mode === 'project-rag'
  const importGuides = [
    '资料不足时，请用户粘贴可用于学习的文字资料，再调用 project_knowledge_add_text。',
    settings.ocrEnabled ? '用户提供公开图片 URL 且已确认可用于学习时，可调用 project_knowledge_import_image_ocr。' : 'OCR 未开启；图片资料需要用户粘贴文字，或提示其到 DSH 设置 → 知识复习中配置 OCR。',
    settings.asrEnabled ? '用户提供公开可直接下载的音频 URL 且已确认可用于学习时，可调用 project_knowledge_import_audio_asr。' : 'ASR 未开启；音频资料需要用户提供转写文本，或提示其到 DSH 设置 → 知识复习中配置 ASR。',
    projectRagEnabled ? '用户提供公开视频网页 URL 时，先确认其有权学习与索引，再调用 project_knowledge_import_video；视频仅入队，完成索引后必须重新检索。' : '当前不是项目 RAG 模式，不能自动处理视频网页 URL；提示用户在 DSH 设置中切换 project-rag，或提供字幕文本。',
  ]
  const policy = settings.answerPolicy === 'strict'
    ? [
        '当前回答策略为“严格知识库”：知识性提问先调用 project_knowledge_search；只有 answerStatus=ANSWERED 且 evidences 非空时才能回答。',
        '仅陈述 evidence 支持的结论并引用资料标题与来源；REFUSED 或无 evidence 时必须明确说明“当前知识库中没有足够证据，不能回答”，不可用模型记忆补齐。',
      ]
    : [
        '当前回答策略为“参考知识库”：知识性提问先调用 project_knowledge_search，把 evidences 作为优先参考上下文。',
        '允许使用当前模型知识补充，但回答必须使用固定小标题“知识库内容”和“模型补充”；无 evidence 时“知识库内容”要明确写未命中，不能把通用知识伪装成资料结论。',
      ]
  return [
    `你当前启用了“${settings.projectName}知识复习模式”。`,
    '先识别用户意图：若用户询问“知识库有哪些内容、数量、标题、来源、存储位置、作用域、是否与当前项目共享”等知识库自身信息，必须调用 project_knowledge_overview；不要把这类问题传给 project_knowledge_search。',
    '若用户在学习或复习某项知识，再按当前回答策略调用 project_knowledge_search。若用户要导入资料，调用对应 add/import 工具。普通工程操作、代码修改、状态查询不属于知识问答。',
    ...policy,
    ...importGuides,
  ].join('\n')
}
