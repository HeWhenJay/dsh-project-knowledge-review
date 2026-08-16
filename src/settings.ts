import Schema from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

export const KNOWLEDGE_SETTINGS_NAMESPACE = settingsNamespace('project-knowledge-review')
export const OCR_API_KEY_REF = 'DSH_KNOWLEDGE_OCR_API_KEY'
export const ASR_API_KEY_REF = 'DSH_KNOWLEDGE_ASR_API_KEY'

export interface KnowledgeSettings {
  enabled: boolean
  answerPolicy: 'strict' | 'reference'
  localStorePath: string
  projectName: string
  requestTimeoutMs: number
  ocrEnabled: boolean
  ocrBaseUrl: string
  ocrModel: string
  ocrApiKeyEnv: string
  asrEnabled: boolean
  asrBaseUrl: string
  asrModel: string
  asrApiKeyEnv: string
}

export const KnowledgeSettingsSchema: Schema<KnowledgeSettings> = Schema.object({
  enabled: Schema.boolean().default(true),
  answerPolicy: Schema.union(['strict', 'reference']).default('strict'),
  localStorePath: Schema.string().default('~/.dsh/project-knowledge-review/knowledge.json'),
  projectName: Schema.string().default('我的知识库'),
  requestTimeoutMs: Schema.number().min(1000).max(600000).default(120000),
  ocrEnabled: Schema.boolean().default(false),
  ocrBaseUrl: Schema.string().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  ocrModel: Schema.string().default('qwen-vl-ocr'),
  ocrApiKeyEnv: Schema.string().role('credential-ref').default(OCR_API_KEY_REF),
  asrEnabled: Schema.boolean().default(false),
  asrBaseUrl: Schema.string().default('https://api.openai.com/v1'),
  asrModel: Schema.string().default('whisper-1'),
  asrApiKeyEnv: Schema.string().role('credential-ref').default(ASR_API_KEY_REF),
})

export function validateKnowledgeSettings(settings: KnowledgeSettings): void {
  if (!settings.projectName.trim()) throw new Error('知识库名称不能为空')
  if (!settings.localStorePath.trim()) throw new Error('本地知识库路径不能为空')
  if (settings.ocrEnabled) {
    if (!isHttpUrl(settings.ocrBaseUrl)) throw new Error('OCR Base URL 必须使用无用户信息的 http 或 https 地址')
    if (!settings.ocrModel.trim()) throw new Error('OCR 模型不能为空')
  }
  if (settings.asrEnabled) {
    if (!isHttpUrl(settings.asrBaseUrl)) throw new Error('ASR Base URL 必须使用无用户信息的 http 或 https 地址')
    if (!settings.asrModel.trim()) throw new Error('ASR 模型不能为空')
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
  } catch {
    return false
  }
}
