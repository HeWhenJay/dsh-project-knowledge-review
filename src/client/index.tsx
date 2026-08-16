import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Input, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

import { SETTINGS_ENDPOINT, type KnowledgeSettingsView, type SettingsEnvelope } from '../client-settings.js'

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

export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'knowledge-review',
    order: 35,
    label: () => '知识复习',
    inject: () => ({ api: connection.api }),
  }, KnowledgeReviewSettings))
}

function KnowledgeReviewSettings({ api }: SectionProps): ReactNode {
  const [settings, setSettings] = useState<KnowledgeSettingsView>()
  const [revision, setRevision] = useState<number>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
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
    const refs = [...new Set([value.ocrApiKeyEnv, value.asrApiKeyEnv].filter(Boolean))]
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

  const saveCredential = async (kind: 'ocr' | 'asr'): Promise<void> => {
    if (!api || !settings) return
    const ref = kind === 'ocr' ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv
    const value = (kind === 'ocr' ? ocrKey : asrKey).trim()
    if (!value) return setNotice('请输入 API Key；已保存的 Key 不会回显。')
    setBusy(true)
    try {
      const response = await api.credentials.set({ ref, value })
      if (!response.result.ok) throw new Error(response.result.error.message)
      kind === 'ocr' ? setOcrKey('') : setAsrKey('')
      await loadCredentials(settings)
      setNotice(`${kind.toUpperCase()} API Key 已安全保存到 DSH 凭据库。`)
    } catch (error) {
      setNotice(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  const clearCredential = async (kind: 'ocr' | 'asr'): Promise<void> => {
    if (!api || !settings) return
    const ref = kind === 'ocr' ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv
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
        <select style={styles.select} value={settings.mode} disabled={busy} onChange={(event) => void saveField('mode', event.target.value)}>
          <option value="local">本地零配置模式</option>
          <option value="project-rag">项目 RAG 增强模式</option>
        </select>
      </Field>
      <TextField label="知识库名称" value={settings.projectName} disabled={busy} onChange={(value) => updateDraft('projectName', value)} onSave={() => void saveField('projectName', settings.projectName)} />
      <TextField label="本地资料库路径" value={settings.localStorePath} disabled={busy} onChange={(value) => updateDraft('localStorePath', value)} onSave={() => void saveField('localStorePath', settings.localStorePath)} />
    </Card>

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
  select: { minHeight: 36, borderRadius: 8, padding: '0 10px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-background-l1)', color: 'inherit' },
  credentialStatus: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' },
}
