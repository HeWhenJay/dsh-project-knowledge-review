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
  const [inspectorOpen, setInspectorOpen] = useState(false)
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
      <div className="dsh-knowledge-workspace-brand"><button className="dsh-knowledge-navigation-toggle" type="button" aria-label="打开资料导航" aria-expanded={navigationOpen} onClick={() => setNavigationOpen((value) => !value)}><MenuIcon /></button><span className="dsh-knowledge-workspace-mark" aria-hidden="true"><BookIcon /></span><div><h2 ref={titleRef} tabIndex={-1}>知识库</h2><p>{total} 份资料 · 保存在本机</p></div></div>
      <div className="dsh-knowledge-workspace-actions"><button className="dsh-knowledge-action-button" type="button" data-active={inspectorOpen || undefined} aria-expanded={inspectorOpen} onClick={() => setInspectorOpen((value) => !value)}><InfoIcon />资料信息</button><button className="dsh-knowledge-summary-close" onClick={() => controller.close()} aria-label="关闭知识库页面"><CloseIcon /></button></div>
    </header>
    {error ? <div className="dsh-knowledge-summary-error" role="alert">{error}<small>请检查“设置 → 知识复习”中的本地资料库路径，然后重试。</small></div> : null}
    <div className="dsh-knowledge-workspace-body">
      <button className="dsh-knowledge-navigation-backdrop" type="button" aria-label="关闭资料导航" onClick={() => setNavigationOpen(false)} />
      <aside className="dsh-knowledge-library-nav" aria-label="知识库导航">
        <div className="dsh-knowledge-nav-drawer-head"><span>资料导航</span><button type="button" aria-label="收起资料导航" onClick={() => setNavigationOpen(false)}><CloseIcon /></button></div>
        <form className="dsh-knowledge-library-search" onSubmit={(event) => { event.preventDefault(); resetPage(); setQuery(queryDraft.trim()) }}><SearchIcon /><Input aria-label="搜索资料标题、来源或摘要" value={queryDraft} placeholder="搜索知识库" onChange={(event) => setQueryDraft(event.target.value)} /><button type="submit" hidden>搜索</button></form>
        <div className="dsh-knowledge-library-scroll">
          <section><h3>浏览</h3><FilterButton icon={<LibraryIcon />} active={!systemCategory} label="全部资料" count={Object.values(systemCounts).reduce((sum, value) => sum + value, 0)} onClick={() => { resetPage(); setSystemCategory(''); setNavigationOpen(false) }} />{Object.entries(systemCounts).map(([name, count]) => <FilterButton key={name} icon={<TagIcon />} active={systemCategory === name} label={name} count={count} onClick={() => { resetPage(); setSystemCategory(name) }} />)}</section>
          <section><h3>我的分类</h3><FilterButton icon={<FolderIcon />} active={userCategory === undefined} label="全部分类" count={Object.values(userCounts).reduce((sum, value) => sum + value, 0)} onClick={() => { resetPage(); setUserCategory(undefined) }} /><FilterButton icon={<InboxIcon />} active={userCategory === ''} label="未分类" count={userCounts['未分类'] ?? 0} onClick={() => { resetPage(); setUserCategory('') }} />{userCategories.map((name) => <FilterButton key={name} icon={<FolderIcon />} active={userCategory === name} label={name} count={userCounts[name] ?? 0} onClick={() => { resetPage(); setUserCategory(name) }} />)}</section>
          <details className="dsh-knowledge-summary-create"><summary><PlusIcon />新建分类</summary><div><Input aria-label="新建用户分类名称" value={newCategory} placeholder="分类名称" disabled={mutating} onChange={(event) => setNewCategory(event.target.value)} /><Button size="sm" variant="primary" disabled={!newCategory.trim() || mutating} onClick={() => void createCategory()}>创建</Button></div></details>
          <section className="dsh-knowledge-document-section"><div className="dsh-knowledge-section-heading"><h3>资料</h3><span aria-live="polite">{loading ? '读取中' : `${total} 份`}</span></div>{items.map((item) => <button className="dsh-knowledge-document-row" key={item.id} aria-current={selectedId === item.id ? 'page' : undefined} data-active={selectedId === item.id || undefined} onClick={() => { setSelectedId(item.id); setDocumentView('summary'); setRenderMode('preview'); setNavigationOpen(false) }}><span className="dsh-knowledge-document-kind"><DocumentIcon /></span><span><strong>{item.title}</strong><small>{item.source || item.systemCategory || '本地资料'}</small></span><ChevronIcon /></button>)}{!loading && !items.length ? <div className="dsh-knowledge-summary-empty">当前范围没有资料</div> : null}</section>
        </div>
        <div className="dsh-knowledge-nav-pagination"><Button size="sm" variant="outline" disabled={!cursorStack.length || loading} onClick={() => { const stack = [...cursorStack]; setCursor(stack.pop()); setCursorStack(stack) }}>上一页</Button><Button size="sm" variant="outline" disabled={!hasMore || !nextCursor || loading} onClick={() => { setCursorStack((stack) => [...stack, cursor]); setCursor(nextCursor) }}>下一页</Button></div>
      </aside>
      <main className="dsh-knowledge-reader" aria-busy={sourceLoading}>
        {selected ? <>
          <div className="dsh-knowledge-reader-scroll">
            <div className="dsh-knowledge-reader-document">
              <div className="dsh-knowledge-reader-head"><div className="dsh-knowledge-reader-breadcrumb"><BookIcon /><span>知识库</span><ChevronIcon /><strong>{selected.systemCategory || '待分类'}</strong></div><h1>{selected.title}</h1><div className="dsh-knowledge-reader-meta"><span><SourceIcon />{selected.source || '未标注来源'}</span><span><SparkleIcon />{selected.summarySource === 'model' ? 'DSH 模型摘要' : '本地自动提要'}</span><span><ClockIcon />{formatRelativeTime(selected.updatedAt || selected.createdAt)}</span></div></div>
              <div className="dsh-knowledge-reader-controls"><div className="dsh-knowledge-reader-tabs" role="tablist" aria-label="资料阅读内容"><button role="tab" aria-selected={documentView === 'summary'} onClick={() => setDocumentView('summary')}>摘要</button><button role="tab" aria-selected={documentView === 'source'} onClick={() => setDocumentView('source')}>原始内容</button></div><div className="dsh-knowledge-render-toggle" aria-label="显示模式"><button aria-pressed={renderMode === 'preview'} onClick={() => setRenderMode('preview')}><PreviewIcon />渲染</button><button aria-pressed={renderMode === 'markdown'} onClick={() => setRenderMode('markdown')}><CodeIcon />Markdown 源码</button></div></div>
              <div className="dsh-knowledge-reader-status">{documentView === 'source' && sourceLoading ? '正在按需读取原始内容…' : sourceTruncated && documentView === 'source' ? '原始内容较长，当前显示截断预览' : documentView === 'source' ? `${selected.contentLength.toLocaleString('zh-CN')} 字符` : null}</div>
              <article className="dsh-knowledge-reader-canvas">{sourceLoading && documentView === 'source' ? <div className="dsh-knowledge-summary-empty">正在读取原始内容…</div> : renderMode === 'preview' ? <MarkdownText content={documentContent} /> : <pre className="dsh-knowledge-markdown-source"><code>{documentContent}</code></pre>}</article>
            </div>
          </div>
        </> : <div className="dsh-knowledge-reader-welcome"><span className="dsh-knowledge-workspace-mark"><BookIcon /></span><h2>选择一份资料开始阅读</h2><p>摘要和原始内容都支持安全 Markdown 预览。</p></div>}
      </main>
      <button className="dsh-knowledge-inspector-backdrop" type="button" aria-label="关闭资料信息" onClick={() => setInspectorOpen(false)} />
      <aside className="dsh-knowledge-inspector" aria-label="资料信息">
        {selected ? <><div className="dsh-knowledge-inspector-title"><div><span>资料信息</span><small>仅保存在插件本地库</small></div><button type="button" aria-label="关闭资料信息" onClick={() => setInspectorOpen(false)}><CloseIcon /></button></div><div className="dsh-knowledge-inspector-content"><label className="dsh-knowledge-inspector-category"><span>我的分类</span><select value={selected.userCategory ?? ''} disabled={mutating} onChange={(event) => void move(event.target.value || null)}><option value="">未分类</option>{userCategories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><div className="dsh-knowledge-property-group"><h3>文档</h3><Property icon={<SourceIcon />} label="来源" value={selected.source || '未标注'} /><Property icon={<TagIcon />} label="系统分类" value={selected.systemCategory || '待分类'} /><Property icon={<SparkleIcon />} label="摘要来源" value={selected.summarySource === 'model' ? '当前 DSH 模型' : '本地自动提要'} /><Property icon={<DocumentIcon />} label="字符数" value={selected.contentLength.toLocaleString('zh-CN')} /></div><div className="dsh-knowledge-property-group"><h3>时间</h3><Property icon={<ClockIcon />} label="创建时间" value={formatTime(selected.createdAt)} /><Property icon={<ClockIcon />} label="更新时间" value={formatTime(selected.updatedAt || selected.createdAt)} /></div><div className="dsh-knowledge-property-group"><h3>标识</h3><Property icon={<HashIcon />} label="资料 ID" value={selected.id} mono /></div><div className="dsh-knowledge-inspector-note"><LockIcon /><span>公开插件不会连接任何外部项目。项目侧如需使用资料，应主动同步。</span></div></div></> : null}
      </aside>
    </div>
  </div>
}

