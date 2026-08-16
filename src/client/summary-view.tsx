import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import { KNOWLEDGE_ENDPOINT } from '../client-settings.js'
import { MarkdownText } from './markdown-text.js'

export interface SummaryControllerLike { getSnapshot(): { open: boolean }; subscribe(listener: () => void): () => void; close(): void }
interface Material { id: string; title: string; source: string; summary?: string; summarySource?: 'extractive' | 'model'; systemCategory?: string; userCategory?: string | null; contentLength: number; createdAt: string; updatedAt?: string }
interface SummaryPayload { ok: boolean; items?: Material[]; total?: number; nextCursor?: string; hasMore?: boolean; systemCategoryCounts?: Record<string, number>; userCategoryCounts?: Record<string, number>; userCategories?: string[]; message?: string }
interface ContentPayload { ok: boolean; content?: string; contentLength?: number; truncated?: boolean; message?: string }
type DocumentView = 'summary' | 'source'
type RenderMode = 'preview' | 'markdown'

/** Archify 式一级资料工作区：导航、Markdown 阅读画布和属性检查器。 */
export function KnowledgeSummaryView({ controller }: { controller: SummaryControllerLike }): ReactNode {
  const [open, setOpen] = useState(controller.getSnapshot().open)
  const [items, setItems] = useState<Material[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [systemCategory, setSystemCategory] = useState('')
  const [userCategory, setUserCategory] = useState<string | undefined>(undefined)
  const [systemCounts, setSystemCounts] = useState<Record<string, number>>({})
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [cursor, setCursor] = useState<string>()
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([])
  const [nextCursor, setNextCursor] = useState<string>()
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [documentView, setDocumentView] = useState<DocumentView>('summary')
  const [renderMode, setRenderMode] = useState<RenderMode>('preview')
  const [source, setSource] = useState('')
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceTruncated, setSourceTruncated] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => controller.subscribe(() => setOpen(controller.getSnapshot().open)), [controller])
  useEffect(() => { if (open) requestAnimationFrame(() => titleRef.current?.focus()) }, [open])
  useEffect(() => {
    if (!open) return
    const abort = new AbortController()
    setLoading(true); setError('')
    const params = new URLSearchParams({ limit: '30' })
    if (cursor) params.set('cursor', cursor)
    if (query) params.set('query', query)
    if (systemCategory) params.set('systemCategory', systemCategory)
    if (userCategory !== undefined) params.set('userCategory', userCategory)
    fetch(`${KNOWLEDGE_ENDPOINT}/summaries?${params}`, { cache: 'no-store', signal: abort.signal })
      .then(async (response) => ({ response, payload: await response.json() as SummaryPayload }))
      .then(({ response, payload }) => {
        if (!response.ok || !payload.ok) throw new Error(payload.message || '摘要读取失败')
        const nextItems = payload.items ?? []
        setItems(nextItems); setTotal(payload.total ?? 0); setNextCursor(payload.nextCursor); setHasMore(Boolean(payload.hasMore))
        setSystemCounts(payload.systemCategoryCounts ?? {}); setUserCounts(payload.userCategoryCounts ?? {}); setUserCategories(payload.userCategories ?? [])
        setSelectedId((current) => current && nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id)
      })
      .catch((value) => { if (value.name !== 'AbortError') setError(value instanceof Error ? value.message : '摘要读取失败') })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [open, cursor, query, systemCategory, userCategory])

  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId])
  useEffect(() => {
    if (!selected || !open) { setSource(''); return }
    const abort = new AbortController()
    setSource(''); setSourceLoading(true); setSourceTruncated(false)
    fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(selected.id)}/content`, { cache: 'no-store', signal: abort.signal })
      .then(async (response) => ({ response, payload: await response.json() as ContentPayload }))
      .then(({ response, payload }) => {
        if (!response.ok || !payload.ok) throw new Error(payload.message || '原始内容读取失败')
        setSource(payload.content || ''); setSourceTruncated(Boolean(payload.truncated))
      })
      .catch((value) => { if (value.name !== 'AbortError') setSource(`> 原始内容读取失败：${value instanceof Error ? value.message : '未知错误'}`) })
      .finally(() => { if (!abort.signal.aborted) setSourceLoading(false) })
    return () => abort.abort()
  }, [open, selected?.id])

  const resetPage = (): void => { setCursor(undefined); setCursorStack([]) }
  const createCategory = async (): Promise<void> => {
    if (!newCategory.trim() || mutating) return
    setMutating(true); setError('')
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/categories`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newCategory.trim() }) })
      const payload = await response.json() as { ok: boolean; categories?: string[]; message?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.message || '分类创建失败')
      setUserCategories(payload.categories ?? []); setNewCategory('')
    } catch (value) { setError(value instanceof Error ? value.message : '分类创建失败') } finally { setMutating(false) }
  }
  const move = async (value: string | null): Promise<void> => {
    if (!selected || mutating) return
    setMutating(true); setError('')
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(selected.id)}/metadata`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userCategory: value }) })
      const payload = await response.json() as { ok: boolean; item?: Material; message?: string }
      if (!response.ok || !payload.ok || !payload.item) throw new Error(payload.message || '分类更新失败')
      setItems((current) => current.map((item) => item.id === payload.item!.id ? payload.item! : item))
      setUserCounts((current) => {
        const next = { ...current }; const before = selected.userCategory || '未分类'; const after = value || '未分类'
        next[before] = Math.max(0, (next[before] ?? 1) - 1); next[after] = (next[after] ?? 0) + 1
        return next
      })
    } catch (value) { setError(value instanceof Error ? value.message : '分类更新失败') } finally { setMutating(false) }
  }
  const documentContent = documentView === 'summary' ? selected?.summary || '## 知识点摘要\n\n暂无摘要。' : source

  return <div className="dsh-knowledge-workspace" data-inspector-open={inspectorOpen || undefined} data-navigation-open={navigationOpen || undefined}>
    <header className="dsh-knowledge-workspace-bar">
      <div className="dsh-knowledge-workspace-brand"><button className="dsh-knowledge-navigation-toggle" type="button" aria-label="打开资料导航" aria-expanded={navigationOpen} onClick={() => setNavigationOpen((value) => !value)}>☰</button><span className="dsh-knowledge-workspace-mark" aria-hidden="true">K</span><div><h2 ref={titleRef} tabIndex={-1}>知识库</h2><p>{total} 份本地资料 · 独立插件空间</p></div></div>
      <div className="dsh-knowledge-workspace-actions"><Button size="sm" variant="outline" onClick={() => setInspectorOpen((value) => !value)}>{inspectorOpen ? '收起属性' : '展开属性'}</Button><button className="dsh-knowledge-summary-close" onClick={() => controller.close()} aria-label="关闭知识库页面">×</button></div>
    </header>
    {error ? <div className="dsh-knowledge-summary-error" role="alert">{error}<small>请检查“设置 → 知识复习”中的本地资料库路径，然后重试。</small></div> : null}
    <div className="dsh-knowledge-workspace-body">
      <button className="dsh-knowledge-navigation-backdrop" type="button" aria-label="关闭资料导航" onClick={() => setNavigationOpen(false)} />
      <aside className="dsh-knowledge-library-nav" aria-label="知识库导航">
        <form className="dsh-knowledge-library-search" onSubmit={(event) => { event.preventDefault(); resetPage(); setQuery(queryDraft.trim()) }}><Input aria-label="搜索资料标题、来源或摘要" value={queryDraft} placeholder="搜索资料、来源或摘要" onChange={(event) => setQueryDraft(event.target.value)} /><button type="submit" hidden>搜索</button></form>
        <div className="dsh-knowledge-library-scroll">
          <section><h3>系统分类</h3><FilterButton active={!systemCategory} label="全部资料" count={Object.values(systemCounts).reduce((sum, value) => sum + value, 0)} onClick={() => { resetPage(); setSystemCategory(''); setNavigationOpen(false) }} />{Object.entries(systemCounts).map(([name, count]) => <FilterButton key={name} active={systemCategory === name} label={name} count={count} onClick={() => { resetPage(); setSystemCategory(name) }} />)}</section>
          <section><h3>我的分类</h3><FilterButton active={userCategory === undefined} label="全部资料" count={Object.values(userCounts).reduce((sum, value) => sum + value, 0)} onClick={() => { resetPage(); setUserCategory(undefined) }} /><FilterButton active={userCategory === ''} label="未分类" count={userCounts['未分类'] ?? 0} onClick={() => { resetPage(); setUserCategory('') }} />{userCategories.map((name) => <FilterButton key={name} active={userCategory === name} label={name} count={userCounts[name] ?? 0} onClick={() => { resetPage(); setUserCategory(name) }} />)}</section>
          <div className="dsh-knowledge-summary-create"><Input aria-label="新建用户分类名称" value={newCategory} placeholder="新建分类" disabled={mutating} onChange={(event) => setNewCategory(event.target.value)} /><Button size="sm" variant="primary" disabled={!newCategory.trim() || mutating} onClick={() => void createCategory()}>创建</Button></div>
          <section className="dsh-knowledge-document-section"><h3>资料</h3><div className="dsh-knowledge-document-count" aria-live="polite">{loading ? '正在读取…' : `当前筛选 ${total} 份`}</div>{items.map((item) => <button className="dsh-knowledge-document-row" key={item.id} aria-current={selectedId === item.id ? 'page' : undefined} data-active={selectedId === item.id || undefined} onClick={() => { setSelectedId(item.id); setDocumentView('summary'); setRenderMode('preview'); setNavigationOpen(false) }}><span className="dsh-knowledge-document-kind">{item.summarySource === 'model' ? 'M' : 'A'}</span><span><strong>{item.title}</strong><small>{item.systemCategory || '待分类'} · {item.userCategory || '未分类'}</small></span></button>)}{!loading && !items.length ? <div className="dsh-knowledge-summary-empty">当前范围没有资料</div> : null}</section>
        </div>
        <div className="dsh-knowledge-nav-pagination"><Button size="sm" variant="outline" disabled={!cursorStack.length || loading} onClick={() => { const stack = [...cursorStack]; setCursor(stack.pop()); setCursorStack(stack) }}>上一页</Button><Button size="sm" variant="outline" disabled={!hasMore || !nextCursor || loading} onClick={() => { setCursorStack((stack) => [...stack, cursor]); setCursor(nextCursor) }}>下一页</Button></div>
      </aside>
      <main className="dsh-knowledge-reader" aria-busy={sourceLoading}>
        {selected ? <>
          <div className="dsh-knowledge-reader-head"><div><div className="dsh-knowledge-reader-badges"><span>{selected.systemCategory || '待分类'}</span><span>{selected.summarySource === 'model' ? '模型摘要' : '自动提要'}</span></div><h1>{selected.title}</h1><p>{selected.source || '未标注来源'}</p></div><div className="dsh-knowledge-reader-tabs" role="tablist" aria-label="资料阅读内容"><button role="tab" aria-selected={documentView === 'summary'} onClick={() => setDocumentView('summary')}>摘要</button><button role="tab" aria-selected={documentView === 'source'} onClick={() => setDocumentView('source')}>原始内容</button></div></div>
          <div className="dsh-knowledge-reader-toolbar"><div className="dsh-knowledge-render-toggle"><button aria-pressed={renderMode === 'preview'} onClick={() => setRenderMode('preview')}>渲染</button><button aria-pressed={renderMode === 'markdown'} onClick={() => setRenderMode('markdown')}>Markdown 源码</button></div><span>{documentView === 'source' && sourceLoading ? '正在按需读取原始内容…' : sourceTruncated && documentView === 'source' ? '原始内容超过 2,000,000 字符，当前为截断预览' : documentView === 'summary' ? '摘要默认以 Markdown 保存' : `${selected.contentLength} 字符`}</span></div>
          <article className="dsh-knowledge-reader-canvas">{sourceLoading && documentView === 'source' ? <div className="dsh-knowledge-summary-empty">正在读取原始内容…</div> : renderMode === 'preview' ? <MarkdownText content={documentContent} /> : <pre className="dsh-knowledge-markdown-source"><code>{documentContent}</code></pre>}</article>
        </> : <div className="dsh-knowledge-reader-welcome"><span className="dsh-knowledge-workspace-mark">K</span><h2>选择一份资料开始阅读</h2><p>摘要和原始内容都支持安全 Markdown 预览。</p></div>}
      </main>
      <aside className="dsh-knowledge-inspector" aria-label="资料属性">
        {selected ? <><div className="dsh-knowledge-inspector-title"><span>资料属性</span><small>只保存在插件本地库</small></div><Property label="资料 ID" value={selected.id} mono /><Property label="来源" value={selected.source || '未标注'} /><Property label="字符数" value={String(selected.contentLength)} /><Property label="创建时间" value={formatTime(selected.createdAt)} /><Property label="更新时间" value={formatTime(selected.updatedAt || selected.createdAt)} /><Property label="系统分类" value={selected.systemCategory || '待分类'} /><Property label="摘要来源" value={selected.summarySource === 'model' ? '当前 DSH 模型' : '本地自动提要'} /><label className="dsh-knowledge-inspector-category"><span>我的分类</span><select value={selected.userCategory ?? ''} disabled={mutating} onChange={(event) => void move(event.target.value || null)}><option value="">未分类</option>{userCategories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><div className="dsh-knowledge-inspector-note">公开插件不会连接或安装任何外部项目。你的个人项目如需使用这些资料，应在项目侧主动同步。</div></> : null}
      </aside>
    </div>
  </div>
}

function FilterButton(props: { active: boolean; label: string; count: number; onClick: () => void }): ReactNode { return <button aria-pressed={props.active} data-active={props.active || undefined} onClick={props.onClick}><span>{props.label}</span><b>{props.count}</b></button> }
function Property(props: { label: string; value: string; mono?: boolean }): ReactNode { return <div className="dsh-knowledge-property"><span>{props.label}</span><strong className={props.mono ? 'is-mono' : undefined} title={props.value}>{props.value}</strong></div> }
function formatTime(value: string): string { try { return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return value } }
