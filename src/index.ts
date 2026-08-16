import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'

import { addLocalDocument, listLocalDocuments, localKnowledgeOverview, resolveLocalStorePath, searchLocalKnowledge, updateLocalDocumentMetadata } from './local-store.js'
import { classifyKnowledgeIntent } from './intent.js'
import { recognizeImageUrl, transcribeAudioUrl } from './media-services.js'
import { buildProjectKnowledgeReviewPrompt, PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER } from './prompt.js'
import { registerSettingsBridge } from './settings-bridge.js'
import { KnowledgeSettingsSchema, KNOWLEDGE_SETTINGS_NAMESPACE, validateKnowledgeSettings, type KnowledgeSettings } from './settings.js'

export const name = 'project-knowledge-review'
export const inject = ['tools', 'systemPrompt']
export const Config = KnowledgeSettingsSchema
export type Config = KnowledgeSettings

function refused(message: string, refusalReason: string): string {
  return JSON.stringify({ answerStatus: 'REFUSED', message, refusalReason, evidences: [] })
}

function disabled(): string {
  return refused('知识复习服务当前已在 DSH 设置中关闭，不能检索或写入资料。', '服务已关闭')
}

export function apply(ctx: Context, config: Config): void {
  let current = (): KnowledgeSettings => config
  installSettingsSection(ctx, KNOWLEDGE_SETTINGS_NAMESPACE, KnowledgeSettingsSchema, config, {
    setSource: (source) => { current = source },
    onChange: () => ctx.emit('system-prompt/change'),
    validate: validateKnowledgeSettings,
  })
  registerSettingsBridge(ctx, () => current())

  ctx.systemPrompt.section({
    name: 'project-knowledge-review',
    order: PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER,
    text: () => current().enabled ? buildProjectKnowledgeReviewPrompt(current()) : '',
  })

  ctx.tools.register(defineTool({
    name: 'project_knowledge_overview',
    description: '查询知识库自身信息：已有资料数量/标题/来源、存储位置、作用域、是否与当前项目共用。此类问题不要调用 project_knowledge_search。',
    parameters: {
      question: { type: 'string', required: true, description: '用户关于知识库状态、清单、位置或共享范围的问题。' },
      limit: { type: 'integer', description: '随概览返回的最近资料标题数，默认 10，最大 50。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      const intent = classifyKnowledgeIntent(args.question)
      const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
      try {
        const path = resolveLocalStorePath(settings.localStorePath)
        const [overview, page] = await Promise.all([localKnowledgeOverview(path), listLocalDocuments(path, undefined, limit)])
        return JSON.stringify({
          intent,
          mode: 'local',
          answerPolicy: settings.answerPolicy,
          documentCount: overview.documentCount,
          storePath: overview.storePath,
          scope: 'DSH 插件用户级本地库',
          sharedWithCurrentProject: false,
          sharingExplanation: '公开插件独立保存资料，不连接任何外部项目。其他应用如需个人同步，应自行读取或导入插件的本地资料格式。',
          recentMaterials: page.items,
        })
      } catch (error) {
        return JSON.stringify({ status: 'UNAVAILABLE', intent, mode: 'local', message: '知识库状态接口当前不可用。', error: messageOf(error), knownConfiguration: { storePath: resolveLocalStorePath(settings.localStorePath), scope: 'DSH 插件用户级本地库' } })
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'project_knowledge_search',
    description: '检索知识复习插件自己的本地知识库。必须先检索、有 evidence 才能回答；服务关闭或证据不足时返回 REFUSED。',
    parameters: {
      question: { type: 'string', required: true, description: '用户希望学习或复习的具体知识问题。' },
      topK: { type: 'integer', description: '返回证据数，默认 5，范围 1 到 10。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      const intent = classifyKnowledgeIntent(args.question)
      if (intent === 'knowledge-inventory') return JSON.stringify({ answerStatus: 'ROUTE_TO_OVERVIEW', intent, message: '这是知识库状态/清单问题，请改调 project_knowledge_overview。', evidences: [] })
      try {
        const evidences = await searchLocalKnowledge(resolveLocalStorePath(settings.localStorePath), args.question, args.topK ?? 5)
        if (!evidences.length) {
          if (settings.answerPolicy === 'reference') return JSON.stringify({ answerStatus: 'REFERENCE_MISS', intent, answerPolicy: settings.answerPolicy, knowledgeBaseMatched: false, modelSupplementAllowed: true, requiredSections: ['知识库内容', '模型补充'], message: '知识库未命中。“知识库内容”必须明确写未命中；通用知识只能放在“模型补充”小节。', evidences: [] })
          return refused('当前知识库中没有足够证据，不能回答。请让用户粘贴学习资料文本，或在设置中启用 OCR/ASR。', '本地资料未命中')
        }
        return JSON.stringify({ answerStatus: 'ANSWERED', intent, answerPolicy: settings.answerPolicy, knowledgeBaseMatched: true, modelSupplementAllowed: settings.answerPolicy === 'reference', requiredSections: settings.answerPolicy === 'reference' ? ['知识库内容', '模型补充'] : ['知识库内容'], answer: settings.answerPolicy === 'strict' ? '请仅依据 evidences 中的资料片段回答，并明确引用资料标题。' : '请优先依据 evidences 回答；额外模型知识必须单独放入“模型补充”小节。', confidence: evidences[0].score, evidences })
      } catch (error) {
        return refused('知识库当前不可用，不能依据资料回答。请检查设置与文件权限。', messageOf(error))
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'project_knowledge_add_text',
    description: '把用户提供或确认有权使用的纯文本资料写入插件自己的本地知识库，并返回自动提要与初次分类。无需数据库、向量模型或 API Key。',
    parameters: {
      title: { type: 'string', required: true, description: '资料标题，例如“React Hooks 笔记”。' },
      content: { type: 'string', required: true, description: '要保存的学习资料正文。' },
      source: { type: 'string', description: '资料来源，例如课程讲义或用户粘贴笔记。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      try {
        const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, args.content, args.source)
        return renderImported(document, '资料已写入插件本地知识库。')
      } catch (error) {
        return JSON.stringify({ status: 'FAILED', message: '资料未能写入本地知识库。', error: messageOf(error) })
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'project_knowledge_update_summary',
    description: '在用户要求或当前模型已依据资料生成更准确摘要时，回写一条本地资料的知识点摘要或初次分类。不得写入资料没有支持的结论。',
    parameters: {
      documentId: { type: 'string', required: true, description: 'project_knowledge_add_text 返回的资料 ID。' },
      summary: { type: 'string', required: true, description: '仅依据资料正文生成的知识点摘要。' },
      systemCategory: { type: 'string', description: '可选的系统初次分类。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      try {
        const document = await updateLocalDocumentMetadata(resolveLocalStorePath(settings.localStorePath), args.documentId, { summary: args.summary, summarySource: 'model', ...(args.systemCategory ? { systemCategory: args.systemCategory } : {}) })
        return JSON.stringify({ status: 'UPDATED', documentId: document.id, summary: document.summary, summarySource: document.summarySource, systemCategory: document.systemCategory })
      } catch (error) {
        return JSON.stringify({ status: 'FAILED', message: '知识点摘要未能更新。', error: messageOf(error) })
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'project_knowledge_import_image_ocr',
    description: '使用 DSH 设置中配置的 OCR 模型识别公开图片 URL，写入插件本地知识库，并返回自动提要与初次分类。仅在 OCR 已开启时使用。',
    parameters: {
      title: { type: 'string', required: true, description: '资料标题。' },
      imageUrl: { type: 'string', required: true, description: '公开可下载的图片 URL，不允许本机或私有网络地址。' },
      source: { type: 'string', description: '资料来源说明。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      if (!settings.ocrEnabled) return JSON.stringify({ status: 'DISABLED', message: 'OCR 服务未开启，请在 DSH 设置 → 知识复习中配置并启用。' })
      try {
        const text = await recognizeImageUrl({ baseUrl: settings.ocrBaseUrl, model: settings.ocrModel, apiKey: await resolveCredential(ctx, settings.ocrApiKeyEnv), timeoutMs: settings.requestTimeoutMs }, args.imageUrl)
        const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, text, args.source || args.imageUrl)
        return renderImported(document, '图片文字已识别并写入插件本地知识库。', { recognizedCharacters: text.length })
      } catch (error) {
        return JSON.stringify({ status: 'FAILED', message: 'OCR 识别或资料写入失败。', error: messageOf(error) })
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'project_knowledge_import_audio_asr',
    description: '使用 DSH 设置中配置的 ASR 模型转写公开可下载音频 URL，写入插件本地知识库，并返回自动提要与初次分类。仅在 ASR 已开启时使用。',
    parameters: {
      title: { type: 'string', required: true, description: '资料标题。' },
      audioUrl: { type: 'string', required: true, description: '公开可直接下载的音频 URL，不是视频网页分享页。' },
      source: { type: 'string', description: '资料来源说明。' },
    },
    output: jsonOutput(),
    async execute(args) {
      const settings = current()
      if (!settings.enabled) return disabled()
      if (!settings.asrEnabled) return JSON.stringify({ status: 'DISABLED', message: 'ASR 服务未开启，请在 DSH 设置 → 知识复习中配置并启用。' })
      try {
        const text = await transcribeAudioUrl({ baseUrl: settings.asrBaseUrl, model: settings.asrModel, apiKey: await resolveCredential(ctx, settings.asrApiKeyEnv), timeoutMs: settings.requestTimeoutMs }, args.audioUrl)
        const document = await addLocalDocument(resolveLocalStorePath(settings.localStorePath), args.title, text, args.source || args.audioUrl)
        return renderImported(document, '音频已转写并写入插件本地知识库。', { transcribedCharacters: text.length })
      } catch (error) {
        return JSON.stringify({ status: 'FAILED', message: 'ASR 转写或资料写入失败。', error: messageOf(error) })
      }
    },
  }))

  console.log('[project-knowledge-review] 已加载独立本地知识复习服务')
}

function renderImported(document: Awaited<ReturnType<typeof addLocalDocument>>, message: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ status: 'READY', documentId: document.id, title: document.title, summary: document.summary, summarySource: document.summarySource, systemCategory: document.systemCategory, userCategory: document.userCategory, sharedWithCurrentProject: false, ...extra, message: `${message} 已生成自动提要和初次分类；当前模型如需优化摘要，可调用 project_knowledge_update_summary。` })
}

function jsonOutput() {
  return { schema: { type: 'json' as const }, render: (_args: unknown, value: unknown) => [{ type: 'text' as const, text: String(value) }] }
}

async function resolveCredential(ctx: Context, rawRef: string): Promise<string | undefined> {
  const ref = rawRef.trim()
  if (!ref) return undefined
  const value = await ctx.get('credentials')?.resolve(credentialRef(ref))
  if (!value) throw new Error(`未配置凭据 ${ref}，请在 DSH 设置 → 知识复习中填写 API Key`)
  return value.value
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误'
}
