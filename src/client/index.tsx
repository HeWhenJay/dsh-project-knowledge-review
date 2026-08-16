import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Input, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { KNOWLEDGE_ENDPOINT, SETTINGS_ENDPOINT, type KnowledgeSettingsView, type SettingsEnvelope } from '../client-settings.js'

export const inject = ['slots', 'connection']

interface Injected {
  api: ConnectionHandle['api']
}

interface SectionProps extends Partial<Injected> {
  close?: () => void
}

interface CredentialState {
  configured: boolean
  source?: string
  writable: boolean
}

interface KnowledgeOverviewView {
  mode: 'local' | 'project-rag'
  documentCount?: number
  materialCount?: number
  chunkCount?: number
  storePath?: string
  scope?: string
  sharedWithCurrentProject?: boolean
  partition?: string
}

interface KnowledgeMaterialView {
  id: string | number
  title: string
  source?: string | null
  status?: string
  documentType?: string
  contentLength?: number
  chunkCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

interface KnowledgePageView {
  ok: boolean
  items: KnowledgeMaterialView[]
  nextCursor?: string
  hasMore: boolean
  total: number
  message?: string
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installKnowledgeReviewVisuals(), 'project-knowledge-review: visuals')
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'knowledge-review',
    order: 35,
    label: () => '知识复习',
    inject: () => ({ api: connection.api }),
  }, KnowledgeReviewSettings))
}

function installKnowledgeReviewVisuals(): () => void {
  if (typeof document === 'undefined' || document.getElementById('dsh-project-knowledge-review-visuals')) return () => undefined
  const style = document.createElement('style')
  style.id = 'dsh-project-knowledge-review-visuals'
  style.textContent = `
    /* Lucide BookOpenCheck（ISC）：用书本与勾选表达“知识复习”。 */
    button:has(> [class*="navLabel"]):has(> .dsh-project-knowledge-review-icon) [class*="navIcon"] { display: none; }
    button:has(> [class*="navLabel"]):has(> .dsh-project-knowledge-review-icon) { gap: 8px; }
    .dsh-project-knowledge-review-icon { width: 16px; height: 16px; flex: 0 0 16px; color: currentColor; }
    .dsh-project-knowledge-review-select { position: relative; width: 100%; }
    .dsh-project-knowledge-review-select-button {
      width: 100%; min-height: 38px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 0 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px;
      background: var(--dsw-alias-background-l1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px;
      text-align: left; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
    }
    .dsh-project-knowledge-review-select-button:hover { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-background-l2); }
    .dsh-project-knowledge-review-select-button:focus-visible { outline: none; border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }
    .dsh-project-knowledge-review-select-button[aria-expanded="true"] { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); }
    .dsh-project-knowledge-review-select-button:disabled { cursor: not-allowed; opacity: .55; }
    .dsh-project-knowledge-review-select-chevron { width: 16px; height: 16px; flex: 0 0 16px; color: var(--dsw-alias-label-tertiary); transition: transform .16s ease; }
    .dsh-project-knowledge-review-select-button[aria-expanded="true"] .dsh-project-knowledge-review-select-chevron { transform: rotate(180deg); color: var(--dsw-alias-brand-primary); }
    .dsh-project-knowledge-review-select-menu { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; right: 0; padding: 5px; margin: 0; list-style: none; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-button-elevated-fill, var(--dsw-alias-background-l1)); box-shadow: 0 12px 30px rgba(0, 0, 0, .18); }
    .dsh-project-knowledge-review-select-option { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
    .dsh-project-knowledge-review-select-option:hover, .dsh-project-knowledge-review-select-option[aria-selected="true"] { background: var(--dsw-alias-background-l2); }
    .dsh-project-knowledge-review-select-option:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
    .dsh-project-knowledge-review-select-check { width: 15px; height: 15px; color: var(--dsw-alias-brand-primary); }
  `
  document.head.appendChild(style)
  const markNavigation = (): void => {
    for (const label of Array.from(document.querySelectorAll<HTMLElement>('[class*="navLabel"]'))) {
      if (label.textContent?.trim() !== '知识复习' || label.parentElement?.querySelector('.dsh-project-knowledge-review-icon')) continue
      label.parentElement?.insertBefore(bookOpenCheckIcon(), label)
    }
  }
  markNavigation()
  const observer = new MutationObserver(markNavigation)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    style.remove()
    document.querySelectorAll('.dsh-project-knowledge-review-icon').forEach((icon) => icon.remove())
  }
}

function bookOpenCheckIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'dsh-project-knowledge-review-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = '<path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5a2.5 2.5 0 0 1 2.5 2.5z"/><path d="m15.5 14 2 2 4-4"/>'
  return svg
}

function KnowledgeReviewSettings({ api }: SectionProps): ReactNode {
  const [settings, setSettings] = useState<KnowledgeSettingsView>()
  const [revision, setRevision] = useState<number>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [ragKey, setRagKey] = useState('')
  const [ocrKey, setOcrKey] = useState('')
  const [asrKey, setAsrKey] = useState('')
  const [credentials, setCredentials] = useState<Record<string, CredentialState>>({})

  const load = async (): Promise<void> => {
    try {
      const response = await fetch(SETTINGS_ENDPOINT, { cache: 'no-store' })
      const payload = await response.json() as SettingsEnvelope
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || '设置读取失败')
      setSettings(payload.value)
      setRevision(payload.revision)
      await loadCredentials(payload.value)
    } catch (error) {
      setNotice(messageOf(error))
    }
  }

  const loadCredentials = async (value: KnowledgeSettingsView): Promise<void> => {
    if (!api) return
    const refs = [...new Set([value.ragApiKeyEnv, value.ocrApiKeyEnv, value.asrApiKeyEnv].filter(Boolean))]
    const response = await api.credentials.describe({ refs })
    if (!response.result.ok) throw new Error(response.result.error.message)
    setCredentials(response.result.value.credentials)
  }

  useEffect(() => { void load() }, [])

  const saveField = async (field: keyof KnowledgeSettingsView, value: unknown): Promise<void> => {
    if (!settings) return
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(SETTINGS_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field, value, expectedRevision: revision }),
      })
      const payload = await response.json() as SettingsEnvelope
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || '设置保存失败')
      setSettings(payload.value)
      setRevision(payload.revision)
      setNotice('设置已保存，下一次工具调用立即生效。')
    } catch (error) {
      setNotice(messageOf(error))
      await load()
    } finally {
      setBusy(false)
    }
  }

  const updateDraft = <K extends keyof KnowledgeSettingsView>(field: K, value: KnowledgeSettingsView[K]): void => {
    setSettings((current) => current ? { ...current, [field]: value } : current)
  }

  const saveCredential = async (kind: 'rag' | 'ocr' | 'asr'): Promise<boolean> => {
    if (!api || !settings) return false
    const ref = kind === 'rag' ? settings.ragApiKeyEnv : kind === 'ocr' ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv
    const value = (kind === 'rag' ? ragKey : kind === 'ocr' ? ocrKey : asrKey).trim()
    if (!value) { setNotice('请输入 API Key；已保存的 Key 不会回显。'); return false }
    setBusy(true)
    try {
      const response = await api.credentials.set({ ref, value })
      if (!response.result.ok) throw new Error(response.result.error.message)
      kind === 'rag' ? setRagKey('') : kind === 'ocr' ? setOcrKey('') : setAsrKey('')
      await loadCredentials(settings)
      setNotice(`${kind.toUpperCase()} API Key 已安全保存到 DSH 凭据库。`)
      return true
    } catch (error) {
      setNotice(messageOf(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  const clearCredential = async (kind: 'rag' | 'ocr' | 'asr'): Promise<void> => {
    if (!api || !settings) return
    const ref = kind === 'rag' ? settings.ragApiKeyEnv : kind === 'ocr' ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv
    setBusy(true)
    try {
      const response = await api.credentials.unset({ ref })
      if (!response.result.ok) throw new Error(response.result.error.message)
      await loadCredentials(settings)
      setNotice(`${kind.toUpperCase()} API Key 已删除。`)
    } catch (error) {
      setNotice(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return <section style={styles.section}><h2 style={styles.title}>知识复习</h2><p>{notice || '正在读取设置…'}</p></section>

  return <section style={styles.section}>
    <div>
      <h2 style={styles.title}>知识复习</h2>
      <p style={styles.intro}>控制严格证据问答、本地知识库，以及可选的项目 RAG、OCR 和 ASR。API Key 只写入 DSH 凭据库，不会回显。</p>
    </div>

    {notice && <div style={styles.notice}>{notice}</div>}

    <Card title="基础服务" description="关闭后系统提示词保持静默，所有知识复习工具都会拒绝执行。">
      <Toggle label="开启知识复习服务" checked={settings.enabled} disabled={busy} onChange={(value) => void saveField('enabled', value)} />
      <Field label="运行模式" help="local 无需数据库和向量模型；project-rag 连接完整项目 RAG。">
        <ModeSelect value={settings.mode} disabled={busy} onChange={(value) => void saveField('mode', value)} />
      </Field>
      <Field label="回答策略" help="严格知识库只允许 evidence 结论；参考知识库允许模型补充，但会明确标注来源边界。">
        <PolicySelect value={settings.answerPolicy} disabled={busy} onChange={(value) => void saveField('answerPolicy', value)} />
      </Field>
      <TextField label="知识库名称" value={settings.projectName} disabled={busy} onChange={(value) => updateDraft('projectName', value)} onSave={() => void saveField('projectName', settings.projectName)} />
      <TextField label="本地资料库路径" value={settings.localStorePath} disabled={busy} onChange={(value) => updateDraft('localStorePath', value)} onSave={() => void saveField('localStorePath', settings.localStorePath)} />
    </Card>

    <BeginnerSetup mode={settings.mode} ragKey={ragKey} credential={credentials[settings.ragApiKeyEnv]} disabled={busy} onKeyDraft={setRagKey} onSaveKey={() => saveCredential('rag')} onClearKey={() => void clearCredential('rag')} />

    <KnowledgeBrowser mode={settings.mode} />

    <Card title="项目 RAG" description="仅 project-rag 模式需要。Python 服务负责向量检索、PDF/Office、视频网页、OCR/ASR 和耐久任务。">
      <TextField label="RAG 服务 URL" value={settings.ragBaseUrl} disabled={busy} onChange={(value) => updateDraft('ragBaseUrl', value)} onSave={() => void saveField('ragBaseUrl', settings.ragBaseUrl)} />
      <NumberField label="请求超时（毫秒）" value={settings.requestTimeoutMs} disabled={busy} onChange={(value) => updateDraft('requestTimeoutMs', value)} onSave={() => void saveField('requestTimeoutMs', settings.requestTimeoutMs)} />
    </Card>

    <ServiceCard title="OCR 图片识别" enabled={settings.ocrEnabled} disabled={busy} onToggle={(value) => void saveField('ocrEnabled', value)}
      baseUrl={settings.ocrBaseUrl} model={settings.ocrModel} keyRef={settings.ocrApiKeyEnv} keyDraft={ocrKey}
      credential={credentials[settings.ocrApiKeyEnv]} onBaseUrl={(value) => updateDraft('ocrBaseUrl', value)} onModel={(value) => updateDraft('ocrModel', value)}
      onKeyRef={(value) => updateDraft('ocrApiKeyEnv', value)} onKeyDraft={setOcrKey}
      onSaveBase={() => void saveField('ocrBaseUrl', settings.ocrBaseUrl)} onSaveModel={() => void saveField('ocrModel', settings.ocrModel)}
      onSaveKeyRef={() => void saveField('ocrApiKeyEnv', settings.ocrApiKeyEnv)} onSaveKey={() => void saveCredential('ocr')} onClearKey={() => void clearCredential('ocr')} />

    <ServiceCard title="ASR 音频转写" enabled={settings.asrEnabled} disabled={busy} onToggle={(value) => void saveField('asrEnabled', value)}
      baseUrl={settings.asrBaseUrl} model={settings.asrModel} keyRef={settings.asrApiKeyEnv} keyDraft={asrKey}
      credential={credentials[settings.asrApiKeyEnv]} onBaseUrl={(value) => updateDraft('asrBaseUrl', value)} onModel={(value) => updateDraft('asrModel', value)}
      onKeyRef={(value) => updateDraft('asrApiKeyEnv', value)} onKeyDraft={setAsrKey}
      onSaveBase={() => void saveField('asrBaseUrl', settings.asrBaseUrl)} onSaveModel={() => void saveField('asrModel', settings.asrModel)}
      onSaveKeyRef={() => void saveField('asrApiKeyEnv', settings.asrApiKeyEnv)} onSaveKey={() => void saveCredential('asr')} onClearKey={() => void clearCredential('asr')} />
  </section>
}

function Card(props: { title: string; description: string; children: ReactNode }): ReactNode {
  return <div style={styles.card}><h3 style={styles.cardTitle}>{props.title}</h3><p style={styles.help}>{props.description}</p><div style={styles.stack}>{props.children}</div></div>
}

function Field(props: { label: string; help?: string; children: ReactNode }): ReactNode {
  return <label style={styles.field}><span style={styles.label}>{props.label}</span>{props.children}{props.help && <span style={styles.help}>{props.help}</span>}</label>
}

function ModeSelect(props: { value: KnowledgeSettingsView['mode']; disabled: boolean; onChange: (value: KnowledgeSettingsView['mode']) => void }): ReactNode {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options: Array<{ value: KnowledgeSettingsView['mode']; label: string; description: string }> = [
    { value: 'local', label: '本地零配置模式', description: '关键词检索，无需数据库或模型 Key' },
    { value: 'project-rag', label: '项目 RAG 增强模式', description: '连接 Python RAG，支持语义与多模态资料' },
  ]
  const selected = options.find((option) => option.value === props.value) ?? options[0]
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return <div ref={rootRef} className="dsh-project-knowledge-review-select">
    <button type="button" className="dsh-project-knowledge-review-select-button" aria-haspopup="listbox" aria-expanded={open} disabled={props.disabled} onClick={() => setOpen((value) => !value)}>
      <span>{selected.label}</span><svg className="dsh-project-knowledge-review-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <ul className="dsh-project-knowledge-review-select-menu" role="listbox" aria-label="运行模式">
      {options.map((option) => <li key={option.value} role="option" aria-selected={option.value === props.value}>
        <button type="button" className="dsh-project-knowledge-review-select-option" onClick={() => { props.onChange(option.value); setOpen(false) }}>
          <span><strong>{option.label}</strong><small style={styles.modeDescription}>{option.description}</small></span>
          {option.value === props.value && <svg className="dsh-project-knowledge-review-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
        </button>
      </li>)}
    </ul>}
  </div>
}

function PolicySelect(props: { value: KnowledgeSettingsView['answerPolicy']; disabled: boolean; onChange: (value: KnowledgeSettingsView['answerPolicy']) => void }): ReactNode {
  return <div style={styles.policyGrid}>
    <button type="button" style={{ ...styles.policyOption, ...(props.value === 'strict' ? styles.policyOptionActive : {}) }} disabled={props.disabled} onClick={() => props.onChange('strict')}>
      <strong>严格知识库</strong><span style={styles.policyDescription}>仅根据已有 evidence 回答；无证据时拒答</span>
    </button>
    <button type="button" style={{ ...styles.policyOption, ...(props.value === 'reference' ? styles.policyOptionActive : {}) }} disabled={props.disabled} onClick={() => props.onChange('reference')}>
      <strong>参考知识库</strong><span style={styles.policyDescription}>知识库优先，允许明确标注的模型补充</span>
    </button>
  </div>
}

interface SetupStatusView {
  ok?: boolean
  phase: 'idle' | 'checking' | 'cloning' | 'database' | 'environment' | 'starting' | 'ready' | 'failed'
  running: boolean
  message: string
  installRoot: string
  serviceUrl: string
  prerequisites: { docker: boolean; git: boolean; conda: boolean }
  error?: string
}

function BeginnerSetup(props: { mode: KnowledgeSettingsView['mode']; ragKey: string; credential?: CredentialState; disabled: boolean; onKeyDraft: (value: string) => void; onSaveKey: () => Promise<boolean>; onClearKey: () => void }): ReactNode {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<SetupStatusView>()
  const [installRoot, setInstallRoot] = useState('')
  const [starting, setStarting] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const load = async (): Promise<void> => {
    setDetecting(true)
    try {
      const response = await fetch('/api/project-knowledge-review/setup/status', { cache: 'no-store' })
      const payload = await response.json() as SetupStatusView
      setStatus(payload); if (!installRoot && payload.installRoot) setInstallRoot(payload.installRoot)
    } catch { /* local 模式不因增强服务状态失败而报错。 */ }
    finally { setDetecting(false) }
  }
  useEffect(() => { if (open) void load() }, [open])
  useEffect(() => {
    if (!open || !status?.running) return
    const timer = setInterval(() => void load(), 1500)
    return () => clearInterval(timer)
  }, [open, status?.running])
  const start = async (): Promise<void> => {
    if (!confirm('将自动下载项目、创建本机 pgvector 数据库并准备独立 Python 环境。不会删除现有数据；失败时本地开箱即用模式仍可使用。是否继续？')) return
    setStarting(true)
    try {
      if (props.ragKey.trim() && !(await props.onSaveKey())) return
      const response = await fetch('/api/project-knowledge-review/setup/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ installRoot }) })
      const payload = await response.json() as SetupStatusView
      if (!response.ok || payload.phase === 'failed') throw new Error(payload.error || payload.message || '一键准备启动失败')
      setStatus(payload)
    } catch (error) {
      setStatus((current) => current ? { ...current, phase: 'failed', running: false, message: '完整多模态准备未启动；本地模式仍可使用。', error: messageOf(error) } : current)
    } finally { setStarting(false) }
  }
  const ready = status?.phase === 'ready'
  return <div style={styles.setupCard}>
    <button type="button" style={styles.browserHeader} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span><strong>新手一键准备</strong><small style={styles.browserSubtitle}>纯文本知识复习已经可用；完整多模态按需准备</small></span>
      <span style={styles.browserHeaderMeta}>{ready ? '完整功能已就绪' : props.mode === 'local' ? '本地功能已就绪' : status?.message || ''}<svg style={{ ...styles.browserChevron, transform: open ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    {open && <div style={styles.setupBody}>
      <div style={styles.beginnerNotice}><strong>现在就能复习纯文本资料</strong><span>只有当你要解析 PDF、Office、扫描件或视频时，才需要填写下方 DashScope Key 并准备完整多模态功能。</span></div>
      <Field label="DashScope API Key（仅完整多模态需要）" help="需要使用你自己的阿里云百炼 Key，插件无法代为申请；保存后只写入 DSH 凭据库，不进入项目文件或日志。">
        <div style={styles.credentialStatus}><StateDot state={props.credential?.configured ? 'done' : 'warning'} /><span>{props.credential?.configured ? '已配置，可以开始准备完整功能' : '尚未填写；纯文本知识复习不受影响'}</span></div>
        <div style={styles.keyRow}><Input type="password" autoComplete="new-password" placeholder="输入 DashScope API Key" value={props.ragKey} onChange={(event) => props.onKeyDraft(event.target.value)} /><Button size="sm" variant="primary" disabled={!props.ragKey.trim() || props.disabled} onClick={props.onSaveKey}>安全保存</Button>{props.credential?.configured && <Button size="sm" variant="outline" onClick={props.onClearKey}>删除</Button>}</div>
      </Field>
      <details style={styles.advancedDetails}><summary style={styles.advancedSummary}>高级选项：更改安装目录</summary><div style={styles.advancedBody}><Input value={installRoot} title={installRoot} onChange={(event) => setInstallRoot(event.target.value)} /><small style={styles.help}>默认目录安全且可直接使用，普通用户无需修改。</small></div></details>
      {detecting && !status && <div style={styles.setupStatus}><strong>正在只读检测本机环境…</strong><span>不会下载、安装或修改系统。</span></div>}
      {status && <div style={styles.setupStatus}><strong>{status.message}</strong><span>Docker {status.prerequisites.docker ? '✓' : '—'} · Git {status.prerequisites.git ? '✓' : '—'} · Conda {status.prerequisites.conda ? '✓' : '—'}</span>{status.error && <span style={styles.setupError}>{status.error}</span>}</div>}
      <div style={styles.setupActions}><Button variant="primary" disabled={starting || status?.running || ready || (!props.credential?.configured && !props.ragKey.trim())} onClick={() => void start()}>{status?.running ? '正在自动准备…' : ready ? '完整多模态已就绪' : !props.credential?.configured && !props.ragKey.trim() ? '填写 Key 后即可一键准备' : '一键准备完整多模态'}</Button><Button variant="outline" disabled={detecting} onClick={() => void load()}>{detecting ? '正在检测…' : '重新检测'}</Button></div>
      <small style={styles.help}>插件不会自动安装 Docker Desktop、WSL2 或绕过企业网络限制。缺少系统前提时会明确提示，并保持本地模式正常可用。</small>
    </div>}
  </div>
}

function KnowledgeBrowser({ mode }: { mode: KnowledgeSettingsView['mode'] }): ReactNode {
  const [open, setOpen] = useState(false)
  const [overview, setOverview] = useState<KnowledgeOverviewView>()
  const [items, setItems] = useState<KnowledgeMaterialView[]>([])
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState<string>()
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([])
  const [nextCursor, setNextCursor] = useState<string>()
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string>()
  const [content, setContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true); setError(''); setExpandedId(undefined); setContent('')
    const params = new URLSearchParams({ limit: '30' })
    if (cursor) params.set('cursor', cursor)
    if (query) params.set('query', query)
    Promise.all([
      fetch(`${KNOWLEDGE_ENDPOINT}/overview`, { cache: 'no-store', signal: controller.signal }).then((response) => response.json()),
      fetch(`${KNOWLEDGE_ENDPOINT}/materials?${params}`, { cache: 'no-store', signal: controller.signal }).then((response) => response.json() as Promise<KnowledgePageView>),
    ]).then(([overviewValue, page]) => {
      if (!overviewValue.ok) throw new Error(overviewValue.message || '概览读取失败')
      if (!page.ok) throw new Error(page.message || '资料列表读取失败')
      setOverview(overviewValue); setItems(page.items ?? []); setNextCursor(page.nextCursor); setHasMore(page.hasMore); setTotal(page.total)
    }).catch((value) => { if (value.name !== 'AbortError') setError(messageOf(value)) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, mode, cursor, query])

  const showContent = async (item: KnowledgeMaterialView): Promise<void> => {
    const id = String(item.id)
    if (expandedId === id) { setExpandedId(undefined); setContent(''); return }
    setExpandedId(id); setContent(''); setContentLoading(true)
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(id)}/content`, { cache: 'no-store' })
      const payload = await response.json() as { ok: boolean; content?: string; contentLength?: number; truncated?: boolean; message?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.message || '原文读取失败')
      setContent(`${payload.content || '（资料原文为空）'}${payload.truncated ? `\n\n—— 预览已限制为 200,000 字符；原文共 ${payload.contentLength ?? '更多'} 字符。` : ''}`)
    } catch (value) { setContent(`读取失败：${messageOf(value)}`) } finally { setContentLoading(false) }
  }

  return <div style={styles.browserCard}>
    <button type="button" style={styles.browserHeader} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span><strong>知识库内容</strong><small style={styles.browserSubtitle}>分页查看标题、来源与原始内容</small></span>
      <span style={styles.browserHeaderMeta}>{overview ? `${overview.documentCount ?? overview.materialCount ?? total} 条` : ''}<svg style={{ ...styles.browserChevron, transform: open ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    {open && <div style={styles.browserBody}>
      {overview && <div style={styles.overviewGrid}>
        <span><small>当前模式</small><strong>{overview.mode === 'local' ? '本地知识库' : '项目 RAG'}</strong></span>
        <span><small>资料数量</small><strong>{overview.documentCount ?? overview.materialCount ?? total}</strong></span>
        <span><small>作用域</small><strong>{overview.scope === 'dsh-user-global' ? 'DSH 用户级全局' : '插件固定分区'}</strong></span>
        <span><small>与当前项目共用</small><strong>{overview.sharedWithCurrentProject ? '是' : '否'}</strong></span>
      </div>}
      {overview?.storePath && <div style={styles.storePath}>存储位置：<code>{overview.storePath}</code></div>}
      <form style={styles.browserSearch} onSubmit={(event) => { event.preventDefault(); setCursor(undefined); setCursorStack([]); setQuery(queryDraft.trim()) }}>
        <Input value={queryDraft} placeholder="按标题或来源搜索" onChange={(event) => setQueryDraft(event.target.value)} />
        <Button type="submit" size="sm" variant="outline">搜索</Button>
        {query && <Button type="button" size="sm" variant="ghost" onClick={() => { setQueryDraft(''); setQuery(''); setCursor(undefined); setCursorStack([]) }}>清除</Button>}
      </form>
      {error && <div style={styles.browserError}>{error}</div>}
      {loading ? <div style={styles.browserEmpty}>正在读取当前页…</div> : items.length === 0 ? <div style={styles.browserEmpty}>当前范围没有资料</div> : <div style={styles.materialList}>
        {items.map((item) => <div key={String(item.id)} style={styles.materialRow}>
          <button type="button" style={styles.materialButton} onClick={() => void showContent(item)}>
            <span style={styles.materialMain}><strong>{item.title}</strong><small>{item.source || '未标注来源'} · {item.documentType || `${item.contentLength ?? 0} 字符`} {item.status ? `· ${item.status}` : ''}</small></span>
            <svg style={{ ...styles.itemChevron, transform: expandedId === String(item.id) ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {expandedId === String(item.id) && <pre style={styles.contentPreview}>{contentLoading ? '正在按需读取原文…' : content}</pre>}
        </div>)}
      </div>}
      <div style={styles.pagination}><span>共 {total} 条 · 当前页最多 30 条</span><span style={styles.paginationButtons}><Button size="sm" variant="outline" disabled={!cursorStack.length || loading} onClick={() => { const stack = [...cursorStack]; setCursor(stack.pop()); setCursorStack(stack) }}>上一页</Button><Button size="sm" variant="outline" disabled={!hasMore || !nextCursor || loading} onClick={() => { setCursorStack((stack) => [...stack, cursor]); setCursor(nextCursor) }}>下一页</Button></span></div>
    </div>}
  </div>
}

function TextField(props: { label: string; value: string; disabled: boolean; onChange: (value: string) => void; onSave: () => void }): ReactNode {
  return <Field label={props.label}><div style={styles.row}><Input value={props.value} disabled={props.disabled} onChange={(event) => props.onChange(event.target.value)} /><Button size="sm" variant="outline" disabled={props.disabled} onClick={props.onSave}>保存</Button></div></Field>
}

function NumberField(props: { label: string; value: number; disabled: boolean; onChange: (value: number) => void; onSave: () => void }): ReactNode {
  return <Field label={props.label}><div style={styles.row}><Input type="number" value={props.value} disabled={props.disabled} onChange={(event) => props.onChange(Number(event.target.value))} /><Button size="sm" variant="outline" disabled={props.disabled} onClick={props.onSave}>保存</Button></div></Field>
}

function Toggle(props: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }): ReactNode {
  return <label style={styles.toggle}><input type="checkbox" checked={props.checked} disabled={props.disabled} onChange={(event) => props.onChange(event.target.checked)} /><span>{props.label}</span></label>
}

function ServiceCard(props: {
  title: string; enabled: boolean; disabled: boolean; baseUrl: string; model: string; keyRef: string; keyDraft: string; credential?: CredentialState
  onToggle: (value: boolean) => void; onBaseUrl: (value: string) => void; onModel: (value: string) => void; onKeyRef: (value: string) => void; onKeyDraft: (value: string) => void
  onSaveBase: () => void; onSaveModel: () => void; onSaveKeyRef: () => void; onSaveKey: () => void; onClearKey: () => void
}): ReactNode {
  return <Card title={props.title} description="支持 OpenAI 兼容接口。Base URL 不含具体方法路径；Key 保存后不会回显。">
    <Toggle label={`开启${props.title}`} checked={props.enabled} disabled={props.disabled} onChange={props.onToggle} />
    <TextField label="Base URL" value={props.baseUrl} disabled={props.disabled} onChange={props.onBaseUrl} onSave={props.onSaveBase} />
    <TextField label="模型名称" value={props.model} disabled={props.disabled} onChange={props.onModel} onSave={props.onSaveModel} />
    <TextField label="凭据引用名" value={props.keyRef} disabled={props.disabled} onChange={props.onKeyRef} onSave={props.onSaveKeyRef} />
    <Field label="API Key">
      <div style={styles.credentialStatus}><StateDot state={props.credential?.configured ? 'done' : 'warning'} /><span>{props.credential?.configured ? `已配置（${props.credential.source || 'DSH 凭据库'}）` : '未配置'}</span></div>
      <div style={styles.row}><Input type="password" autoComplete="new-password" placeholder="输入新 Key，保存后立即清空" value={props.keyDraft} disabled={props.disabled || props.credential?.writable === false} onChange={(event) => props.onKeyDraft(event.target.value)} /><Button size="sm" variant="primary" disabled={props.disabled || !props.keyDraft.trim()} onClick={props.onSaveKey}>保存 Key</Button><Button size="sm" variant="outline" disabled={props.disabled || !props.credential?.configured || props.credential.writable === false} onClick={props.onClearKey}>删除</Button></div>
    </Field>
  </Card>
}

function messageOf(error: unknown): string { return error instanceof Error ? error.message : '未知设置错误' }

const styles: Record<string, CSSProperties> = {
  section: { maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--dsw-alias-label-primary)' },
  title: { margin: 0, fontSize: 20 }, intro: { margin: '6px 0 0', color: 'var(--dsw-alias-label-tertiary)', lineHeight: 1.6 },
  notice: { padding: '10px 12px', borderRadius: 8, background: 'var(--dsw-alias-background-l2)', fontSize: 13 },
  card: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, padding: 16, background: 'var(--dsw-alias-background-l1)' },
  cardTitle: { margin: 0, fontSize: 16 }, stack: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 }, label: { fontSize: 13, fontWeight: 600 }, help: { margin: '5px 0 0', color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: 1.5 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, toggle: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 14 },
  modeDescription: { display: 'block', marginTop: 3, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, lineHeight: 1.35 },
  policyGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  policyOption: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 11px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, background: 'transparent', color: 'var(--dsw-alias-label-primary)', textAlign: 'left', cursor: 'pointer' },
  policyOptionActive: { borderColor: 'var(--dsw-alias-brand-primary)', background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)', boxShadow: '0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)' },
  policyDescription: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, lineHeight: 1.4 },
  browserCard: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-background-l1)', overflow: 'hidden' },
  setupCard: { border: '1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-l2))', borderRadius: 12, background: 'linear-gradient(145deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-background-l1)), var(--dsw-alias-background-l1))', overflow: 'hidden' },
  setupBody: { display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px 16px', borderTop: '1px solid var(--dsw-alias-border-l2)' },
  beginnerNotice: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14, padding: '11px 12px', borderRadius: 9, background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)', color: 'var(--dsw-alias-label-primary)', fontSize: 12, lineHeight: 1.5 },
  setupStatus: { display: 'flex', flexDirection: 'column', gap: 5, padding: '10px 11px', borderRadius: 9, background: 'var(--dsw-alias-background-l2)', color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
  setupError: { color: '#b13b3b', lineHeight: 1.5 },
  setupActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  keyRow: { display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) auto auto', gap: 8, alignItems: 'center' },
  advancedDetails: { borderRadius: 8, background: 'var(--dsw-alias-background-l2)', color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
  advancedSummary: { padding: '9px 11px', cursor: 'pointer', color: 'var(--dsw-alias-label-secondary)' },
  advancedBody: { display: 'flex', flexDirection: 'column', gap: 5, padding: '0 11px 11px' },
  browserHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', border: 0, background: 'transparent', color: 'var(--dsw-alias-label-primary)', textAlign: 'left', cursor: 'pointer', font: 'inherit' },
  browserSubtitle: { display: 'block', marginTop: 4, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 },
  browserHeaderMeta: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 },
  browserChevron: { width: 17, height: 17, transition: 'transform .16s ease' },
  browserBody: { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 16px', borderTop: '1px solid var(--dsw-alias-border-l2)' },
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, paddingTop: 14 },
  storePath: { padding: '8px 10px', borderRadius: 7, background: 'var(--dsw-alias-background-l2)', color: 'var(--dsw-alias-label-secondary)', fontSize: 11, overflowWrap: 'anywhere' },
  browserSearch: { display: 'flex', alignItems: 'center', gap: 8 },
  browserError: { padding: 10, borderRadius: 8, background: 'color-mix(in srgb, #d24b4b 10%, transparent)', color: '#a33131', fontSize: 12 },
  browserEmpty: { padding: '22px 10px', color: 'var(--dsw-alias-label-tertiary)', textAlign: 'center', fontSize: 12 },
  materialList: { display: 'flex', flexDirection: 'column', gap: 6 },
  materialRow: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, overflow: 'hidden' },
  materialButton: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 11px', border: 0, background: 'transparent', color: 'var(--dsw-alias-label-primary)', textAlign: 'left', cursor: 'pointer', font: 'inherit' },
  materialMain: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' },
  itemChevron: { width: 16, height: 16, flex: '0 0 16px', color: 'var(--dsw-alias-label-tertiary)', transition: 'transform .16s ease' },
  contentPreview: { maxHeight: 300, margin: 0, padding: 12, overflow: 'auto', borderTop: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-button-elevated-fill, var(--dsw-alias-background-l2))', color: 'var(--dsw-alias-label-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.6 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 },
  paginationButtons: { display: 'flex', gap: 8 },
  credentialStatus: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' },
}
