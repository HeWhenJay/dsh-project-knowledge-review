window.__ModuleLoader__.load({ id: "dsh-project-knowledge-review", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react2 = require("react");

// src/client/summary-mount.tsx
var import_client = require("react-dom/client");

// src/client/summary-view.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client-settings.ts
var SETTINGS_ENDPOINT = "/api/project-knowledge-review/settings";
var KNOWLEDGE_ENDPOINT = "/api/project-knowledge-review/knowledge";

// src/client/markdown-text.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function MarkdownText({ content, className = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `dsh-knowledge-markdown ${className}`.trim(), children: renderBlocks(content || "") });
}
function renderBlocks(content) {
  const lines = normalizeMarkdown(content).split("\n");
  const blocks = [];
  let paragraph = [];
  let code = null;
  let index = 0;
  const flush = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: renderInline(text) }, `p-${blocks.length}`));
    paragraph = [];
  };
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (code) {
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code.join("\n") }) }, `code-${blocks.length}`));
        code = null;
      } else {
        flush();
        code = [];
      }
      index += 1;
      continue;
    }
    if (code) {
      code.push(line);
      index += 1;
      continue;
    }
    if (!trimmed) {
      flush();
      index += 1;
      continue;
    }
    const table = parseTable(lines, index);
    if (table) {
      flush();
      blocks.push(renderTable(table.block, `table-${blocks.length}`));
      index = table.next;
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push(renderHeading(heading[1].length, heading[2], `h-${blocks.length}`));
      index += 1;
      continue;
    }
    const list = parseList(lines, index);
    if (list) {
      flush();
      blocks.push(renderList(list.items, list.ordered, `list-${blocks.length}`, list.start));
      index = list.next;
      continue;
    }
    const quote = /^>\s?(.+)$/.exec(trimmed);
    if (quote) {
      flush();
      blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", { children: renderInline(quote[1]) }, `q-${blocks.length}`));
      index += 1;
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      flush();
      blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", {}, `hr-${blocks.length}`));
      index += 1;
      continue;
    }
    paragraph.push(trimmed);
    index += 1;
  }
  if (code) blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code.join("\n") }) }, `code-${blocks.length}`));
  flush();
  return blocks.length ? blocks : [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u6682\u65E0\u5185\u5BB9" }, "empty")];
}
function normalizeMarkdown(content) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}
function renderHeading(level, text, key) {
  if (level === 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: renderInline(text) }, key);
  if (level === 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: renderInline(text) }, key);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: renderInline(text) }, key);
}
function parseList(lines, start) {
  const first = /^(\s*)(?:(\d+)[.)]|[-*+])\s+(.+)$/.exec(lines[start]);
  if (!first) return null;
  const ordered = Boolean(first[2]);
  const indent = first[1].replace(/\t/g, "    ").length;
  const items = [];
  let index = start;
  while (index < lines.length) {
    const match = /^(\s*)(?:(\d+)[.)]|[-*+])\s+(.+)$/.exec(lines[index]);
    if (!match || Boolean(match[2]) !== ordered || match[1].replace(/\t/g, "    ").length !== indent) break;
    let value = match[3];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(\s*)(?:(\d+)[.)]|[-*+])\s+/.test(lines[index])) {
      if (lines[index].match(/^\s+/)) {
        value += ` ${lines[index].trim()}`;
        index += 1;
      } else break;
    }
    items.push(value);
  }
  return { items, ordered, start: ordered && Number(first[2]) !== 1 ? Number(first[2]) : void 0, next: index };
}
function renderList(items, ordered, key, start) {
  const children = items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: renderInline(item) }, `${key}-${index}`));
  return ordered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { start, children }, key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children }, key);
}
function parseTable(lines, start) {
  if (start + 1 >= lines.length) return null;
  const headers = tableRow(lines[start]);
  const delimiters = tableRow(lines[start + 1]);
  if (!headers || !delimiters || headers.length !== delimiters.length) return null;
  const alignments = delimiters.map((value) => {
    const normalized = value.replace(/\s+/g, "");
    if (!/^:?-{3,}:?$/.test(normalized)) return null;
    return normalized.startsWith(":") && normalized.endsWith(":") ? "center" : normalized.endsWith(":") ? "right" : "left";
  });
  if (alignments.some((value) => value === null)) return null;
  const rows = [];
  let index = start + 2;
  while (index < lines.length && lines[index].trim()) {
    const cells = tableRow(lines[index]);
    if (!cells) break;
    rows.push(Array.from({ length: headers.length }, (_, cell) => cells[cell] || ""));
    index += 1;
  }
  return { block: { headers, rows, alignments }, next: index };
}
function tableRow(line) {
  let value = line.trim();
  if (!value.includes("|")) return null;
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);
  const cells = [];
  let current = "";
  let code = false;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\\" && value[index + 1] === "|") {
      current += "|";
      index += 1;
      continue;
    }
    if (value[index] === "`") code = !code;
    if (value[index] === "|" && !code) {
      cells.push(current.trim());
      current = "";
    } else current += value[index];
  }
  cells.push(current.trim());
  return cells.length > 1 ? cells : null;
}
function renderTable(table, key) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-knowledge-markdown-table", role: "region", "aria-label": "Markdown \u8868\u683C\uFF0C\u53EF\u6A2A\u5411\u6EDA\u52A8", tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: table.headers.map((cell, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { textAlign: table.alignments[index] }, children: renderInline(cell) }, index)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: table.rows.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.map((cell, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { textAlign: table.alignments[index] }, children: renderInline(cell) }, index)) }, rowIndex)) })
  ] }) }, key);
}
function renderInline(text) {
  const nodes = [];
  const pattern = /(\[([^\]]+)]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${match.index}-${match[0]}`;
    if (match[2] && match[3]) {
      const href = safeHref(match[3]);
      nodes.push(href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, target: "_blank", rel: "noreferrer", children: renderInline(match[2]) }, key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: match[2] }, key));
    } else if (match[5]) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: match[5] }, key));
    else if (match[7]) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: renderInline(match[7]) }, key));
    else if (match[9]) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: renderInline(match[9]) }, key));
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function safeHref(raw) {
  const value = raw.trim();
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : void 0;
  } catch {
    return void 0;
  }
}

// src/client/summary-view.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function KnowledgeSummaryView({ controller }) {
  const [open, setOpen] = (0, import_react.useState)(controller.getSnapshot().open);
  const [items, setItems] = (0, import_react.useState)([]);
  const [selectedId, setSelectedId] = (0, import_react.useState)();
  const [queryDraft, setQueryDraft] = (0, import_react.useState)("");
  const [query, setQuery] = (0, import_react.useState)("");
  const [systemCategory, setSystemCategory] = (0, import_react.useState)("");
  const [userCategory, setUserCategory] = (0, import_react.useState)(void 0);
  const [systemCounts, setSystemCounts] = (0, import_react.useState)({});
  const [userCounts, setUserCounts] = (0, import_react.useState)({});
  const [userCategories, setUserCategories] = (0, import_react.useState)([]);
  const [cursor, setCursor] = (0, import_react.useState)();
  const [cursorStack, setCursorStack] = (0, import_react.useState)([]);
  const [nextCursor, setNextCursor] = (0, import_react.useState)();
  const [hasMore, setHasMore] = (0, import_react.useState)(false);
  const [total, setTotal] = (0, import_react.useState)(0);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [mutating, setMutating] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [newCategory, setNewCategory] = (0, import_react.useState)("");
  const [documentView, setDocumentView] = (0, import_react.useState)("summary");
  const [renderMode, setRenderMode] = (0, import_react.useState)("preview");
  const [source, setSource] = (0, import_react.useState)("");
  const [sourceLoading, setSourceLoading] = (0, import_react.useState)(false);
  const [sourceTruncated, setSourceTruncated] = (0, import_react.useState)(false);
  const [inspectorOpen, setInspectorOpen] = (0, import_react.useState)(false);
  const [navigationOpen, setNavigationOpen] = (0, import_react.useState)(false);
  const [compactNavigation, setCompactNavigation] = (0, import_react.useState)(false);
  const [refreshRevision, setRefreshRevision] = (0, import_react.useState)(0);
  const workspaceRef = (0, import_react.useRef)(null);
  const titleRef = (0, import_react.useRef)(null);
  const navigationRef = (0, import_react.useRef)(null);
  const navigationToggleRef = (0, import_react.useRef)(null);
  const navigationCloseRef = (0, import_react.useRef)(null);
  const inspectorRef = (0, import_react.useRef)(null);
  const inspectorToggleRef = (0, import_react.useRef)(null);
  const inspectorCloseRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => controller.subscribe(() => setOpen(controller.getSnapshot().open)), [controller]);
  (0, import_react.useEffect)(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const observer = new ResizeObserver(() => setCompactNavigation(workspace.clientWidth <= 680));
    observer.observe(workspace);
    setCompactNavigation(workspace.clientWidth <= 680);
    return () => observer.disconnect();
  }, []);
  (0, import_react.useEffect)(() => {
    if (open) requestAnimationFrame(() => titleRef.current?.focus());
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (inspectorOpen) {
        event.preventDefault();
        setInspectorOpen(false);
        requestAnimationFrame(() => inspectorToggleRef.current?.focus());
        return;
      }
      if (navigationOpen) {
        event.preventDefault();
        setNavigationOpen(false);
        requestAnimationFrame(() => navigationToggleRef.current?.focus());
        return;
      }
      controller.close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [controller, inspectorOpen, navigationOpen, open]);
  (0, import_react.useEffect)(() => {
    if (navigationRef.current) navigationRef.current.inert = compactNavigation && !navigationOpen;
  }, [compactNavigation, navigationOpen]);
  (0, import_react.useEffect)(() => {
    if (inspectorRef.current) inspectorRef.current.inert = !inspectorOpen;
  }, [inspectorOpen]);
  (0, import_react.useEffect)(() => {
    if (navigationOpen) requestAnimationFrame(() => navigationCloseRef.current?.focus());
  }, [navigationOpen]);
  (0, import_react.useEffect)(() => {
    if (inspectorOpen) requestAnimationFrame(() => inspectorCloseRef.current?.focus());
  }, [inspectorOpen]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "30" });
    if (cursor) params.set("cursor", cursor);
    if (query) params.set("query", query);
    if (systemCategory) params.set("systemCategory", systemCategory);
    if (userCategory !== void 0) params.set("userCategory", userCategory);
    fetch(`${KNOWLEDGE_ENDPOINT}/summaries?${params}`, { cache: "no-store", signal: abort.signal }).then(async (response) => ({ response, payload: await response.json() })).then(({ response, payload }) => {
      if (!response.ok || !payload.ok) throw new Error(payload.message || "\u6458\u8981\u8BFB\u53D6\u5931\u8D25");
      const nextItems = payload.items ?? [];
      setItems(nextItems);
      setTotal(payload.total ?? 0);
      setNextCursor(payload.nextCursor);
      setHasMore(Boolean(payload.hasMore));
      setSystemCounts(payload.systemCategoryCounts ?? {});
      setUserCounts(payload.userCategoryCounts ?? {});
      setUserCategories(payload.userCategories ?? []);
      setSelectedId((current) => current && nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id);
    }).catch((value) => {
      if (value.name !== "AbortError") setError(value instanceof Error ? value.message : "\u6458\u8981\u8BFB\u53D6\u5931\u8D25");
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, [open, cursor, query, systemCategory, userCategory, refreshRevision]);
  const selected = (0, import_react.useMemo)(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  (0, import_react.useEffect)(() => {
    if (!selected || !open || documentView !== "source") {
      setSource("");
      setSourceLoading(false);
      setSourceTruncated(false);
      return;
    }
    const abort = new AbortController();
    setSource("");
    setSourceLoading(true);
    setSourceTruncated(false);
    fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(selected.id)}/content`, { cache: "no-store", signal: abort.signal }).then(async (response) => ({ response, payload: await response.json() })).then(({ response, payload }) => {
      if (!response.ok || !payload.ok) throw new Error(payload.message || "\u539F\u59CB\u5185\u5BB9\u8BFB\u53D6\u5931\u8D25");
      setSource(payload.content || "");
      setSourceTruncated(Boolean(payload.truncated));
    }).catch((value) => {
      if (value.name !== "AbortError") setSource(`> \u539F\u59CB\u5185\u5BB9\u8BFB\u53D6\u5931\u8D25\uFF1A${value instanceof Error ? value.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }).finally(() => {
      if (!abort.signal.aborted) setSourceLoading(false);
    });
    return () => abort.abort();
  }, [documentView, open, selected?.id]);
  const resetPage = () => {
    setCursor(void 0);
    setCursorStack([]);
  };
  const createCategory = async () => {
    if (!newCategory.trim() || mutating) return;
    setMutating(true);
    setError("");
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/categories`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: newCategory.trim() }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "\u5206\u7C7B\u521B\u5EFA\u5931\u8D25");
      setUserCategories(payload.categories ?? []);
      setNewCategory("");
    } catch (value) {
      setError(value instanceof Error ? value.message : "\u5206\u7C7B\u521B\u5EFA\u5931\u8D25");
    } finally {
      setMutating(false);
    }
  };
  const move = async (value) => {
    if (!selected || mutating) return;
    setMutating(true);
    setError("");
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(selected.id)}/metadata`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ userCategory: value }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.item) throw new Error(payload.message || "\u5206\u7C7B\u66F4\u65B0\u5931\u8D25");
      setItems((current) => current.map((item) => item.id === payload.item.id ? payload.item : item));
      setRefreshRevision((current) => current + 1);
    } catch (value2) {
      setError(value2 instanceof Error ? value2.message : "\u5206\u7C7B\u66F4\u65B0\u5931\u8D25");
    } finally {
      setMutating(false);
    }
  };
  const documentContent = documentView === "summary" ? selected?.summary || "## \u77E5\u8BC6\u70B9\u6458\u8981\n\n\u6682\u65E0\u6458\u8981\u3002" : source;
  const closeNavigation = () => {
    setNavigationOpen(false);
    requestAnimationFrame(() => navigationToggleRef.current?.focus());
  };
  const closeInspector = () => {
    setInspectorOpen(false);
    requestAnimationFrame(() => inspectorToggleRef.current?.focus());
  };
  const selectDocumentView = (value) => {
    setDocumentView(value);
    requestAnimationFrame(() => document.getElementById(`dsh-knowledge-${value}-tab`)?.focus());
  };
  const onDocumentTabKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    selectDocumentView(event.key === "ArrowLeft" || event.key === "Home" ? "summary" : "source");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref: workspaceRef, className: "dsh-knowledge-workspace", "data-inspector-open": inspectorOpen || void 0, "data-navigation-open": navigationOpen || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dsh-knowledge-workspace-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-workspace-brand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { ref: navigationToggleRef, className: "dsh-knowledge-navigation-toggle", type: "button", "aria-label": "\u6253\u5F00\u8D44\u6599\u5BFC\u822A", "aria-controls": "dsh-knowledge-navigation", "aria-expanded": navigationOpen, onClick: () => navigationOpen ? closeNavigation() : setNavigationOpen(true), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuIcon, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-knowledge-workspace-mark", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(BookIcon, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { ref: titleRef, tabIndex: -1, children: "\u77E5\u8BC6\u5E93" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            total,
            " \u4EFD\u8D44\u6599 \xB7 \u4FDD\u5B58\u5728\u672C\u673A"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-workspace-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { ref: inspectorToggleRef, className: "dsh-knowledge-action-button", type: "button", "data-active": inspectorOpen || void 0, "aria-controls": "dsh-knowledge-inspector", "aria-expanded": inspectorOpen, onClick: () => inspectorOpen ? closeInspector() : setInspectorOpen(true), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(InfoIcon, {}),
          "\u8D44\u6599\u4FE1\u606F"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsh-knowledge-summary-close", type: "button", onClick: () => controller.close(), "aria-label": "\u5173\u95ED\u77E5\u8BC6\u5E93\u9875\u9762", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CloseIcon, {}) })
      ] })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-summary-error", role: "alert", children: [
      error,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: "\u8BF7\u68C0\u67E5\u201C\u8BBE\u7F6E \u2192 \u77E5\u8BC6\u590D\u4E60\u201D\u4E2D\u7684\u672C\u5730\u8D44\u6599\u5E93\u8DEF\u5F84\uFF0C\u7136\u540E\u91CD\u8BD5\u3002" })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-workspace-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsh-knowledge-navigation-backdrop", type: "button", "aria-label": "\u5173\u95ED\u8D44\u6599\u5BFC\u822A", onClick: closeNavigation }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { ref: navigationRef, id: "dsh-knowledge-navigation", className: "dsh-knowledge-library-nav", "aria-label": "\u77E5\u8BC6\u5E93\u5BFC\u822A", "aria-hidden": compactNavigation && !navigationOpen || void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-nav-drawer-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u8D44\u6599\u5BFC\u822A" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { ref: navigationCloseRef, type: "button", "aria-label": "\u6536\u8D77\u8D44\u6599\u5BFC\u822A", onClick: closeNavigation, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CloseIcon, {}) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "dsh-knowledge-library-search", onSubmit: (event) => {
          event.preventDefault();
          resetPage();
          setQuery(queryDraft.trim());
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SearchIcon, {}),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Input, { "aria-label": "\u641C\u7D22\u8D44\u6599\u6807\u9898\u3001\u6765\u6E90\u6216\u6458\u8981", value: queryDraft, placeholder: "\u641C\u7D22\u77E5\u8BC6\u5E93", onChange: (event) => setQueryDraft(event.target.value) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "submit", hidden: true, children: "\u641C\u7D22" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-library-scroll", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u6D4F\u89C8" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FilterButton, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LibraryIcon, {}), active: !systemCategory, label: "\u5168\u90E8\u8D44\u6599", count: Object.values(systemCounts).reduce((sum, value) => sum + value, 0), onClick: () => {
              resetPage();
              setSystemCategory("");
              setNavigationOpen(false);
            } }),
            Object.entries(systemCounts).map(([name, count]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FilterButton, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TagIcon, {}), active: systemCategory === name, label: name, count, onClick: () => {
              resetPage();
              setSystemCategory(name);
            } }, name))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u6211\u7684\u5206\u7C7B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FilterButton, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FolderIcon, {}), active: userCategory === void 0, label: "\u5168\u90E8\u5206\u7C7B", count: Object.values(userCounts).reduce((sum, value) => sum + value, 0), onClick: () => {
              resetPage();
              setUserCategory(void 0);
            } }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FilterButton, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(InboxIcon, {}), active: userCategory === "", label: "\u672A\u5206\u7C7B", count: userCounts["\u672A\u5206\u7C7B"] ?? 0, onClick: () => {
              resetPage();
              setUserCategory("");
            } }),
            userCategories.map((name) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FilterButton, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FolderIcon, {}), active: userCategory === name, label: name, count: userCounts[name] ?? 0, onClick: () => {
              resetPage();
              setUserCategory(name);
            } }, name))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "dsh-knowledge-summary-create", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PlusIcon, {}),
              "\u65B0\u5EFA\u5206\u7C7B"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Input, { "aria-label": "\u65B0\u5EFA\u7528\u6237\u5206\u7C7B\u540D\u79F0", value: newCategory, placeholder: "\u5206\u7C7B\u540D\u79F0", disabled: mutating, onChange: (event) => setNewCategory(event.target.value) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "primary", disabled: !newCategory.trim() || mutating, onClick: () => void createCategory(), children: "\u521B\u5EFA" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dsh-knowledge-document-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-section-heading", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u8D44\u6599" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-live": "polite", children: loading ? "\u8BFB\u53D6\u4E2D" : `${total} \u4EFD` })
            ] }),
            items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "dsh-knowledge-document-row", "aria-current": selectedId === item.id ? "page" : void 0, "data-active": selectedId === item.id || void 0, onClick: () => {
              setSelectedId(item.id);
              setDocumentView("summary");
              setRenderMode("preview");
              setNavigationOpen(false);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-knowledge-document-kind", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DocumentIcon, {}) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: item.title }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: displaySource(item.source, item.systemCategory || "\u672C\u5730\u8D44\u6599") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronIcon, {})
            ] }, item.id)),
            !loading && !items.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-knowledge-summary-empty", children: "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u8D44\u6599" }) : null
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-nav-pagination", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: !cursorStack.length || loading, onClick: () => {
            const stack = [...cursorStack];
            setCursor(stack.pop());
            setCursorStack(stack);
          }, children: "\u4E0A\u4E00\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: !hasMore || !nextCursor || loading, onClick: () => {
            setCursorStack((stack) => [...stack, cursor]);
            setCursor(nextCursor);
          }, children: "\u4E0B\u4E00\u9875" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("main", { className: "dsh-knowledge-reader", "aria-busy": sourceLoading, children: selected ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-knowledge-reader-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-document", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-breadcrumb", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(BookIcon, {}),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u77E5\u8BC6\u5E93" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronIcon, {}),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: selected.systemCategory || "\u5F85\u5206\u7C7B" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: selected.title }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-meta", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SourceIcon, {}),
              displaySource(selected.source, "\u672A\u6807\u6CE8\u6765\u6E90")
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SparkleIcon, {}),
              selected.summarySource === "model" ? "DSH \u6A21\u578B\u6458\u8981" : "\u672C\u5730\u81EA\u52A8\u63D0\u8981"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ClockIcon, {}),
              formatRelativeTime(selected.updatedAt || selected.createdAt)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-controls", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-tabs", role: "tablist", "aria-label": "\u8D44\u6599\u9605\u8BFB\u5185\u5BB9", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { id: "dsh-knowledge-summary-tab", type: "button", role: "tab", "aria-controls": "dsh-knowledge-document-panel", "aria-selected": documentView === "summary", tabIndex: documentView === "summary" ? 0 : -1, onKeyDown: onDocumentTabKeyDown, onClick: () => setDocumentView("summary"), children: "\u6458\u8981" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { id: "dsh-knowledge-source-tab", type: "button", role: "tab", "aria-controls": "dsh-knowledge-document-panel", "aria-selected": documentView === "source", tabIndex: documentView === "source" ? 0 : -1, onKeyDown: onDocumentTabKeyDown, onClick: () => setDocumentView("source"), children: "\u539F\u59CB\u5185\u5BB9" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-render-toggle", "aria-label": "\u663E\u793A\u6A21\u5F0F", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "aria-pressed": renderMode === "preview", onClick: () => setRenderMode("preview"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PreviewIcon, {}),
              "\u6E32\u67D3"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "aria-pressed": renderMode === "markdown", onClick: () => setRenderMode("markdown"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CodeIcon, {}),
              "Markdown \u6E90\u7801"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-knowledge-reader-status", "aria-live": "polite", children: documentView === "source" && sourceLoading ? "\u6B63\u5728\u6309\u9700\u8BFB\u53D6\u539F\u59CB\u5185\u5BB9\u2026" : sourceTruncated && documentView === "source" ? "\u539F\u59CB\u5185\u5BB9\u8F83\u957F\uFF0C\u5F53\u524D\u663E\u793A\u622A\u65AD\u9884\u89C8" : documentView === "source" ? `${selected.contentLength.toLocaleString("zh-CN")} \u5B57\u7B26` : null }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("article", { id: "dsh-knowledge-document-panel", className: "dsh-knowledge-reader-canvas", role: "tabpanel", "aria-labelledby": `dsh-knowledge-${documentView}-tab`, tabIndex: 0, children: sourceLoading && documentView === "source" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-knowledge-summary-empty", children: "\u6B63\u5728\u8BFB\u53D6\u539F\u59CB\u5185\u5BB9\u2026" }) : renderMode === "preview" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MarkdownText, { content: documentContent }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { className: "dsh-knowledge-markdown-source", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: documentContent }) }) })
      ] }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-reader-welcome", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-knowledge-workspace-mark", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(BookIcon, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u9009\u62E9\u4E00\u4EFD\u8D44\u6599\u5F00\u59CB\u9605\u8BFB" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u6458\u8981\u548C\u539F\u59CB\u5185\u5BB9\u90FD\u652F\u6301\u5B89\u5168 Markdown \u9884\u89C8\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsh-knowledge-inspector-backdrop", type: "button", "aria-label": "\u5173\u95ED\u8D44\u6599\u4FE1\u606F", onClick: closeInspector }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("aside", { ref: inspectorRef, id: "dsh-knowledge-inspector", className: "dsh-knowledge-inspector", "aria-label": "\u8D44\u6599\u4FE1\u606F", "aria-hidden": !inspectorOpen || void 0, children: selected ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-inspector-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u8D44\u6599\u4FE1\u606F" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: "\u4EC5\u4FDD\u5B58\u5728\u63D2\u4EF6\u672C\u5730\u5E93" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { ref: inspectorCloseRef, type: "button", "aria-label": "\u5173\u95ED\u8D44\u6599\u4FE1\u606F", onClick: closeInspector, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CloseIcon, {}) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-inspector-content", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dsh-knowledge-inspector-category", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u6211\u7684\u5206\u7C7B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { value: selected.userCategory ?? "", disabled: mutating, onChange: (event) => void move(event.target.value || null), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\u672A\u5206\u7C7B" }),
              userCategories.map((name) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: name, children: name }, name))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-property-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u6587\u6863" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SourceIcon, {}), label: "\u6765\u6E90", value: displaySource(selected.source, "\u672A\u6807\u6CE8") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TagIcon, {}), label: "\u7CFB\u7EDF\u5206\u7C7B", value: selected.systemCategory || "\u5F85\u5206\u7C7B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SparkleIcon, {}), label: "\u6458\u8981\u6765\u6E90", value: selected.summarySource === "model" ? "\u5F53\u524D DSH \u6A21\u578B" : "\u672C\u5730\u81EA\u52A8\u63D0\u8981" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DocumentIcon, {}), label: "\u5B57\u7B26\u6570", value: selected.contentLength.toLocaleString("zh-CN") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-property-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u65F6\u95F4" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ClockIcon, {}), label: "\u521B\u5EFA\u65F6\u95F4", value: formatTime(selected.createdAt) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ClockIcon, {}), label: "\u66F4\u65B0\u65F6\u95F4", value: formatTime(selected.updatedAt || selected.createdAt) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-property-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u6807\u8BC6" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Property, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(HashIcon, {}), label: "\u8D44\u6599 ID", value: selected.id, mono: true })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-inspector-note", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LockIcon, {}),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u516C\u5F00\u63D2\u4EF6\u4E0D\u4F1A\u8FDE\u63A5\u4EFB\u4F55\u5916\u90E8\u9879\u76EE\u3002\u9879\u76EE\u4FA7\u5982\u9700\u4F7F\u7528\u8D44\u6599\uFF0C\u5E94\u4E3B\u52A8\u540C\u6B65\u3002" })
          ] })
        ] })
      ] }) : null })
    ] })
  ] });
}
function FilterButton(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { "aria-pressed": props.active, "data-active": props.active || void 0, onClick: props.onClick, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsh-knowledge-filter-label", children: [
      props.icon,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: props.label })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: props.count })
  ] });
}
function Property(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-knowledge-property", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-knowledge-property-icon", children: props.icon }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-knowledge-property-label", children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: props.mono ? "is-mono" : void 0, title: props.value, children: props.value })
  ] });
}
function displaySource(source, fallback) {
  return source?.startsWith("current-project:material:") ? "\u5F53\u524D\u9879\u76EE\u5BFC\u5165\u8D44\u6599" : source || fallback;
}
function formatTime(value) {
  try {
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
function formatRelativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return formatTime(value);
  const days = Math.floor((Date.now() - time) / 864e5);
  if (days <= 0) return "\u4ECA\u5929\u66F4\u65B0";
  if (days === 1) return "\u6628\u5929\u66F4\u65B0";
  if (days < 30) return `${days} \u5929\u524D\u66F4\u65B0`;
  return formatTime(value);
}
var icon = (children) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children });
function BookIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ] }));
}
function MenuIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 6h16M4 12h16M4 18h16" }) }));
}
function CloseIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m6 6 12 12M18 6 6 18" }) }));
}
function SearchIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "11", r: "7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m20 20-3.5-3.5" })
  ] }));
}
function InfoIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 11v5M12 8h.01" })
  ] }));
}
function LibraryIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 7h6" })
  ] }));
}
function FolderIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }) }));
}
function InboxIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 4h16v16H4z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 14h4l2 3h4l2-3h4" })
  ] }));
}
function TagIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M20 13 13 20l-9-9V4h7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8.5 8.5h.01" })
  ] }));
}
function PlusIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 5v14M5 12h14" }) }));
}
function DocumentIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6 2h8l4 4v16H6z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M14 2v5h5M9 13h6M9 17h5" })
  ] }));
}
function ChevronIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m9 18 6-6-6-6" }) }));
}
function SourceIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" })
  ] }));
}
function SparkleIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8zM19 13l-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8z" })
  ] }));
}
function ClockIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 7v5l3 2" })
  ] }));
}
function PreviewIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "2.5" })
  ] }));
}
function CodeIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" }) }));
}
function HashIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 3 8 21M16 3l-2 18M4 9h16M3 15h16" }) }));
}
function LockIcon() {
  return icon(/* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "5", y: "10", width: "14", height: "10", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })
  ] }));
}

// src/client/summary-mount.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var ACTIVE_ATTRIBUTE = "data-dsh-knowledge-summary-active";
var SummaryController = class {
  openValue = false;
  listeners = /* @__PURE__ */ new Set();
  getSnapshot() {
    return { open: this.openValue };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  open() {
    this.setOpen(true);
  }
  close() {
    this.setOpen(false);
  }
  toggle() {
    this.setOpen(!this.openValue);
  }
  setOpen(value) {
    if (this.openValue === value) return;
    this.openValue = value;
    if (value) {
      document.documentElement.setAttribute(ACTIVE_ATTRIBUTE, "");
      document.dispatchEvent(new CustomEvent("dsh-panel-activate", { detail: "knowledge-summary" }));
    } else document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE);
    this.listeners.forEach((listener) => listener());
  }
};
function mountSummarySidebar(controller) {
  const entry = document.createElement("button");
  entry.type = "button";
  entry.dataset.dshKnowledgeSummaryEntry = "";
  entry.className = "dsh-knowledge-summary-entry";
  entry.title = "\u77E5\u8BC6\u5E93";
  entry.setAttribute("aria-label", "\u6253\u5F00\u77E5\u8BC6\u5E93\u9875\u9762");
  entry.innerHTML = '<span class="dsh-knowledge-summary-entry-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 13.2A1.7 1.7 0 0 1 4.7 11.5H13"/><path d="M4.7 2H13v12H4.7A1.7 1.7 0 0 1 3 12.3V3.7A1.7 1.7 0 0 1 4.7 2Z"/><path d="M6 5h5M6 7.8h4"/></svg></span><span class="dsh-knowledge-summary-entry-label">\u77E5\u8BC6\u5E93</span>';
  entry.addEventListener("click", () => {
    if (!controller.getSnapshot().open) {
      document.querySelectorAll("[data-dsh-taskboard-entry][data-active], [data-dsh-ssh-entry][data-active]").forEach((panelEntry) => panelEntry.click());
    }
    controller.toggle();
  });
  const sync = () => {
    if (controller.getSnapshot().open) entry.dataset.active = "true";
    else delete entry.dataset.active;
  };
  const unsubscribe = controller.subscribe(sync);
  sync();
  let root;
  const place = () => {
    const column = document.querySelector('[data-pane="sidebar"], [class*="sidebarCol"]');
    root = column?.querySelector('[class*="logoRow"]')?.parentElement ?? column?.firstElementChild;
    if (!root) return;
    const workspace = Array.from(root.children).find((element) => element instanceof HTMLElement && element.querySelector('[class*="sectionHeader"] [class*="sectionLabel"]')?.textContent?.trim() === "\u5DE5\u4F5C\u533A");
    const family = Array.from(root.children).filter((element) => element instanceof HTMLElement && element.matches("[data-dsh-taskboard-entry], [data-dsh-ssh-entry], [data-dsh-knowledge-summary-entry]"));
    const fallback = family.filter((element) => element !== entry).at(-1)?.nextSibling ?? root.querySelector('button[class*="newSession"]')?.nextSibling;
    const anchor = workspace ?? fallback ?? null;
    if (entry.parentElement !== root || entry.nextSibling !== anchor) root.insertBefore(entry, anchor);
  };
  const observer = new MutationObserver(place);
  observer.observe(document.body, { childList: true, subtree: true });
  place();
  const other = (event) => {
    if (event.detail !== "knowledge-summary") controller.close();
  };
  const leaveOnExternalPointer = (event) => {
    if (!controller.getSnapshot().open || !(event.target instanceof Node) || entry.contains(event.target)) return;
    const view = document.querySelector("[data-dsh-knowledge-summary-view]");
    if (!view?.contains(event.target)) controller.close();
  };
  document.addEventListener("dsh-panel-activate", other);
  document.addEventListener("pointerdown", leaveOnExternalPointer, true);
  return () => {
    observer.disconnect();
    unsubscribe();
    document.removeEventListener("dsh-panel-activate", other);
    document.removeEventListener("pointerdown", leaveOnExternalPointer, true);
    entry.remove();
    controller.close();
  };
}
function mountSummaryView(controller) {
  let reactRoot;
  let container;
  const ensure = () => {
    if (container?.isConnected) return;
    reactRoot?.unmount();
    container?.remove();
    reactRoot = void 0;
    container = void 0;
    const center = document.querySelector('[data-pane="conversation"], [class*="centerCol"]');
    if (!center) return;
    container = document.createElement("div");
    container.dataset.dshKnowledgeSummaryView = "";
    center.appendChild(container);
    reactRoot = (0, import_client.createRoot)(container);
    reactRoot.render(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(KnowledgeSummaryView, { controller }));
  };
  const observer = new MutationObserver(ensure);
  observer.observe(document.body, { childList: true, subtree: true });
  ensure();
  return () => {
    observer.disconnect();
    reactRoot?.unmount();
    container?.remove();
    document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE);
  };
}

// src/client/index.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var inject = ["slots", "connection"];
function apply(ctx) {
  ctx.effect(() => installKnowledgeReviewVisuals(), "project-knowledge-review: visuals");
  ctx.effect(() => {
    const controller = new SummaryController();
    const disposers = [mountSummarySidebar(controller), mountSummaryView(controller)];
    return () => disposers.reverse().forEach((dispose) => dispose());
  }, "project-knowledge-review: summary workspace");
  const connection = ctx.get("connection");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "knowledge-review",
    order: 35,
    label: () => "\u77E5\u8BC6\u590D\u4E60",
    inject: () => ({ api: connection.api })
  }, KnowledgeReviewSettings));
}
function installKnowledgeReviewVisuals() {
  if (typeof document === "undefined" || document.getElementById("dsh-project-knowledge-review-visuals")) return () => void 0;
  const style = document.createElement("style");
  style.id = "dsh-project-knowledge-review-visuals";
  style.textContent = `
    /* Lucide BookOpenCheck\uFF08ISC\uFF09\uFF1A\u7528\u4E66\u672C\u4E0E\u52FE\u9009\u8868\u8FBE\u201C\u77E5\u8BC6\u590D\u4E60\u201D\u3002 */
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

    /* 0.5.1 \u6587\u6863\u4F18\u5148\u89C6\u89C9\u5C42\uFF1A\u501F\u9274\u6210\u719F\u77E5\u8BC6\u4EA7\u54C1\u7684\u4FE1\u606F\u5C42\u7EA7\uFF0C\u4FDD\u7559 DSH \u539F\u751F\u4E3B\u9898\u3002 */
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
    /* \u7B2C\u4E8C\u8F6E\u964D\u566A\uFF1A\u9605\u8BFB\u753B\u5E03\u9694\u79BB\u76AE\u80A4\u6C34\u5370\uFF0C\u7B5B\u9009\u4E0E\u663E\u793A\u6A21\u5F0F\u9000\u5C45\u6B21\u7EA7\u3002 */
    .dsh-knowledge-reader,.dsh-knowledge-reader-scroll,.dsh-knowledge-reader-document{background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-base))}
    .dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active]{background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 9%,transparent);color:var(--dsw-alias-label-primary);font-weight:620}.dsh-knowledge-library-scroll section>button:not(.dsh-knowledge-document-row)[data-active] .dsh-knowledge-filter-label>svg{color:var(--dsw-alias-label-secondary)}
    .dsh-knowledge-document-row{border:0}.dsh-knowledge-document-row[data-active]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-base))}.dsh-knowledge-document-row[data-active]::before{top:12px;bottom:12px}
    .dsh-knowledge-reader-head h1{margin-top:26px}.dsh-knowledge-reader-meta{margin-top:14px}
    .dsh-knowledge-reader-tabs{padding:0;border-radius:0;background:transparent;gap:20px}.dsh-knowledge-reader-tabs button{position:relative;padding:0 1px;border-radius:0;background:transparent!important;box-shadow:none!important;font-size:11px}.dsh-knowledge-reader-tabs button[aria-selected=true]{color:var(--dsw-alias-label-primary);font-weight:680}.dsh-knowledge-reader-tabs button[aria-selected=true]::after{content:'';position:absolute;left:0;right:0;bottom:-11px;height:2px;border-radius:3px;background:var(--dsw-alias-brand-primary)}
    .dsh-knowledge-render-toggle{gap:2px;padding:0;background:transparent}.dsh-knowledge-render-toggle button{min-height:27px;padding:0 7px;color:var(--dsw-alias-label-tertiary)}.dsh-knowledge-render-toggle button[aria-pressed=true]{background:transparent;box-shadow:none;color:var(--dsw-alias-label-primary);font-weight:650}.dsh-knowledge-render-toggle button:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 8%,transparent)}
    .dsh-knowledge-reader-status:empty{display:none}.dsh-knowledge-reader-status:not(:empty){margin-top:22px}.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown{margin-top:24px}.dsh-knowledge-reader-status:not(:empty)+.dsh-knowledge-reader-canvas>.dsh-knowledge-markdown{margin-top:8px}.dsh-knowledge-markdown h2:first-child,.dsh-knowledge-markdown h3:first-child{margin-top:0}.dsh-knowledge-markdown ul,.dsh-knowledge-markdown ol{padding-left:1.25em}.dsh-knowledge-markdown li{margin:6px 0;padding-left:2px}.dsh-knowledge-markdown li::marker{color:color-mix(in srgb,var(--dsw-alias-brand-primary) 75%,var(--dsw-alias-label-secondary))}
    /* \u7B2C\u4E09\u8F6E\u53D1\u5E03\u95E8\u7981\uFF1A\u6DF1\u8272\u9605\u8BFB\u5BF9\u6BD4\u3001\u5C42\u6B21\u4E0E\u975E\u963B\u65AD\u5F0F\u8D44\u6599\u62BD\u5C49\u3002 */
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
  `;
  document.head.appendChild(style);
  const markNavigation = () => {
    for (const label of Array.from(document.querySelectorAll('[class*="navLabel"]'))) {
      if (label.textContent?.trim() !== "\u77E5\u8BC6\u590D\u4E60" || label.parentElement?.querySelector(".dsh-project-knowledge-review-icon")) continue;
      label.parentElement?.insertBefore(bookOpenCheckIcon(), label);
    }
  };
  markNavigation();
  const observer = new MutationObserver(markNavigation);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    style.remove();
    document.querySelectorAll(".dsh-project-knowledge-review-icon").forEach((icon2) => icon2.remove());
  };
}
function bookOpenCheckIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "dsh-project-knowledge-review-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5a2.5 2.5 0 0 1 2.5 2.5z"/><path d="m15.5 14 2 2 4-4"/>';
  return svg;
}
function KnowledgeReviewSettings({ api }) {
  const [settings, setSettings] = (0, import_react2.useState)();
  const [revision, setRevision] = (0, import_react2.useState)();
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [notice, setNotice] = (0, import_react2.useState)("");
  const [ocrKey, setOcrKey] = (0, import_react2.useState)("");
  const [asrKey, setAsrKey] = (0, import_react2.useState)("");
  const [credentials, setCredentials] = (0, import_react2.useState)({});
  const load = async () => {
    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), 1e4);
    try {
      const response = await fetch(SETTINGS_ENDPOINT, { cache: "no-store", signal: abort.signal });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || "\u8BBE\u7F6E\u8BFB\u53D6\u5931\u8D25");
      setSettings(payload.value);
      setRevision(payload.revision);
      await loadCredentials(payload.value);
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === "AbortError" ? "\u8BBE\u7F6E\u8BFB\u53D6\u8D85\u65F6\u3002\u63D2\u4EF6\u5347\u7EA7\u540E\u8BF7\u5237\u65B0 DSH \u9875\u9762\uFF1B\u82E5\u4ECD\u672A\u6062\u590D\uFF0C\u518D\u91CD\u542F\u5F53\u524D DSH Web \u8FDB\u7A0B\u3002" : messageOf(error));
    } finally {
      window.clearTimeout(timeout);
    }
  };
  const loadCredentials = async (value) => {
    if (!api) return;
    const refs = [...new Set([value.ocrApiKeyEnv, value.asrApiKeyEnv].filter(Boolean))];
    const response = await api.credentials.describe({ refs });
    if (!response.result.ok) throw new Error(response.result.error.message);
    setCredentials(response.result.value.credentials);
  };
  (0, import_react2.useEffect)(() => {
    void load();
  }, []);
  const saveField = async (field, value) => {
    if (!settings) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(SETTINGS_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ field, value, expectedRevision: revision })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25");
      setSettings(payload.value);
      setRevision(payload.revision);
      setNotice("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u4E00\u6B21\u5DE5\u5177\u8C03\u7528\u7ACB\u5373\u751F\u6548\u3002");
    } catch (error) {
      setNotice(messageOf(error));
      await load();
    } finally {
      setBusy(false);
    }
  };
  const updateDraft = (field, value) => {
    setSettings((current) => current ? { ...current, [field]: value } : current);
  };
  const saveCredential = async (kind) => {
    if (!api || !settings) return false;
    const ref = kind === "ocr" ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv;
    const value = (kind === "ocr" ? ocrKey : asrKey).trim();
    if (!value) {
      setNotice("\u8BF7\u8F93\u5165 API Key\uFF1B\u5DF2\u4FDD\u5B58\u7684 Key \u4E0D\u4F1A\u56DE\u663E\u3002");
      return false;
    }
    setBusy(true);
    try {
      const response = await api.credentials.set({ ref, value });
      if (!response.result.ok) throw new Error(response.result.error.message);
      kind === "ocr" ? setOcrKey("") : setAsrKey("");
      await loadCredentials(settings);
      setNotice(`${kind.toUpperCase()} API Key \u5DF2\u5B89\u5168\u4FDD\u5B58\u5230 DSH \u51ED\u636E\u5E93\u3002`);
      return true;
    } catch (error) {
      setNotice(messageOf(error));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const clearCredential = async (kind) => {
    if (!api || !settings) return;
    const ref = kind === "ocr" ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv;
    setBusy(true);
    try {
      const response = await api.credentials.unset({ ref });
      if (!response.result.ok) throw new Error(response.result.error.message);
      await loadCredentials(settings);
      setNotice(`${kind.toUpperCase()} API Key \u5DF2\u5220\u9664\u3002`);
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };
  if (!settings) return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { style: styles.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { style: styles.title, children: "\u77E5\u8BC6\u590D\u4E60" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: notice || "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { style: styles.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { style: styles.title, children: "\u77E5\u8BC6\u590D\u4E60" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: styles.intro, children: "\u7BA1\u7406\u63D2\u4EF6\u81EA\u5DF1\u7684\u672C\u5730\u77E5\u8BC6\u5E93\u3001\u77E5\u8BC6\u70B9\u6458\u8981\u548C\u5206\u7C7B\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 OCR\u3001ASR\u3002\u516C\u5F00\u63D2\u4EF6\u4E0D\u4F1A\u8FDE\u63A5\u6216\u5B89\u88C5\u4EFB\u4F55\u5916\u90E8\u9879\u76EE\u3002" })
    ] }),
    notice && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.notice, children: notice }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Card, { title: "\u57FA\u7840\u670D\u52A1", description: "\u5173\u95ED\u540E\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4FDD\u6301\u9759\u9ED8\uFF0C\u6240\u6709\u77E5\u8BC6\u590D\u4E60\u5DE5\u5177\u90FD\u4F1A\u62D2\u7EDD\u6267\u884C\u3002", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Toggle, { label: "\u5F00\u542F\u77E5\u8BC6\u590D\u4E60\u670D\u52A1", checked: settings.enabled, disabled: busy, onChange: (value) => void saveField("enabled", value) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u56DE\u7B54\u7B56\u7565", help: "\u4E25\u683C\u77E5\u8BC6\u5E93\u53EA\u5141\u8BB8 evidence \u7ED3\u8BBA\uFF1B\u77E5\u8BC6\u5E93\u4EC5\u4F9B\u53C2\u8003\u5141\u8BB8\u6A21\u578B\u8865\u5145\uFF0C\u4F46\u4F1A\u660E\u786E\u6807\u6CE8\u6765\u6E90\u8FB9\u754C\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PolicySelect, { value: settings.answerPolicy, disabled: busy, onChange: (value) => void saveField("answerPolicy", value) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TextField, { label: "\u77E5\u8BC6\u5E93\u540D\u79F0", value: settings.projectName, disabled: busy, onChange: (value) => updateDraft("projectName", value), onSave: () => void saveField("projectName", settings.projectName) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TextField, { label: "\u672C\u5730\u8D44\u6599\u5E93\u8DEF\u5F84", value: settings.localStorePath, disabled: busy, onChange: (value) => updateDraft("localStorePath", value), onSave: () => void saveField("localStorePath", settings.localStorePath) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(KnowledgeBrowser, {}),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Card, { title: "\u672C\u5730\u670D\u52A1\u8BBE\u7F6E", description: "\u8BF7\u6C42\u8D85\u65F6\u4EC5\u7528\u4E8E\u53EF\u9009 OCR \u4E0E ASR\uFF1B\u672C\u5730\u6587\u672C\u5165\u5E93\u548C\u68C0\u7D22\u4E0D\u8BBF\u95EE\u7F51\u7EDC\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(NumberField, { label: "\u8BF7\u6C42\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09", value: settings.requestTimeoutMs, disabled: busy, onChange: (value) => updateDraft("requestTimeoutMs", value), onSave: () => void saveField("requestTimeoutMs", settings.requestTimeoutMs) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      ServiceCard,
      {
        title: "OCR \u56FE\u7247\u8BC6\u522B",
        enabled: settings.ocrEnabled,
        disabled: busy,
        onToggle: (value) => void saveField("ocrEnabled", value),
        baseUrl: settings.ocrBaseUrl,
        model: settings.ocrModel,
        keyRef: settings.ocrApiKeyEnv,
        keyDraft: ocrKey,
        credential: credentials[settings.ocrApiKeyEnv],
        onBaseUrl: (value) => updateDraft("ocrBaseUrl", value),
        onModel: (value) => updateDraft("ocrModel", value),
        onKeyRef: (value) => updateDraft("ocrApiKeyEnv", value),
        onKeyDraft: setOcrKey,
        onSaveBase: () => void saveField("ocrBaseUrl", settings.ocrBaseUrl),
        onSaveModel: () => void saveField("ocrModel", settings.ocrModel),
        onSaveKeyRef: () => void saveField("ocrApiKeyEnv", settings.ocrApiKeyEnv),
        onSaveKey: () => void saveCredential("ocr"),
        onClearKey: () => void clearCredential("ocr")
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      ServiceCard,
      {
        title: "ASR \u97F3\u9891\u8F6C\u5199",
        enabled: settings.asrEnabled,
        disabled: busy,
        onToggle: (value) => void saveField("asrEnabled", value),
        baseUrl: settings.asrBaseUrl,
        model: settings.asrModel,
        keyRef: settings.asrApiKeyEnv,
        keyDraft: asrKey,
        credential: credentials[settings.asrApiKeyEnv],
        onBaseUrl: (value) => updateDraft("asrBaseUrl", value),
        onModel: (value) => updateDraft("asrModel", value),
        onKeyRef: (value) => updateDraft("asrApiKeyEnv", value),
        onKeyDraft: setAsrKey,
        onSaveBase: () => void saveField("asrBaseUrl", settings.asrBaseUrl),
        onSaveModel: () => void saveField("asrModel", settings.asrModel),
        onSaveKeyRef: () => void saveField("asrApiKeyEnv", settings.asrApiKeyEnv),
        onSaveKey: () => void saveCredential("asr"),
        onClearKey: () => void clearCredential("asr")
      }
    )
  ] });
}
function Card(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { style: styles.cardTitle, children: props.title }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: styles.help, children: props.description }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.stack, children: props.children })
  ] });
}
function Field(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { style: styles.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: styles.label, children: props.label }),
    props.children,
    props.help && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: styles.help, children: props.help })
  ] });
}
function PolicySelect(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.policyGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", style: { ...styles.policyOption, ...props.value === "strict" ? styles.policyOptionActive : {} }, disabled: props.disabled, onClick: () => props.onChange("strict"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "\u4E25\u683C\u77E5\u8BC6\u5E93" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: styles.policyDescription, children: "\u4EC5\u6839\u636E\u5DF2\u6709 evidence \u56DE\u7B54\uFF1B\u65E0\u8BC1\u636E\u65F6\u62D2\u7B54" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", style: { ...styles.policyOption, ...props.value === "reference" ? styles.policyOptionActive : {} }, disabled: props.disabled, onClick: () => props.onChange("reference"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "\u77E5\u8BC6\u5E93\u4EC5\u4F9B\u53C2\u8003" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: styles.policyDescription, children: "\u77E5\u8BC6\u5E93\u4F18\u5148\uFF0C\u5141\u8BB8\u660E\u786E\u6807\u6CE8\u7684\u6A21\u578B\u8865\u5145" })
    ] })
  ] });
}
function KnowledgeBrowser() {
  const [open, setOpen] = (0, import_react2.useState)(false);
  const [overview, setOverview] = (0, import_react2.useState)();
  const [items, setItems] = (0, import_react2.useState)([]);
  const [queryDraft, setQueryDraft] = (0, import_react2.useState)("");
  const [query, setQuery] = (0, import_react2.useState)("");
  const [cursor, setCursor] = (0, import_react2.useState)();
  const [cursorStack, setCursorStack] = (0, import_react2.useState)([]);
  const [nextCursor, setNextCursor] = (0, import_react2.useState)();
  const [hasMore, setHasMore] = (0, import_react2.useState)(false);
  const [total, setTotal] = (0, import_react2.useState)(0);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const [expandedId, setExpandedId] = (0, import_react2.useState)();
  const [content, setContent] = (0, import_react2.useState)("");
  const [contentLoading, setContentLoading] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setExpandedId(void 0);
    setContent("");
    const params = new URLSearchParams({ limit: "30" });
    if (cursor) params.set("cursor", cursor);
    if (query) params.set("query", query);
    Promise.all([
      fetch(`${KNOWLEDGE_ENDPOINT}/overview`, { cache: "no-store", signal: controller.signal }).then((response) => response.json()),
      fetch(`${KNOWLEDGE_ENDPOINT}/materials?${params}`, { cache: "no-store", signal: controller.signal }).then((response) => response.json())
    ]).then(([overviewValue, page]) => {
      if (!overviewValue.ok) throw new Error(overviewValue.message || "\u6982\u89C8\u8BFB\u53D6\u5931\u8D25");
      if (!page.ok) throw new Error(page.message || "\u8D44\u6599\u5217\u8868\u8BFB\u53D6\u5931\u8D25");
      setOverview(overviewValue);
      setItems(page.items ?? []);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setTotal(page.total);
    }).catch((value) => {
      if (value.name !== "AbortError") setError(messageOf(value));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [open, cursor, query]);
  const showContent = async (item) => {
    const id = String(item.id);
    if (expandedId === id) {
      setExpandedId(void 0);
      setContent("");
      return;
    }
    setExpandedId(id);
    setContent("");
    setContentLoading(true);
    try {
      const response = await fetch(`${KNOWLEDGE_ENDPOINT}/materials/${encodeURIComponent(id)}/content`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "\u539F\u6587\u8BFB\u53D6\u5931\u8D25");
      setContent(`${payload.content || "\uFF08\u8D44\u6599\u539F\u6587\u4E3A\u7A7A\uFF09"}${payload.truncated ? `

\u2014\u2014 \u9884\u89C8\u5DF2\u9650\u5236\u4E3A 200,000 \u5B57\u7B26\uFF1B\u539F\u6587\u5171 ${payload.contentLength ?? "\u66F4\u591A"} \u5B57\u7B26\u3002` : ""}`);
    } catch (value) {
      setContent(`\u8BFB\u53D6\u5931\u8D25\uFF1A${messageOf(value)}`);
    } finally {
      setContentLoading(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.browserCard, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", style: styles.browserHeader, "aria-expanded": open, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "\u77E5\u8BC6\u5E93\u5185\u5BB9" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { style: styles.browserSubtitle, children: "\u5206\u9875\u67E5\u770B\u6807\u9898\u3001\u6765\u6E90\u4E0E\u539F\u59CB\u5185\u5BB9" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: styles.browserHeaderMeta, children: [
        overview ? `${overview.documentCount ?? total} \u6761` : "",
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { style: { ...styles.browserChevron, transform: open ? "rotate(180deg)" : void 0 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m6 9 6 6 6-6" }) })
      ] })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.browserBody, children: [
      overview && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.overviewGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u5B58\u50A8\u6A21\u5F0F" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "\u63D2\u4EF6\u672C\u5730\u77E5\u8BC6\u5E93" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u8D44\u6599\u6570\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: overview.documentCount ?? total })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u4F5C\u7528\u57DF" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "DSH \u7528\u6237\u7EA7\u672C\u5730" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u5916\u90E8\u9879\u76EE\u4F9D\u8D56" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "\u65E0" })
        ] })
      ] }),
      overview?.storePath && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.storePath, children: [
        "\u5B58\u50A8\u4F4D\u7F6E\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("code", { children: overview.storePath })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("form", { style: styles.browserSearch, onSubmit: (event) => {
        event.preventDefault();
        setCursor(void 0);
        setCursorStack([]);
        setQuery(queryDraft.trim());
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Input, { value: queryDraft, placeholder: "\u6309\u6807\u9898\u6216\u6765\u6E90\u641C\u7D22", onChange: (event) => setQueryDraft(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { type: "submit", size: "sm", variant: "outline", children: "\u641C\u7D22" }),
        query && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { type: "button", size: "sm", variant: "ghost", onClick: () => {
          setQueryDraft("");
          setQuery("");
          setCursor(void 0);
          setCursorStack([]);
        }, children: "\u6E05\u9664" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.browserError, children: error }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.browserEmpty, children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u9875\u2026" }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.browserEmpty, children: "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u8D44\u6599" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: styles.materialList, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.materialRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", style: styles.materialButton, onClick: () => void showContent(item), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: styles.materialMain, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
              item.source || "\u672A\u6807\u6CE8\u6765\u6E90",
              " \xB7 ",
              item.documentType || `${item.contentLength ?? 0} \u5B57\u7B26`,
              " ",
              item.status ? `\xB7 ${item.status}` : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { style: { ...styles.itemChevron, transform: expandedId === String(item.id) ? "rotate(180deg)" : void 0 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m6 9 6 6 6-6" }) })
        ] }),
        expandedId === String(item.id) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("pre", { style: styles.contentPreview, children: contentLoading ? "\u6B63\u5728\u6309\u9700\u8BFB\u53D6\u539F\u6587\u2026" : content })
      ] }, String(item.id))) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.pagination, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          "\u5171 ",
          total,
          " \u6761 \xB7 \u5F53\u524D\u9875\u6700\u591A 30 \u6761"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: styles.paginationButtons, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "outline", disabled: !cursorStack.length || loading, onClick: () => {
            const stack = [...cursorStack];
            setCursor(stack.pop());
            setCursorStack(stack);
          }, children: "\u4E0A\u4E00\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "outline", disabled: !hasMore || !nextCursor || loading, onClick: () => {
            setCursorStack((stack) => [...stack, cursor]);
            setCursor(nextCursor);
          }, children: "\u4E0B\u4E00\u9875" })
        ] })
      ] })
    ] })
  ] });
}
function TextField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: props.label, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Input, { value: props.value, disabled: props.disabled, onChange: (event) => props.onChange(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "outline", disabled: props.disabled, onClick: props.onSave, children: "\u4FDD\u5B58" })
  ] }) });
}
function NumberField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: props.label, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Input, { type: "number", value: props.value, disabled: props.disabled, onChange: (event) => props.onChange(Number(event.target.value)) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "outline", disabled: props.disabled, onClick: props.onSave, children: "\u4FDD\u5B58" })
  ] }) });
}
function Toggle(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { style: styles.toggle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "checkbox", checked: props.checked, disabled: props.disabled, onChange: (event) => props.onChange(event.target.checked) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: props.label })
  ] });
}
function ServiceCard(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Card, { title: props.title, description: "\u652F\u6301 OpenAI \u517C\u5BB9\u63A5\u53E3\u3002Base URL \u4E0D\u542B\u5177\u4F53\u65B9\u6CD5\u8DEF\u5F84\uFF1BKey \u4FDD\u5B58\u540E\u4E0D\u4F1A\u56DE\u663E\u3002", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Toggle, { label: `\u5F00\u542F${props.title}`, checked: props.enabled, disabled: props.disabled, onChange: props.onToggle }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TextField, { label: "Base URL", value: props.baseUrl, disabled: props.disabled, onChange: props.onBaseUrl, onSave: props.onSaveBase }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TextField, { label: "\u6A21\u578B\u540D\u79F0", value: props.model, disabled: props.disabled, onChange: props.onModel, onSave: props.onSaveModel }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TextField, { label: "\u51ED\u636E\u5F15\u7528\u540D", value: props.keyRef, disabled: props.disabled, onChange: props.onKeyRef, onSave: props.onSaveKeyRef }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Field, { label: "API Key", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.credentialStatus, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.StateDot, { state: props.credential?.configured ? "done" : "warning" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: props.credential?.configured ? `\u5DF2\u914D\u7F6E\uFF08${props.credential.source || "DSH \u51ED\u636E\u5E93"}\uFF09` : "\u672A\u914D\u7F6E" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Input, { type: "password", autoComplete: "new-password", placeholder: "\u8F93\u5165\u65B0 Key\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u6E05\u7A7A", value: props.keyDraft, disabled: props.disabled || props.credential?.writable === false, onChange: (event) => props.onKeyDraft(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "primary", disabled: props.disabled || !props.keyDraft.trim(), onClick: props.onSaveKey, children: "\u4FDD\u5B58 Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives2.Button, { size: "sm", variant: "outline", disabled: props.disabled || !props.credential?.configured || props.credential.writable === false, onClick: props.onClearKey, children: "\u5220\u9664" })
      ] })
    ] })
  ] });
}
function messageOf(error) {
  return error instanceof Error ? error.message : "\u672A\u77E5\u8BBE\u7F6E\u9519\u8BEF";
}
var styles = {
  section: { maxWidth: 760, display: "flex", flexDirection: "column", gap: 14, color: "var(--dsw-alias-label-primary)" },
  title: { margin: 0, fontSize: 20 },
  intro: { margin: "6px 0 0", color: "var(--dsw-alias-label-tertiary)", lineHeight: 1.6 },
  notice: { padding: "10px 12px", borderRadius: 8, background: "var(--dsw-alias-background-l2)", fontSize: 13 },
  card: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 12, padding: 16, background: "var(--dsw-alias-background-l1)" },
  cardTitle: { margin: 0, fontSize: 16 },
  stack: { display: "flex", flexDirection: "column", gap: 14, marginTop: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600 },
  help: { margin: "5px 0 0", color: "var(--dsw-alias-label-tertiary)", fontSize: 12, lineHeight: 1.5 },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  toggle: { display: "flex", alignItems: "center", gap: 9, fontSize: 14 },
  policyGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  policyOption: { display: "flex", flexDirection: "column", gap: 4, padding: "10px 11px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 9, background: "transparent", color: "var(--dsw-alias-label-primary)", textAlign: "left", cursor: "pointer" },
  policyOptionActive: { borderColor: "var(--dsw-alias-brand-primary)", background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)" },
  policyDescription: { color: "var(--dsw-alias-label-tertiary)", fontSize: 11, lineHeight: 1.4 },
  browserCard: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 12, background: "var(--dsw-alias-background-l1)", overflow: "hidden" },
  browserHeader: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", border: 0, background: "transparent", color: "var(--dsw-alias-label-primary)", textAlign: "left", cursor: "pointer", font: "inherit" },
  browserSubtitle: { display: "block", marginTop: 4, color: "var(--dsw-alias-label-tertiary)", fontSize: 11 },
  browserHeaderMeta: { display: "flex", alignItems: "center", gap: 8, color: "var(--dsw-alias-label-tertiary)", fontSize: 12 },
  browserChevron: { width: 17, height: 17, transition: "transform .16s ease" },
  browserBody: { display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 16px", borderTop: "1px solid var(--dsw-alias-border-l2)" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, paddingTop: 14 },
  storePath: { padding: "8px 10px", borderRadius: 7, background: "var(--dsw-alias-background-l2)", color: "var(--dsw-alias-label-secondary)", fontSize: 11, overflowWrap: "anywhere" },
  browserSearch: { display: "flex", alignItems: "center", gap: 8 },
  browserError: { padding: 10, borderRadius: 8, background: "color-mix(in srgb, var(--dsw-alias-state-error-primary, #d24b4b) 10%, transparent)", color: "var(--dsw-alias-state-error-primary, #d24b4b)", fontSize: 12 },
  browserEmpty: { padding: "22px 10px", color: "var(--dsw-alias-label-tertiary)", textAlign: "center", fontSize: 12 },
  materialList: { display: "flex", flexDirection: "column", gap: 6 },
  materialRow: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 9, overflow: "hidden" },
  materialButton: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 11px", border: 0, background: "transparent", color: "var(--dsw-alias-label-primary)", textAlign: "left", cursor: "pointer", font: "inherit" },
  materialMain: { minWidth: 0, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" },
  itemChevron: { width: 16, height: 16, flex: "0 0 16px", color: "var(--dsw-alias-label-tertiary)", transition: "transform .16s ease" },
  contentPreview: { maxHeight: 300, margin: 0, padding: 12, overflow: "auto", borderTop: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-button-elevated-fill, var(--dsw-alias-background-l2))", color: "var(--dsw-alias-label-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, lineHeight: 1.6 },
  pagination: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, color: "var(--dsw-alias-label-tertiary)", fontSize: 11 },
  paginationButtons: { display: "flex", gap: 8 },
  credentialStatus: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--dsw-alias-label-tertiary)" }
};
return module.exports; } });
//# sourceMappingURL=web-client.js.map
