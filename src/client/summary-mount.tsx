import { createRoot, type Root } from 'react-dom/client'
import { KnowledgeSummaryView } from './summary-view.js'

const ACTIVE_ATTRIBUTE = 'data-dsh-knowledge-summary-active'

/** 保存资料摘要面板状态并与任务看板、SSH 互斥。 */
export class SummaryController {
  private openValue = false
  private listeners = new Set<() => void>()
  getSnapshot(): { open: boolean } { return { open: this.openValue } }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  open(): void { this.setOpen(true) }
  close(): void { this.setOpen(false) }
  toggle(): void { this.setOpen(!this.openValue) }
  private setOpen(value: boolean): void {
    if (this.openValue === value) return
    this.openValue = value
    if (value) {
      document.documentElement.setAttribute(ACTIVE_ATTRIBUTE, '')
      document.dispatchEvent(new CustomEvent('dsh-panel-activate', { detail: 'knowledge-summary' }))
    } else document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE)
    this.listeners.forEach((listener) => listener())
  }
}

/** 挂载自愈侧栏入口，不修改 DSH Shell 自己的 React 子树。 */
export function mountSummarySidebar(controller: SummaryController): () => void {
  const entry = document.createElement('button')
  entry.type = 'button'; entry.dataset.dshKnowledgeSummaryEntry = ''; entry.className = 'dsh-knowledge-summary-entry'; entry.title = '知识库'; entry.setAttribute('aria-label', '打开知识库页面')
  entry.innerHTML = '<span class="dsh-knowledge-summary-entry-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 13.2A1.7 1.7 0 0 1 4.7 11.5H13"/><path d="M4.7 2H13v12H4.7A1.7 1.7 0 0 1 3 12.3V3.7A1.7 1.7 0 0 1 4.7 2Z"/><path d="M6 5h5M6 7.8h4"/></svg></span><span class="dsh-knowledge-summary-entry-label">知识库</span>'
  entry.addEventListener('click', () => {
    if (!controller.getSnapshot().open) {
      document.querySelectorAll<HTMLButtonElement>('[data-dsh-taskboard-entry][data-active], [data-dsh-ssh-entry][data-active]').forEach((panelEntry) => panelEntry.click())
    }
    controller.toggle()
  })
  const sync = (): void => { if (controller.getSnapshot().open) entry.dataset.active = 'true'; else delete entry.dataset.active }
  const unsubscribe = controller.subscribe(sync); sync()
  let root: HTMLElement | undefined
  const place = (): void => {
    const column = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
    root = column?.querySelector<HTMLElement>('[class*="logoRow"]')?.parentElement ?? column?.firstElementChild as HTMLElement | undefined
    if (!root) return
    const workspace = Array.from(root.children).find((element) => element instanceof HTMLElement && element.querySelector('[class*="sectionHeader"] [class*="sectionLabel"]')?.textContent?.trim() === '工作区')
    const family = Array.from(root.children).filter((element) => element instanceof HTMLElement && element.matches('[data-dsh-taskboard-entry], [data-dsh-ssh-entry], [data-dsh-knowledge-summary-entry]'))
    const fallback = family.filter((element) => element !== entry).at(-1)?.nextSibling ?? root.querySelector('button[class*="newSession"]')?.nextSibling
    const anchor = workspace ?? fallback ?? null
    if (entry.parentElement !== root || entry.nextSibling !== anchor) root.insertBefore(entry, anchor)
  }
  const observer = new MutationObserver(place); observer.observe(document.body, { childList: true, subtree: true }); place()
  const other = (event: Event): void => { if ((event as CustomEvent<string>).detail !== 'knowledge-summary') controller.close() }
  const leaveOnExternalPointer = (event: Event): void => {
    if (!controller.getSnapshot().open || !(event.target instanceof Node) || entry.contains(event.target)) return
    const view = document.querySelector<HTMLElement>('[data-dsh-knowledge-summary-view]')
    if (!view?.contains(event.target)) controller.close()
  }
  document.addEventListener('dsh-panel-activate', other)
  document.addEventListener('pointerdown', leaveOnExternalPointer, true)
  return () => { observer.disconnect(); unsubscribe(); document.removeEventListener('dsh-panel-activate', other); document.removeEventListener('pointerdown', leaveOnExternalPointer, true); entry.remove(); controller.close() }
}

/** 在中心列挂独立 React 根；Shell 重建中心列时自动重挂。 */
export function mountSummaryView(controller: SummaryController): () => void {
  let reactRoot: Root | undefined
  let container: HTMLDivElement | undefined
  const ensure = (): void => {
    if (container?.isConnected) return
    reactRoot?.unmount(); container?.remove(); reactRoot = undefined; container = undefined
    const center = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]')
    if (!center) return
    container = document.createElement('div'); container.dataset.dshKnowledgeSummaryView = ''; center.appendChild(container)
    reactRoot = createRoot(container); reactRoot.render(<KnowledgeSummaryView controller={controller} />)
  }
  const observer = new MutationObserver(ensure); observer.observe(document.body, { childList: true, subtree: true }); ensure()
  return () => { observer.disconnect(); reactRoot?.unmount(); container?.remove(); document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE) }
}
