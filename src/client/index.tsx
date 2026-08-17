import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Input, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { mountSummarySidebar, mountSummaryView, SummaryController } from './summary-mount.js'

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
  mode: 'local'
  documentCount?: number
  storePath?: string
  scope?: string
  sharedWithCurrentProject?: false
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
  ctx.effect(() => {
    const controller = new SummaryController()
    const disposers = [mountSummarySidebar(controller), mountSummaryView(controller)]
    return () => disposers.reverse().forEach((dispose) => dispose())
  }, 'project-knowledge-review: summary workspace')
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
    [data-pane='conversation'], [class*='centerCol'] { position: relative; }
    [data-dsh-knowledge-summary-view] { position: absolute; inset: 0; z-index: 60; display: none; overflow: hidden; background: var(--dsw-alias-bg-base); }
    html[data-dsh-knowledge-summary-active] [data-dsh-knowledge-summary-view] { display: block; }
    .dsh-knowledge-summary-entry{width:100%;height:32px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:8px;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}.dsh-knowledge-summary-entry:hover{background:var(--dsw-specific-sidebar-nav-item-hover);color:var(--dsw-alias-label-primary)}.dsh-knowledge-summary-entry[data-active]{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary);font-weight:600}.dsh-knowledge-summary-entry-icon{width:16px;height:16px;display:inline-flex;flex:none}.dsh-knowledge-summary-entry-icon svg{width:16px;height:16px}[data-dsh-frame][data-sidebar-collapsed] .dsh-knowledge-summary-entry{justify-content:center;padding:0}[data-dsh-frame][data-sidebar-collapsed] .dsh-knowledge-summary-entry-label{display:none}
    .dsh-knowledge-workspace{--knowledge-nav-width:clamp(180px,20%,220px);--knowledge-inspector-width:clamp(190px,20%,230px);height:100%;min-height:0;display:flex;flex-direction:column;container:knowledge-workspace / inline-size;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base));font-family:var(--dsw-font-family);box-sizing:border-box}.dsh-knowledge-workspace-bar{height:58px;flex:0 0 58px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-base) 92%,var(--dsw-alias-brand-primary) 8%)}.dsh-knowledge-workspace-brand,.dsh-knowledge-workspace-actions{display:flex;align-items:center;gap:10px}.dsh-knowledge-workspace-brand h2{margin:0;font-size:15px;line-height:1.2}.dsh-knowledge-workspace-brand p{margin:3px 0 0;color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-workspace-mark{width:30px;height:30px;display:inline-grid;place-items:center;border-radius:8px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font:800 14px/1 ui-monospace,SFMono-Regular,Consolas,monospace;box-shadow:0 5px 16px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}.dsh-knowledge-navigation-toggle{display:none;width:32px;height:32px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:600 17px/1 var(--dsw-font-family);cursor:pointer}.dsh-knowledge-summary-close{width:32px;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:22px;line-height:1;cursor:pointer}.dsh-knowledge-summary-close:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.dsh-knowledge-summary-error{position:absolute;z-index:5;top:66px;left:calc(var(--knowledge-nav-width) + 12px);right:calc(var(--knowledge-inspector-width) + 12px);padding:9px 12px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-error,#d24b4b) 32%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-label-error,#d24b4b) 10%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-error,#c44646);font-size:12px}.dsh-knowledge-summary-error small{display:block;margin-top:3px}
    .dsh-knowledge-workspace-body{position:relative;min-height:0;flex:1;display:grid;grid-template-columns:var(--knowledge-nav-width) minmax(0,1fr) var(--knowledge-inspector-width);overflow:hidden}.dsh-knowledge-navigation-backdrop{display:none}.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-workspace-body{grid-template-columns:var(--knowledge-nav-width) minmax(0,1fr) 0}.dsh-knowledge-library-nav{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}.dsh-knowledge-library-search{padding:12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-library-scroll{min-height:0;flex:1;overflow:auto;padding:8px}.dsh-knowledge-library-scroll section{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}.dsh-knowledge-library-scroll section h3{margin:7px 8px 5px;color:var(--dsw-alias-label-tertiary);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row){min-height:30px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 8px;display:flex;align-items:center;justify-content:space-between;font:inherit;font-size:12px;text-align:left;cursor:pointer}.dsh-knowledge-library-scroll section>button:hover{background:var(--dsw-specific-sidebar-nav-item-hover);color:var(--dsw-alias-label-primary)}.dsh-knowledge-library-scroll section>button[data-active]{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary);font-weight:650}.dsh-knowledge-library-scroll button b{font-size:10px;color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-summary-create{display:flex;gap:5px;padding:4px 2px 12px}.dsh-knowledge-document-section{padding-top:5px;border-top:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-document-count{margin:0 8px 5px;color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-document-row{width:100%;display:grid!important;grid-template-columns:26px minmax(0,1fr);align-items:center;gap:8px;padding:7px 8px!important;border:1px solid transparent!important;border-radius:7px!important;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;cursor:pointer}.dsh-knowledge-document-row[data-active]{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 28%,transparent)!important;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent)!important;color:var(--dsw-alias-label-primary)}.dsh-knowledge-document-kind{width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary);font:800 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.dsh-knowledge-document-row>span:last-child{min-width:0}.dsh-knowledge-document-row strong,.dsh-knowledge-document-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-knowledge-document-row strong{font-size:12px;line-height:1.4}.dsh-knowledge-document-row small{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:9px}.dsh-knowledge-nav-pagination{display:flex;gap:6px;justify-content:flex-end;padding:9px 10px;border-top:1px solid var(--dsw-alias-border-l2)}
    .dsh-knowledge-reader{min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base)}.dsh-knowledge-reader-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:20px clamp(18px,3cqw,32px) 14px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-reader-head>div:first-child{min-width:0}.dsh-knowledge-reader-head h1{margin:8px 0 4px;overflow:hidden;color:var(--dsw-alias-label-primary);font-size:22px;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.dsh-knowledge-reader-head p{margin:0;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.dsh-knowledge-reader-badges{display:flex;gap:6px}.dsh-knowledge-reader-badges span{padding:3px 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:9px}.dsh-knowledge-reader-tabs,.dsh-knowledge-render-toggle{display:inline-flex;padding:3px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}.dsh-knowledge-reader-tabs button,.dsh-knowledge-render-toggle button{min-height:27px;padding:0 10px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;cursor:pointer}.dsh-knowledge-reader-tabs button[aria-selected=true],.dsh-knowledge-render-toggle button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);box-shadow:0 1px 3px rgba(0,0,0,.08)}.dsh-knowledge-reader-toolbar{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px clamp(18px,3cqw,32px);border-bottom:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-reader-canvas{min-height:0;flex:1;overflow:auto;padding:30px clamp(18px,2.5cqw,34px) 70px}.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown,.dsh-knowledge-markdown-source{width:min(820px,100%);margin:0 auto}.dsh-knowledge-reader-welcome{height:100%;display:grid;place-content:center;justify-items:center;color:var(--dsw-alias-label-tertiary);text-align:center}.dsh-knowledge-reader-welcome .dsh-knowledge-workspace-mark{width:42px;height:42px;margin-bottom:10px}.dsh-knowledge-reader-welcome h2{margin:8px 0 4px;color:var(--dsw-alias-label-primary);font-size:18px}.dsh-knowledge-reader-welcome p{margin:0;font-size:12px}.dsh-knowledge-markdown{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:1.8;overflow-wrap:anywhere}.dsh-knowledge-markdown>:first-child{margin-top:0}.dsh-knowledge-markdown>:last-child{margin-bottom:0}.dsh-knowledge-markdown h2,.dsh-knowledge-markdown h3,.dsh-knowledge-markdown h4{margin:1.5em 0 .65em;color:var(--dsw-alias-label-primary);line-height:1.35;letter-spacing:-.01em}.dsh-knowledge-markdown h2{font-size:25px}.dsh-knowledge-markdown h3{padding-bottom:8px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:19px}.dsh-knowledge-markdown h4{font-size:15px}.dsh-knowledge-markdown p{margin:12px 0}.dsh-knowledge-markdown ul,.dsh-knowledge-markdown ol{margin:12px 0;padding-left:24px}.dsh-knowledge-markdown li{margin:7px 0}.dsh-knowledge-markdown strong{color:var(--dsw-alias-label-primary)}.dsh-knowledge-markdown code,.dsh-knowledge-markdown pre,.dsh-knowledge-markdown-source{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.dsh-knowledge-markdown code{padding:2px 5px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:.9em}.dsh-knowledge-markdown pre,.dsh-knowledge-markdown-source{overflow:auto;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.65;white-space:pre-wrap;word-break:break-word}.dsh-knowledge-markdown pre code{padding:0;border:0;background:transparent}.dsh-knowledge-markdown blockquote{margin:16px 0;padding:10px 14px;border-left:3px solid var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,transparent);color:var(--dsw-alias-label-secondary)}.dsh-knowledge-markdown a{color:var(--dsw-alias-brand-primary);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 36%,transparent)}.dsh-knowledge-markdown hr{margin:24px 0;border:0;border-top:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-markdown-table{max-width:100%;overflow:auto;margin:16px 0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px}.dsh-knowledge-markdown-table table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px}.dsh-knowledge-markdown-table th,.dsh-knowledge-markdown-table td{padding:9px 11px;border-right:1px solid var(--dsw-alias-border-l2);border-bottom:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-markdown-table th{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
    .dsh-knowledge-inspector{min-width:0;min-height:0;overflow:auto;border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);transition:opacity .14s ease}.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-inspector{overflow:hidden;opacity:0;pointer-events:none}.dsh-knowledge-inspector-title{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-inspector-title span{font-size:12px;font-weight:700}.dsh-knowledge-inspector-title small{color:var(--dsw-alias-label-tertiary);font-size:9px}.dsh-knowledge-property{padding:11px 16px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 65%,transparent)}.dsh-knowledge-property span,.dsh-knowledge-inspector-category>span{display:block;margin-bottom:5px;color:var(--dsw-alias-label-tertiary);font-size:9px;text-transform:uppercase;letter-spacing:.06em}.dsh-knowledge-property strong{display:block;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:550;text-overflow:ellipsis;white-space:nowrap}.dsh-knowledge-property strong.is-mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:9px}.dsh-knowledge-inspector-category{display:block;padding:13px 16px}.dsh-knowledge-inspector-category select{width:100%;height:33px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px}.dsh-knowledge-inspector-note{margin:4px 14px 16px;padding:10px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:9px;line-height:1.55}.dsh-knowledge-summary-empty{padding:24px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:11px}
    @container knowledge-workspace (max-width:680px){.dsh-knowledge-workspace{--knowledge-nav-width:0px;--knowledge-inspector-width:0px}.dsh-knowledge-workspace-body,.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-workspace-body{grid-template-columns:minmax(0,1fr) 0}.dsh-knowledge-navigation-toggle{display:inline-grid;place-items:center}.dsh-knowledge-library-nav{position:absolute;z-index:8;inset:0 auto 0 0;width:min(82cqw,280px);border-right:1px solid var(--dsw-alias-border-l1);box-shadow:10px 0 26px rgba(0,0,0,.18);transform:translateX(-105%);transition:transform .16s ease}.dsh-knowledge-workspace[data-navigation-open] .dsh-knowledge-library-nav{transform:translateX(0)}.dsh-knowledge-workspace[data-navigation-open] .dsh-knowledge-navigation-backdrop{position:absolute;z-index:7;inset:0 0 0 min(82cqw,280px);display:block;border:0;background:rgba(0,0,0,.24);cursor:pointer}.dsh-knowledge-inspector{display:none}.dsh-knowledge-workspace-actions>button:first-child{display:none}.dsh-knowledge-reader-head{align-items:flex-start;flex-direction:column;padding:16px 18px 12px}.dsh-knowledge-reader-head h1{display:-webkit-box;overflow:hidden;white-space:normal;-webkit-box-orient:vertical;-webkit-line-clamp:2}.dsh-knowledge-reader-toolbar{align-items:flex-start;flex-wrap:wrap;padding:7px 18px}.dsh-knowledge-reader-toolbar>span{flex-basis:100%}.dsh-knowledge-reader-canvas{padding:24px 18px 56px}.dsh-knowledge-summary-error{left:12px;right:12px}.dsh-knowledge-workspace-brand{min-width:0}.dsh-knowledge-workspace-brand>div{min-width:0}.dsh-knowledge-workspace-brand p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}

    /* 0.5.1 文档优先视觉层：借鉴成熟知识产品的信息层级，保留 DSH 原生主题。 */
    .dsh-knowledge-workspace{--knowledge-nav-width:238px;--knowledge-reader-width:720px;background:var(--dsw-alias-bg-base);letter-spacing:0}
    .dsh-knowledge-workspace svg{width:18px;height:18px;display:block;flex:none}
    .dsh-knowledge-workspace-bar{height:56px;flex-basis:56px;padding:0 14px 0 18px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 72%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-base) 97%,var(--dsw-alias-label-primary) 3%)}
    .dsh-knowledge-workspace-brand{gap:10px}.dsh-knowledge-workspace-brand h2{font-size:14px;font-weight:680;letter-spacing:-.01em}.dsh-knowledge-workspace-brand p{margin-top:2px;font-size:10px}
    .dsh-knowledge-workspace-mark{width:30px;height:30px;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-brand-primary);box-shadow:none}.dsh-knowledge-workspace-mark svg{width:16px;height:16px}
    .dsh-knowledge-workspace-actions{gap:6px}.dsh-knowledge-action-button,.dsh-knowledge-summary-close{height:32px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}.dsh-knowledge-action-button{display:flex;align-items:center;gap:6px;padding:0 9px;font-size:11px}.dsh-knowledge-action-button svg{width:15px;height:15px}.dsh-knowledge-action-button:hover,.dsh-knowledge-action-button[data-active],.dsh-knowledge-summary-close:hover{background:var(--dsw-specific-sidebar-nav-item-hover);color:var(--dsw-alias-label-primary)}.dsh-knowledge-summary-close{width:32px;display:grid;place-items:center}.dsh-knowledge-summary-close svg{width:17px;height:17px}
    .dsh-knowledge-navigation-toggle{place-items:center;border:0;background:transparent}.dsh-knowledge-navigation-toggle svg{width:18px;height:18px}
    .dsh-knowledge-workspace-body,.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-workspace-body{grid-template-columns:var(--knowledge-nav-width) minmax(0,1fr);isolation:isolate;background:var(--dsw-alias-bg-base)}
    .dsh-knowledge-library-nav{border-right:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 68%,transparent);background:color-mix(in srgb,var(--dsw-alias-bg-base) 96%,var(--dsw-alias-label-primary) 4%)}
    .dsh-knowledge-nav-drawer-head{display:none}.dsh-knowledge-library-search{position:relative;padding:14px 12px 10px;border:0}.dsh-knowledge-library-search>svg{position:absolute;z-index:1;left:23px;top:24px;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);pointer-events:none}.dsh-knowledge-library-search input{height:34px;padding-left:30px!important;border-color:transparent!important;border-radius:8px!important;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 72%,transparent)!important;font-size:11px!important}.dsh-knowledge-library-search input:focus{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 46%,transparent)!important;background:var(--dsw-alias-bg-base)!important}
    .dsh-knowledge-library-scroll{padding:4px 8px 16px;scrollbar-width:thin}.dsh-knowledge-library-scroll section{gap:2px;margin-bottom:15px}.dsh-knowledge-library-scroll section h3{margin:9px 10px 6px;color:var(--dsw-alias-label-tertiary);font-size:9px;font-weight:680;letter-spacing:.1em}
    .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row){min-height:31px;padding:5px 9px;border-radius:7px;font-size:11px}.dsh-knowledge-filter-label{min-width:0;display:flex;align-items:center;gap:8px}.dsh-knowledge-filter-label>svg{width:14px;height:14px;color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-library-scroll section>button[data-active] .dsh-knowledge-filter-label>svg{color:var(--dsw-alias-brand-primary)}.dsh-knowledge-library-scroll button b{min-width:18px;padding:1px 5px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 8%,transparent);font-size:9px;font-weight:600;text-align:center}
    .dsh-knowledge-summary-create{margin:-4px 6px 14px;color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-summary-create summary{display:flex;align-items:center;gap:7px;padding:6px 4px;list-style:none;cursor:pointer}.dsh-knowledge-summary-create summary::-webkit-details-marker{display:none}.dsh-knowledge-summary-create summary svg{width:13px;height:13px}.dsh-knowledge-summary-create>div{display:flex;gap:5px;padding-top:5px}.dsh-knowledge-summary-create input{font-size:10px!important}
    .dsh-knowledge-document-section{padding-top:12px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 55%,transparent)}.dsh-knowledge-section-heading{display:flex;align-items:center;justify-content:space-between;margin:0 10px 7px}.dsh-knowledge-section-heading h3{margin:0!important}.dsh-knowledge-section-heading span{color:var(--dsw-alias-label-tertiary);font-size:9px}.dsh-knowledge-document-count{display:none}
    .dsh-knowledge-document-row{position:relative;grid-template-columns:24px minmax(0,1fr) 14px;gap:8px;min-height:50px;margin-bottom:3px;padding:7px 8px;border-radius:8px}.dsh-knowledge-document-row:hover{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-hover) 72%,transparent)}.dsh-knowledge-document-row[data-active]{background:var(--dsw-specific-sidebar-nav-item-active)}.dsh-knowledge-document-row[data-active]::before{content:'';position:absolute;left:-2px;top:11px;bottom:11px;width:2px;border-radius:4px;background:var(--dsw-alias-brand-primary)}.dsh-knowledge-document-kind{width:24px;height:30px;border:0;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 74%,transparent);color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-document-kind svg{width:13px;height:13px}.dsh-knowledge-document-row>span:nth-child(2){gap:4px}.dsh-knowledge-document-row strong{font-size:10.5px;font-weight:620;line-height:1.35}.dsh-knowledge-document-row small{font-size:9px}.dsh-knowledge-document-row>svg{width:12px;height:12px;color:transparent;transition:transform .15s ease,color .15s ease}.dsh-knowledge-document-row:hover>svg,.dsh-knowledge-document-row[data-active]>svg{color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-document-row:hover>svg{transform:translateX(2px)}
    .dsh-knowledge-nav-pagination{min-height:47px;padding:8px 12px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 60%,transparent);background:transparent}.dsh-knowledge-nav-pagination button{min-height:28px!important;font-size:10px!important}
    .dsh-knowledge-reader{position:relative;background:var(--dsw-alias-bg-base)}.dsh-knowledge-reader-scroll{min-height:0;flex:1;overflow:auto;scrollbar-width:thin}.dsh-knowledge-reader-document{width:min(100%,var(--knowledge-reader-width));min-height:100%;margin:0 auto;padding:44px clamp(26px,6cqw,64px) 88px;box-sizing:border-box}
    .dsh-knowledge-reader-head{display:block;padding:0;border:0}.dsh-knowledge-reader-breadcrumb{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-reader-breadcrumb svg{width:12px;height:12px}.dsh-knowledge-reader-breadcrumb strong{color:var(--dsw-alias-label-secondary);font-weight:600}.dsh-knowledge-reader-head h1{margin:22px 0 12px;overflow:visible;color:var(--dsw-alias-label-primary);font-size:clamp(25px,3.2cqw,34px);font-weight:720;line-height:1.2;letter-spacing:-.035em;text-overflow:unset;white-space:normal}.dsh-knowledge-reader-meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;color:var(--dsw-alias-label-tertiary);font-size:10px}.dsh-knowledge-reader-meta span{min-width:0;display:inline-flex;align-items:center;gap:5px}.dsh-knowledge-reader-meta svg{width:12px;height:12px}.dsh-knowledge-reader-meta span:first-child{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-knowledge-reader-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:30px;padding-bottom:10px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 65%,transparent)}.dsh-knowledge-reader-tabs,.dsh-knowledge-render-toggle{padding:2px;border:0;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 72%,transparent)}.dsh-knowledge-reader-tabs button,.dsh-knowledge-render-toggle button{min-height:29px;display:inline-flex;align-items:center;gap:5px;padding:0 10px;border-radius:6px;font-size:10px}.dsh-knowledge-render-toggle button svg{width:13px;height:13px}.dsh-knowledge-reader-tabs button[aria-selected=true],.dsh-knowledge-render-toggle button[aria-pressed=true]{background:var(--dsw-alias-bg-base);box-shadow:0 1px 4px color-mix(in srgb,#000 10%,transparent)}
    .dsh-knowledge-reader-status{margin-top:24px;color:var(--dsw-alias-brand-primary);font-size:10px;font-weight:650;letter-spacing:.09em;text-transform:uppercase}.dsh-knowledge-reader-canvas{overflow:visible;padding:0}.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown{max-width:none;margin:0}.dsh-knowledge-markdown{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:1.85}.dsh-knowledge-markdown h2{margin:30px 0 14px;color:var(--dsw-alias-label-primary);font-size:22px;line-height:1.3;letter-spacing:-.02em}.dsh-knowledge-markdown h3{margin:26px 0 11px;color:var(--dsw-alias-label-primary);font-size:17px;line-height:1.4}.dsh-knowledge-markdown h4{margin:22px 0 9px;color:var(--dsw-alias-label-primary);font-size:14px}.dsh-knowledge-markdown p{margin:12px 0}.dsh-knowledge-markdown ul,.dsh-knowledge-markdown ol{margin:12px 0;padding-left:1.5em}.dsh-knowledge-markdown li{margin:8px 0;padding-left:4px}.dsh-knowledge-markdown li::marker{color:var(--dsw-alias-brand-primary)}.dsh-knowledge-markdown strong{color:var(--dsw-alias-label-primary);font-weight:680}.dsh-knowledge-markdown blockquote{margin:20px 0;padding:12px 16px;border-left:3px solid var(--dsw-alias-brand-primary);border-radius:0 8px 8px 0;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,transparent)}.dsh-knowledge-markdown code{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 9%,transparent);font-size:.88em}.dsh-knowledge-markdown pre,.dsh-knowledge-markdown-source{margin:18px 0;padding:16px 18px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 70%,transparent);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 74%,transparent);font-size:12px;line-height:1.65}.dsh-knowledge-markdown hr{margin:32px 0;border:0;border-top:1px solid var(--dsw-alias-border-l2)}.dsh-knowledge-markdown a{color:var(--dsw-alias-brand-primary);text-underline-offset:3px}.dsh-knowledge-markdown-table{margin:18px 0;border:1px solid var(--dsw-alias-border-l2);border-radius:10px}.dsh-knowledge-markdown th{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 78%,transparent)}
    .dsh-knowledge-inspector-backdrop{position:absolute;z-index:9;inset:0;display:none;border:0;background:color-mix(in srgb,#10141c 18%,transparent);backdrop-filter:blur(1px)}.dsh-knowledge-workspace[data-inspector-open] .dsh-knowledge-inspector-backdrop{display:block}.dsh-knowledge-inspector{position:absolute;z-index:10;inset:0 0 0 auto;width:min(350px,88%);min-width:0;display:flex;flex-direction:column;overflow:hidden;border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);box-shadow:-18px 0 46px color-mix(in srgb,#000 18%,transparent);opacity:0;pointer-events:none;transform:translateX(102%);transition:transform .2s ease,opacity .2s ease}.dsh-knowledge-workspace[data-inspector-open] .dsh-knowledge-inspector{opacity:1;pointer-events:auto;transform:translateX(0)}.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-inspector{overflow:hidden;opacity:0;pointer-events:none}
    .dsh-knowledge-inspector-title{min-height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 68%,transparent)}.dsh-knowledge-inspector-title>div{display:flex;flex-direction:column;gap:3px}.dsh-knowledge-inspector-title span{font-size:13px;font-weight:680}.dsh-knowledge-inspector-title small{font-size:9px}.dsh-knowledge-inspector-title button{width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.dsh-knowledge-inspector-title button:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}.dsh-knowledge-inspector-title button svg{width:16px;height:16px}.dsh-knowledge-inspector-content{min-height:0;overflow:auto;padding:18px}.dsh-knowledge-inspector-category{padding:0 0 20px}.dsh-knowledge-inspector-category>span{margin-bottom:8px;font-size:9px}.dsh-knowledge-inspector-category select{height:36px;border-radius:8px;font-size:11px}.dsh-knowledge-property-group{padding:18px 0;border-top:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 60%,transparent)}.dsh-knowledge-property-group h3{margin:0 0 10px;color:var(--dsw-alias-label-tertiary);font-size:9px;letter-spacing:.09em;text-transform:uppercase}.dsh-knowledge-property{display:grid;grid-template-columns:18px 84px minmax(0,1fr);align-items:center;gap:8px;padding:8px 0;border:0}.dsh-knowledge-property-icon{color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-property-icon svg{width:14px;height:14px}.dsh-knowledge-property-label{margin:0;color:var(--dsw-alias-label-tertiary);font-size:10px;letter-spacing:0;text-transform:none}.dsh-knowledge-property strong{font-size:10.5px;text-align:right}.dsh-knowledge-property strong.is-mono{font-size:9px}.dsh-knowledge-inspector-note{display:flex;align-items:flex-start;gap:9px;margin:4px 0 0;padding:12px;border:0;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent);font-size:9px;line-height:1.6}.dsh-knowledge-inspector-note svg{width:14px;height:14px;margin-top:1px;color:var(--dsw-alias-brand-primary)}
    .dsh-knowledge-summary-error{left:calc(var(--knowledge-nav-width) + 14px);right:14px;border-radius:10px;box-shadow:0 8px 28px color-mix(in srgb,#000 13%,transparent)}
    @container knowledge-workspace (max-width:680px){.dsh-knowledge-workspace{--knowledge-nav-width:0px}.dsh-knowledge-workspace-body,.dsh-knowledge-workspace:not([data-inspector-open]) .dsh-knowledge-workspace-body{grid-template-columns:minmax(0,1fr)}.dsh-knowledge-navigation-toggle{display:grid}.dsh-knowledge-workspace-actions>button:first-child{display:flex}.dsh-knowledge-library-nav{display:flex;width:min(84cqw,320px)}.dsh-knowledge-inspector{display:flex;width:min(84cqw,320px)}.dsh-knowledge-nav-drawer-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 16px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 65%,transparent);color:var(--dsw-alias-label-primary);font-size:12px;font-weight:680}.dsh-knowledge-nav-drawer-head button{width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.dsh-knowledge-nav-drawer-head button:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}.dsh-knowledge-nav-drawer-head svg{width:16px;height:16px}.dsh-knowledge-workspace[data-navigation-open] .dsh-knowledge-navigation-backdrop{inset:0 0 0 min(84cqw,320px)}.dsh-knowledge-reader-document{padding:28px 20px 64px}.dsh-knowledge-reader-head h1{margin-top:17px;font-size:25px}.dsh-knowledge-reader-controls{align-items:flex-start;flex-direction:column;margin-top:23px}.dsh-knowledge-render-toggle{align-self:flex-end;margin-top:-41px}.dsh-knowledge-render-toggle button{padding:0 8px}.dsh-knowledge-reader-meta span:first-child{flex-basis:100%}.dsh-knowledge-reader-status{margin-top:20px}.dsh-knowledge-markdown{font-size:13px}.dsh-knowledge-summary-error{left:10px;right:10px}}
    @container knowledge-workspace (max-width:430px){.dsh-knowledge-workspace-brand p{display:none}.dsh-knowledge-action-button{width:32px;padding:0;justify-content:center;font-size:0}.dsh-knowledge-action-button svg{width:16px;height:16px}.dsh-knowledge-render-toggle button{font-size:0}.dsh-knowledge-render-toggle button svg{width:14px;height:14px}.dsh-knowledge-reader-document{padding-inline:17px}.dsh-knowledge-reader-head h1{font-size:23px}}
    /* 第二轮降噪：阅读画布隔离皮肤水印，筛选与显示模式退居次级。 */
    .dsh-knowledge-reader,.dsh-knowledge-reader-scroll,.dsh-knowledge-reader-document{background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base))}
    .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active]{background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 9%,transparent);color:var(--dsw-alias-label-primary);font-weight:620}.dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active] .dsh-knowledge-filter-label>svg{color:var(--dsw-alias-label-secondary)}
    .dsh-knowledge-document-row{border:0}.dsh-knowledge-document-row[data-active]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-base))}.dsh-knowledge-document-row[data-active]::before{top:12px;bottom:12px}
    .dsh-knowledge-reader-head h1{margin-top:26px}.dsh-knowledge-reader-meta{margin-top:14px}
    .dsh-knowledge-reader-tabs{padding:0;border-radius:0;background:transparent;gap:20px}.dsh-knowledge-reader-tabs button{position:relative;padding:0 1px;border-radius:0;background:transparent!important;box-shadow:none!important;font-size:11px}.dsh-knowledge-reader-tabs button[aria-selected=true]{color:var(--dsw-alias-label-primary);font-weight:680}.dsh-knowledge-reader-tabs button[aria-selected=true]::after{content:'';position:absolute;left:0;right:0;bottom:-11px;height:2px;border-radius:3px;background:var(--dsw-alias-brand-primary)}
    .dsh-knowledge-render-toggle{gap:2px;padding:0;background:transparent}.dsh-knowledge-render-toggle button{min-height:27px;padding:0 7px;color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-render-toggle button[aria-pressed=true]{background:transparent;box-shadow:none;color:var(--dsw-alias-label-primary);font-weight:650}.dsh-knowledge-render-toggle button:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 8%,transparent)}
    .dsh-knowledge-reader-status:empty{display:none}.dsh-knowledge-reader-status:not(:empty){margin-top:22px}.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown{margin-top:24px}.dsh-knowledge-reader-status:not(:empty)+.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown{margin-top:8px}.dsh-knowledge-markdown h2:first-child,.dsh-knowledge-markdown h3:first-child{margin-top:0}.dsh-knowledge-markdown ul,.dsh-knowledge-markdown ol{padding-left:1.25em}.dsh-knowledge-markdown li{margin:6px 0;padding-left:2px}.dsh-knowledge-markdown li::marker{color:color-mix(in srgb,var(--dsw-alias-brand-primary) 75%,var(--dsw-alias-label-secondary))}
    /* 第三轮发布门禁：深色阅读对比、层次与非阻断式资料抽屉。 */
    .dsh-knowledge-library-nav{background:var(--dsw-alias-button-floating-fill,var(--dsw-alias-bg-layer-1))}
    .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active]{background:transparent;color:var(--dsw-alias-label-primary);font-weight:680}.dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active] .dsh-knowledge-filter-label>svg{color:var(--dsw-alias-brand-primary)}
    .dsh-knowledge-render-toggle{padding:2px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 78%,transparent);border-radius:7px;background:var(--dsw-alias-button-floating-fill,var(--dsw-alias-bg-layer-1))}.dsh-knowledge-render-toggle button{min-height:27px;border-radius:5px}.dsh-knowledge-render-toggle button[aria-pressed=true]{background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base));box-shadow:0 1px 3px color-mix(in srgb,#000 10%,transparent);color:var(--dsw-alias-label-primary);font-weight:680}
    .dsh-knowledge-inspector{background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base))}.dsh-knowledge-inspector-backdrop{background:color-mix(in srgb,#10141c 8%,transparent);backdrop-filter:none}
    body[data-ds-dark-theme] .dsh-knowledge-markdown{color:color-mix(in srgb,var(--dsw-alias-label-primary) 78%,var(--dsw-alias-label-secondary));line-height:1.92}body[data-ds-dark-theme] .dsh-knowledge-markdown li{margin-block:8px}body[data-ds-dark-theme] .dsh-knowledge-reader-meta,body[data-ds-dark-theme] .dsh-knowledge-reader-breadcrumb,body[data-ds-dark-theme] .dsh-knowledge-render-toggle button,body[data-ds-dark-theme] .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row),body[data-ds-dark-theme] .dsh-knowledge-document-row small{color:var(--dsw-alias-label-secondary)}body[data-ds-dark-theme] .dsh-knowledge-reader-tabs button:not([aria-selected=true]){color:var(--dsw-alias-label-secondary)}body[data-ds-dark-theme] .dsh-knowledge-render-toggle button[aria-pressed=true]{color:var(--dsw-alias-label-primary)}
    html[data-dsh-knowledge-summary-active] [data-pane='sidebar'] [role='treeitem'][aria-selected='true']{background:transparent!important;color:var(--dsw-alias-label-secondary)!important;font-weight:inherit!important}
    .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active]{color:var(--dsw-alias-label-secondary);font-weight:620}
    .dsh-knowledge-summary-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d24b4b) 32%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d24b4b) 10%,var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base)));color:var(--dsw-alias-state-error-primary,#d24b4b)}
    .dsh-knowledge-summary-entry:focus-visible,.dsh-knowledge-workspace :is(button,select,summary,[role='tabpanel']):focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsh-knowledge-summary-entry:focus-visible{outline-offset:-2px}
    @media (prefers-reduced-motion:reduce){.dsh-knowledge-workspace *,.dsh-knowledge-summary-entry{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
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
  const [ocrKey, setOcrKey] = useState('')
  const [asrKey, setAsrKey] = useState('')
  const [credentials, setCredentials] = useState<Record<string, CredentialState>>({})

  const load = async (): Promise<void> => {
    const abort = new AbortController()
    const timeout = window.setTimeout(() => abort.abort(), 10_000)
    try {
      const response = await fetch(SETTINGS_ENDPOINT, { cache: 'no-store', signal: abort.signal })
      const payload = await response.json() as SettingsEnvelope
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || '设置读取失败')
      setSettings(payload.value)
      setRevision(payload.revision)
      await loadCredentials(payload.value)
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === 'AbortError' ? '设置读取超时。插件升级后请刷新 DSH 页面；若仍未恢复，再重启当前 DSH Web 进程。' : messageOf(error))
    } finally {
      window.clearTimeout(timeout)
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

  const saveCredential = async (kind: 'ocr' | 'asr'): Promise<boolean> => {
    if (!api || !settings) return false
    const ref = kind === 'ocr' ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv
    const value = (kind === 'ocr' ? ocrKey : asrKey).trim()
    if (!value) { setNotice('请输入 API Key；已保存的 Key 不会回显。'); return false }
    setBusy(true)
    try {
      const response = await api.credentials.set({ ref, value })
      if (!response.result.ok) throw new Error(response.result.error.message)
      kind === 'ocr' ? setOcrKey('') : setAsrKey('')
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
      <p style={styles.intro}>管理插件自己的本地知识库、知识点摘要和分类，以及可选的 OCR、ASR。公开插件不会连接或安装任何外部项目。</p>
    </div>

    {notice && <div style={styles.notice}>{notice}</div>}

    <Card title="基础服务" description="关闭后系统提示词保持静默，所有知识复习工具都会拒绝执行。">
      <Toggle label="开启知识复习服务" checked={settings.enabled} disabled={busy} onChange={(value) => void saveField('enabled', value)} />
      <Field label="回答策略" help="严格知识库只允许 evidence 结论；知识库仅供参考允许模型补充，但会明确标注来源边界。">
        <PolicySelect value={settings.answerPolicy} disabled={busy} onChange={(value) => void saveField('answerPolicy', value)} />
      </Field>
      <TextField label="知识库名称" value={settings.projectName} disabled={busy} onChange={(value) => updateDraft('projectName', value)} onSave={() => void saveField('projectName', settings.projectName)} />
      <TextField label="本地资料库路径" value={settings.localStorePath} disabled={busy} onChange={(value) => updateDraft('localStorePath', value)} onSave={() => void saveField('localStorePath', settings.localStorePath)} />
    </Card>

    <KnowledgeBrowser />

    <Card title="本地服务设置" description="请求超时仅用于可选 OCR 与 ASR；本地文本入库和检索不访问网络。">
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

function PolicySelect(props: { value: KnowledgeSettingsView['answerPolicy']; disabled: boolean; onChange: (value: KnowledgeSettingsView['answerPolicy']) => void }): ReactNode {
  return <div style={styles.policyGrid}>
    <button type="button" style={{ ...styles.policyOption, ...(props.value === 'strict' ? styles.policyOptionActive : {}) }} disabled={props.disabled} onClick={() => props.onChange('strict')}>
      <strong>严格知识库</strong><span style={styles.policyDescription}>仅根据已有 evidence 回答；无证据时拒答</span>
    </button>
    <button type="button" style={{ ...styles.policyOption, ...(props.value === 'reference' ? styles.policyOptionActive : {}) }} disabled={props.disabled} onClick={() => props.onChange('reference')}>
      <strong>知识库仅供参考</strong><span style={styles.policyDescription}>知识库优先，允许明确标注的模型补充</span>
    </button>
  </div>
}

function KnowledgeBrowser(): ReactNode {
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
  }, [open, cursor, query])

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
      <span style={styles.browserHeaderMeta}>{overview ? `${overview.documentCount ?? total} 条` : ''}<svg style={{ ...styles.browserChevron, transform: open ? 'rotate(180deg)' : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    {open && <div style={styles.browserBody}>
      {overview && <div style={styles.overviewGrid}>
        <span><small>存储模式</small><strong>插件本地知识库</strong></span>
        <span><small>资料数量</small><strong>{overview.documentCount ?? total}</strong></span>
        <span><small>作用域</small><strong>DSH 用户级本地</strong></span>
        <span><small>外部项目依赖</small><strong>无</strong></span>
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
  policyGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  policyOption: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 11px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, background: 'transparent', color: 'var(--dsw-alias-label-primary)', textAlign: 'left', cursor: 'pointer' },
  policyOptionActive: { borderColor: 'var(--dsw-alias-brand-primary)', background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)', boxShadow: '0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)' },
  policyDescription: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, lineHeight: 1.4 },
  browserCard: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-background-l1)', overflow: 'hidden' },
  browserHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', border: 0, background: 'transparent', color: 'var(--dsw-alias-label-primary)', textAlign: 'left', cursor: 'pointer', font: 'inherit' },
  browserSubtitle: { display: 'block', marginTop: 4, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 },
  browserHeaderMeta: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 },
  browserChevron: { width: 17, height: 17, transition: 'transform .16s ease' },
  browserBody: { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 16px', borderTop: '1px solid var(--dsw-alias-border-l2)' },
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, paddingTop: 14 },
  storePath: { padding: '8px 10px', borderRadius: 7, background: 'var(--dsw-alias-background-l2)', color: 'var(--dsw-alias-label-secondary)', fontSize: 11, overflowWrap: 'anywhere' },
  browserSearch: { display: 'flex', alignItems: 'center', gap: 8 },
  browserError: { padding: 10, borderRadius: 8, background: 'color-mix(in srgb, var(--dsw-alias-state-error-primary, #d24b4b) 10%, transparent)', color: 'var(--dsw-alias-state-error-primary, #d24b4b)', fontSize: 12 },
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
