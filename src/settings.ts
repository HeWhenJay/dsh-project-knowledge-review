import Schema from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

export const KNOWLEDGE_SETTINGS_NAMESPACE = settingsNamespace('project-knowledge-review')
export const OCR_API_KEY_REF = 'DSH_KNOWLEDGE_OCR_API_KEY'
export const ASR_API_KEY_REF = 'DSH_KNOWLEDGE_ASR_API_KEY'
export const RAG_API_KEY_REF = 'DSH_KNOWLEDGE_RAG_API_KEY'

export interface KnowledgeSettings {
  enabled: boolean
  mode: 'local' | 'project-rag'
  answerPolicy: 'strict' | 'reference'
  localStorePath: string
  projectName: string
  ragBaseUrl: string
  ragApiKeyEnv: string
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
  mode: Schema.union(['local', 'project-rag']).default('local'),
  answerPolicy: Schema.union(['strict', 'reference']).default('strict'),
  localStorePath: Schema.string().default('~/.dsh/project-knowledge-review/knowledge.json'),
  projectName: Schema.string().default('我的知识库'),
  ragBaseUrl: Schema.string().default('http://127.0.0.1:8090'),
  ragApiKeyEnv: Schema.string().role('credential-ref').default(RAG_API_KEY_REF),
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
  if (settings.mode === 'project-rag' && !isHttpUrl(settings.ragBaseUrl)) throw new Error('项目 RAG URL 必须使用 http 或 https')
  if (settings.ocrEnabled) {
    if (!isHttpUrl(settings.ocrBaseUrl)) throw new Error('OCR Base URL 必须使用 http 或 https')
    if (!settings.ocrModel.trim()) throw new Error('OCR 模型不能为空')
  }
  if (settings.asrEnabled) {
    if (!isHttpUrl(settings.asrBaseUrl)) throw new Error('ASR Base URL 必须使用 http 或 https')
    if (!settings.asrModel.trim()) throw new Error('ASR 模型不能为空')
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