function FilterButton(props: { active: boolean; icon: ReactNode; label: string; count: number; onClick: () => void }): ReactNode { return <button aria-pressed={props.active} data-active={props.active || undefined} onClick={props.onClick}><span className="dsh-knowledge-filter-label">{props.icon}<span>{props.label}</span></span><b>{props.count}</b></button> }
function Property(props: { icon: ReactNode; label: string; value: string; mono?: boolean }): ReactNode { return <div className="dsh-knowledge-property"><span className="dsh-knowledge-property-icon">{props.icon}</span><span className="dsh-knowledge-property-label">{props.label}</span><strong className={props.mono ? 'is-mono' : undefined} title={props.value}>{props.value}</strong></div> }
function formatTime(value: string): string { try { return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return value } }
function formatRelativeTime(value: string): string { const time = new Date(value).getTime(); if (!Number.isFinite(time)) return formatTime(value); const days = Math.floor((Date.now() - time) / 86_400_000); if (days <= 0) return '今天更新'; if (days === 1) return '昨天更新'; if (days < 30) return `${days} 天前更新`; return formatTime(value) }

const icon = (children: ReactNode): ReactNode => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
function BookIcon(): ReactNode { return icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>) }
function MenuIcon(): ReactNode { return icon(<><path d="M4 6h16M4 12h16M4 18h16" /></>) }
function CloseIcon(): ReactNode { return icon(<><path d="m6 6 12 12M18 6 6 18" /></>) }
function SearchIcon(): ReactNode { return icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>) }
function InfoIcon(): ReactNode { return icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>) }
function LibraryIcon(): ReactNode { return icon(<><path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z" /><path d="M8 7h6" /></>) }
function FolderIcon(): ReactNode { return icon(<><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>) }
function InboxIcon(): ReactNode { return icon(<><path d="M4 4h16v16H4z" /><path d="M4 14h4l2 3h4l2-3h4" /></>) }
function TagIcon(): ReactNode { return icon(<><path d="M20 13 13 20l-9-9V4h7z" /><path d="M8.5 8.5h.01" /></>) }
function PlusIcon(): ReactNode { return icon(<><path d="M12 5v14M5 12h14" /></>) }
function DocumentIcon(): ReactNode { return icon(<><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 13h6M9 17h5" /></>) }
function ChevronIcon(): ReactNode { return icon(<><path d="m9 18 6-6-6-6" /></>) }
function SourceIcon(): ReactNode { return icon(<><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>) }
function SparkleIcon(): ReactNode { return icon(<><path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4z" /><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8zM19 13l-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8z" /></>) }
function ClockIcon(): ReactNode { return icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) }
function PreviewIcon(): ReactNode { return icon(<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>) }
function CodeIcon(): ReactNode { return icon(<><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" /></>) }
function HashIcon(): ReactNode { return icon(<><path d="M10 3 8 21M16 3l-2 18M4 9h16M3 15h16" /></>) }
function LockIcon(): ReactNode { return icon(<><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>) }
