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
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react = require("react");

// src/client-settings.ts
var SETTINGS_ENDPOINT = "/api/project-knowledge-review/settings";
var KNOWLEDGE_ENDPOINT = "/api/project-knowledge-review/knowledge";

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "connection"];
function apply(ctx) {
  ctx.effect(() => installKnowledgeReviewVisuals(), "project-knowledge-review: visuals");
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
    document.querySelectorAll(".dsh-project-knowledge-review-icon").forEach((icon) => icon.remove());
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
  const [settings, setSettings] = (0, import_react.useState)();
  const [revision, setRevision] = (0, import_react.useState)();
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [notice, setNotice] = (0, import_react.useState)("");
  const [ragKey, setRagKey] = (0, import_react.useState)("");
  const [ocrKey, setOcrKey] = (0, import_react.useState)("");
  const [asrKey, setAsrKey] = (0, import_react.useState)("");
  const [credentials, setCredentials] = (0, import_react.useState)({});
  const load = async () => {
    try {
      const response = await fetch(SETTINGS_ENDPOINT, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.value) throw new Error(payload.message || "\u8BBE\u7F6E\u8BFB\u53D6\u5931\u8D25");
      setSettings(payload.value);
      setRevision(payload.revision);
      await loadCredentials(payload.value);
    } catch (error) {
      setNotice(messageOf(error));
    }
  };
  const loadCredentials = async (value) => {
    if (!api) return;
    const refs = [...new Set([value.ragApiKeyEnv, value.ocrApiKeyEnv, value.asrApiKeyEnv].filter(Boolean))];
    const response = await api.credentials.describe({ refs });
    if (!response.result.ok) throw new Error(response.result.error.message);
    setCredentials(response.result.value.credentials);
  };
  (0, import_react.useEffect)(() => {
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
    const ref = kind === "rag" ? settings.ragApiKeyEnv : kind === "ocr" ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv;
    const value = (kind === "rag" ? ragKey : kind === "ocr" ? ocrKey : asrKey).trim();
    if (!value) {
      setNotice("\u8BF7\u8F93\u5165 API Key\uFF1B\u5DF2\u4FDD\u5B58\u7684 Key \u4E0D\u4F1A\u56DE\u663E\u3002");
      return false;
    }
    setBusy(true);
    try {
      const response = await api.credentials.set({ ref, value });
      if (!response.result.ok) throw new Error(response.result.error.message);
      kind === "rag" ? setRagKey("") : kind === "ocr" ? setOcrKey("") : setAsrKey("");
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
    const ref = kind === "rag" ? settings.ragApiKeyEnv : kind === "ocr" ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv;
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
  if (!settings) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: styles.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: styles.title, children: "\u77E5\u8BC6\u590D\u4E60" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: notice || "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: styles.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: styles.title, children: "\u77E5\u8BC6\u590D\u4E60" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.intro, children: "\u63A7\u5236\u4E25\u683C\u8BC1\u636E\u95EE\u7B54\u3001\u672C\u5730\u77E5\u8BC6\u5E93\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684\u9879\u76EE RAG\u3001OCR \u548C ASR\u3002API Key \u53EA\u5199\u5165 DSH \u51ED\u636E\u5E93\uFF0C\u4E0D\u4F1A\u56DE\u663E\u3002" })
    ] }),
    notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.notice, children: notice }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { title: "\u57FA\u7840\u670D\u52A1", description: "\u5173\u95ED\u540E\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4FDD\u6301\u9759\u9ED8\uFF0C\u6240\u6709\u77E5\u8BC6\u590D\u4E60\u5DE5\u5177\u90FD\u4F1A\u62D2\u7EDD\u6267\u884C\u3002", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { label: "\u5F00\u542F\u77E5\u8BC6\u590D\u4E60\u670D\u52A1", checked: settings.enabled, disabled: busy, onChange: (value) => void saveField("enabled", value) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "\u8FD0\u884C\u6A21\u5F0F", help: "local \u65E0\u9700\u6570\u636E\u5E93\u548C\u5411\u91CF\u6A21\u578B\uFF1Bproject-rag \u8FDE\u63A5\u5B8C\u6574\u9879\u76EE RAG\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeSelect, { value: settings.mode, disabled: busy, onChange: (value) => void saveField("mode", value) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "\u56DE\u7B54\u7B56\u7565", help: "\u4E25\u683C\u77E5\u8BC6\u5E93\u53EA\u5141\u8BB8 evidence \u7ED3\u8BBA\uFF1B\u53C2\u8003\u77E5\u8BC6\u5E93\u5141\u8BB8\u6A21\u578B\u8865\u5145\uFF0C\u4F46\u4F1A\u660E\u786E\u6807\u6CE8\u6765\u6E90\u8FB9\u754C\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicySelect, { value: settings.answerPolicy, disabled: busy, onChange: (value) => void saveField("answerPolicy", value) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u77E5\u8BC6\u5E93\u540D\u79F0", value: settings.projectName, disabled: busy, onChange: (value) => updateDraft("projectName", value), onSave: () => void saveField("projectName", settings.projectName) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u672C\u5730\u8D44\u6599\u5E93\u8DEF\u5F84", value: settings.localStorePath, disabled: busy, onChange: (value) => updateDraft("localStorePath", value), onSave: () => void saveField("localStorePath", settings.localStorePath) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeginnerSetup, { mode: settings.mode, ragKey, credential: credentials[settings.ragApiKeyEnv], disabled: busy, onKeyDraft: setRagKey, onSaveKey: () => saveCredential("rag"), onClearKey: () => void clearCredential("rag") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KnowledgeBrowser, { mode: settings.mode }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { title: "\u9879\u76EE RAG", description: "\u4EC5 project-rag \u6A21\u5F0F\u9700\u8981\u3002Python \u670D\u52A1\u8D1F\u8D23\u5411\u91CF\u68C0\u7D22\u3001PDF/Office\u3001\u89C6\u9891\u7F51\u9875\u3001OCR/ASR \u548C\u8010\u4E45\u4EFB\u52A1\u3002", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "RAG \u670D\u52A1 URL", value: settings.ragBaseUrl, disabled: busy, onChange: (value) => updateDraft("ragBaseUrl", value), onSave: () => void saveField("ragBaseUrl", settings.ragBaseUrl) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, { label: "\u8BF7\u6C42\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09", value: settings.requestTimeoutMs, disabled: busy, onChange: (value) => updateDraft("requestTimeoutMs", value), onSave: () => void saveField("requestTimeoutMs", settings.requestTimeoutMs) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: styles.cardTitle, children: props.title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.help, children: props.description }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.stack, children: props.children })
  ] });
}
function Field(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.label, children: props.label }),
    props.children,
    props.help && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.help, children: props.help })
  ] });
}
function ModeSelect(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const rootRef = (0, import_react.useRef)(null);
  const options = [
    { value: "local", label: "\u672C\u5730\u96F6\u914D\u7F6E\u6A21\u5F0F", description: "\u5173\u952E\u8BCD\u68C0\u7D22\uFF0C\u65E0\u9700\u6570\u636E\u5E93\u6216\u6A21\u578B Key" },
    { value: "project-rag", label: "\u9879\u76EE RAG \u589E\u5F3A\u6A21\u5F0F", description: "\u8FDE\u63A5 Python RAG\uFF0C\u652F\u6301\u8BED\u4E49\u4E0E\u591A\u6A21\u6001\u8D44\u6599" }
  ];
  const selected = options.find((option) => option.value === props.value) ?? options[0];
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: rootRef, className: "dsh-project-knowledge-review-select", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dsh-project-knowledge-review-select-button", "aria-haspopup": "listbox", "aria-expanded": open, disabled: props.disabled, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selected.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "dsh-project-knowledge-review-select-chevron", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" }) })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-project-knowledge-review-select-menu", role: "listbox", "aria-label": "\u8FD0\u884C\u6A21\u5F0F", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { role: "option", "aria-selected": option.value === props.value, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dsh-project-knowledge-review-select-option", onClick: () => {
      props.onChange(option.value);
      setOpen(false);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: option.label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { style: styles.modeDescription, children: option.description })
      ] }),
      option.value === props.value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "dsh-project-knowledge-review-select-check", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 12 4 4L19 6" }) })
    ] }) }, option.value)) })
  ] });
}
function PolicySelect(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.policyGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: { ...styles.policyOption, ...props.value === "strict" ? styles.policyOptionActive : {} }, disabled: props.disabled, onClick: () => props.onChange("strict"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u4E25\u683C\u77E5\u8BC6\u5E93" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.policyDescription, children: "\u4EC5\u6839\u636E\u5DF2\u6709 evidence \u56DE\u7B54\uFF1B\u65E0\u8BC1\u636E\u65F6\u62D2\u7B54" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: { ...styles.policyOption, ...props.value === "reference" ? styles.policyOptionActive : {} }, disabled: props.disabled, onClick: () => props.onChange("reference"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u53C2\u8003\u77E5\u8BC6\u5E93" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.policyDescription, children: "\u77E5\u8BC6\u5E93\u4F18\u5148\uFF0C\u5141\u8BB8\u660E\u786E\u6807\u6CE8\u7684\u6A21\u578B\u8865\u5145" })
    ] })
  ] });
}
function BeginnerSetup(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [status, setStatus] = (0, import_react.useState)();
  const [installRoot, setInstallRoot] = (0, import_react.useState)("");
  const [starting, setStarting] = (0, import_react.useState)(false);
  const [detecting, setDetecting] = (0, import_react.useState)(false);
  const load = async () => {
    setDetecting(true);
    try {
      const response = await fetch("/api/project-knowledge-review/setup/status", { cache: "no-store" });
      const payload = await response.json();
      setStatus(payload);
      if (!installRoot && payload.installRoot) setInstallRoot(payload.installRoot);
    } catch {
    } finally {
      setDetecting(false);
    }
  };
  (0, import_react.useEffect)(() => {
    if (open) void load();
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (!open || !status?.running) return;
    const timer = setInterval(() => void load(), 1500);
    return () => clearInterval(timer);
  }, [open, status?.running]);
  const start = async () => {
    if (!confirm("\u5C06\u81EA\u52A8\u4E0B\u8F7D\u9879\u76EE\u3001\u521B\u5EFA\u672C\u673A pgvector \u6570\u636E\u5E93\u5E76\u51C6\u5907\u72EC\u7ACB Python \u73AF\u5883\u3002\u4E0D\u4F1A\u5220\u9664\u73B0\u6709\u6570\u636E\uFF1B\u5931\u8D25\u65F6\u672C\u5730\u5F00\u7BB1\u5373\u7528\u6A21\u5F0F\u4ECD\u53EF\u4F7F\u7528\u3002\u662F\u5426\u7EE7\u7EED\uFF1F")) return;
    setStarting(true);
    try {
      if (props.ragKey.trim() && !await props.onSaveKey()) return;
      const response = await fetch("/api/project-knowledge-review/setup/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ installRoot }) });
      const payload = await response.json();
      if (!response.ok || payload.phase === "failed") throw new Error(payload.error || payload.message || "\u4E00\u952E\u51C6\u5907\u542F\u52A8\u5931\u8D25");
      setStatus(payload);
    } catch (error) {
      setStatus((current) => current ? { ...current, phase: "failed", running: false, message: "\u5B8C\u6574\u591A\u6A21\u6001\u51C6\u5907\u672A\u542F\u52A8\uFF1B\u672C\u5730\u6A21\u5F0F\u4ECD\u53EF\u4F7F\u7528\u3002", error: messageOf(error) } : current);
    } finally {
      setStarting(false);
    }
  };
  const ready = status?.phase === "ready";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.setupCard, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: styles.browserHeader, "aria-expanded": open, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u65B0\u624B\u4E00\u952E\u51C6\u5907" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { style: styles.browserSubtitle, children: "\u7EAF\u6587\u672C\u77E5\u8BC6\u590D\u4E60\u5DF2\u7ECF\u53EF\u7528\uFF1B\u5B8C\u6574\u591A\u6A21\u6001\u6309\u9700\u51C6\u5907" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.browserHeaderMeta, children: [
        ready ? "\u5B8C\u6574\u529F\u80FD\u5DF2\u5C31\u7EEA" : props.mode === "local" ? "\u672C\u5730\u529F\u80FD\u5DF2\u5C31\u7EEA" : status?.message || "",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { style: { ...styles.browserChevron, transform: open ? "rotate(180deg)" : void 0 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" }) })
      ] })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.setupBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.beginnerNotice, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u73B0\u5728\u5C31\u80FD\u590D\u4E60\u7EAF\u6587\u672C\u8D44\u6599" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u53EA\u6709\u5F53\u4F60\u8981\u89E3\u6790 PDF\u3001Office\u3001\u626B\u63CF\u4EF6\u6216\u89C6\u9891\u65F6\uFF0C\u624D\u9700\u8981\u586B\u5199\u4E0B\u65B9 DashScope Key \u5E76\u51C6\u5907\u5B8C\u6574\u591A\u6A21\u6001\u529F\u80FD\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: "DashScope API Key\uFF08\u4EC5\u5B8C\u6574\u591A\u6A21\u6001\u9700\u8981\uFF09", help: "\u9700\u8981\u4F7F\u7528\u4F60\u81EA\u5DF1\u7684\u963F\u91CC\u4E91\u767E\u70BC Key\uFF0C\u63D2\u4EF6\u65E0\u6CD5\u4EE3\u4E3A\u7533\u8BF7\uFF1B\u4FDD\u5B58\u540E\u53EA\u5199\u5165 DSH \u51ED\u636E\u5E93\uFF0C\u4E0D\u8FDB\u5165\u9879\u76EE\u6587\u4EF6\u6216\u65E5\u5FD7\u3002", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.credentialStatus, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: props.credential?.configured ? "done" : "warning" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: props.credential?.configured ? "\u5DF2\u914D\u7F6E\uFF0C\u53EF\u4EE5\u5F00\u59CB\u51C6\u5907\u5B8C\u6574\u529F\u80FD" : "\u5C1A\u672A\u586B\u5199\uFF1B\u7EAF\u6587\u672C\u77E5\u8BC6\u590D\u4E60\u4E0D\u53D7\u5F71\u54CD" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.keyRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { type: "password", autoComplete: "new-password", placeholder: "\u8F93\u5165 DashScope API Key", value: props.ragKey, onChange: (event) => props.onKeyDraft(event.target.value) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "primary", disabled: !props.ragKey.trim() || props.disabled, onClick: props.onSaveKey, children: "\u5B89\u5168\u4FDD\u5B58" }),
          props.credential?.configured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", onClick: props.onClearKey, children: "\u5220\u9664" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { style: styles.advancedDetails, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { style: styles.advancedSummary, children: "\u9AD8\u7EA7\u9009\u9879\uFF1A\u66F4\u6539\u5B89\u88C5\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.advancedBody, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: installRoot, title: installRoot, onChange: (event) => setInstallRoot(event.target.value) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { style: styles.help, children: "\u9ED8\u8BA4\u76EE\u5F55\u5B89\u5168\u4E14\u53EF\u76F4\u63A5\u4F7F\u7528\uFF0C\u666E\u901A\u7528\u6237\u65E0\u9700\u4FEE\u6539\u3002" })
        ] })
      ] }),
      detecting && !status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.setupStatus, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u6B63\u5728\u53EA\u8BFB\u68C0\u6D4B\u672C\u673A\u73AF\u5883\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4E0D\u4F1A\u4E0B\u8F7D\u3001\u5B89\u88C5\u6216\u4FEE\u6539\u7CFB\u7EDF\u3002" })
      ] }),
      status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.setupStatus, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: status.message }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "Docker ",
          status.prerequisites.docker ? "\u2713" : "\u2014",
          " \xB7 Git ",
          status.prerequisites.git ? "\u2713" : "\u2014",
          " \xB7 Conda ",
          status.prerequisites.conda ? "\u2713" : "\u2014"
        ] }),
        status.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.setupError, children: status.error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.setupActions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", disabled: starting || status?.running || ready || !props.credential?.configured && !props.ragKey.trim(), onClick: () => void start(), children: status?.running ? "\u6B63\u5728\u81EA\u52A8\u51C6\u5907\u2026" : ready ? "\u5B8C\u6574\u591A\u6A21\u6001\u5DF2\u5C31\u7EEA" : !props.credential?.configured && !props.ragKey.trim() ? "\u586B\u5199 Key \u540E\u5373\u53EF\u4E00\u952E\u51C6\u5907" : "\u4E00\u952E\u51C6\u5907\u5B8C\u6574\u591A\u6A21\u6001" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", disabled: detecting, onClick: () => void load(), children: detecting ? "\u6B63\u5728\u68C0\u6D4B\u2026" : "\u91CD\u65B0\u68C0\u6D4B" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { style: styles.help, children: "\u63D2\u4EF6\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5 Docker Desktop\u3001WSL2 \u6216\u7ED5\u8FC7\u4F01\u4E1A\u7F51\u7EDC\u9650\u5236\u3002\u7F3A\u5C11\u7CFB\u7EDF\u524D\u63D0\u65F6\u4F1A\u660E\u786E\u63D0\u793A\uFF0C\u5E76\u4FDD\u6301\u672C\u5730\u6A21\u5F0F\u6B63\u5E38\u53EF\u7528\u3002" })
    ] })
  ] });
}
function KnowledgeBrowser({ mode }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [overview, setOverview] = (0, import_react.useState)();
  const [items, setItems] = (0, import_react.useState)([]);
  const [queryDraft, setQueryDraft] = (0, import_react.useState)("");
  const [query, setQuery] = (0, import_react.useState)("");
  const [cursor, setCursor] = (0, import_react.useState)();
  const [cursorStack, setCursorStack] = (0, import_react.useState)([]);
  const [nextCursor, setNextCursor] = (0, import_react.useState)();
  const [hasMore, setHasMore] = (0, import_react.useState)(false);
  const [total, setTotal] = (0, import_react.useState)(0);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  const [expandedId, setExpandedId] = (0, import_react.useState)();
  const [content, setContent] = (0, import_react.useState)("");
  const [contentLoading, setContentLoading] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
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
  }, [open, mode, cursor, query]);
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.browserCard, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: styles.browserHeader, "aria-expanded": open, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u77E5\u8BC6\u5E93\u5185\u5BB9" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { style: styles.browserSubtitle, children: "\u5206\u9875\u67E5\u770B\u6807\u9898\u3001\u6765\u6E90\u4E0E\u539F\u59CB\u5185\u5BB9" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.browserHeaderMeta, children: [
        overview ? `${overview.documentCount ?? overview.materialCount ?? total} \u6761` : "",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { style: { ...styles.browserChevron, transform: open ? "rotate(180deg)" : void 0 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" }) })
      ] })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.browserBody, children: [
      overview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.overviewGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u5F53\u524D\u6A21\u5F0F" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: overview.mode === "local" ? "\u672C\u5730\u77E5\u8BC6\u5E93" : "\u9879\u76EE RAG" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u8D44\u6599\u6570\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: overview.documentCount ?? overview.materialCount ?? total })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u4F5C\u7528\u57DF" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: overview.scope === "dsh-user-global" ? "DSH \u7528\u6237\u7EA7\u5168\u5C40" : "\u63D2\u4EF6\u56FA\u5B9A\u5206\u533A" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u4E0E\u5F53\u524D\u9879\u76EE\u5171\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: overview.sharedWithCurrentProject ? "\u662F" : "\u5426" })
        ] })
      ] }),
      overview?.storePath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.storePath, children: [
        "\u5B58\u50A8\u4F4D\u7F6E\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: overview.storePath })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { style: styles.browserSearch, onSubmit: (event) => {
        event.preventDefault();
        setCursor(void 0);
        setCursorStack([]);
        setQuery(queryDraft.trim());
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: queryDraft, placeholder: "\u6309\u6807\u9898\u6216\u6765\u6E90\u641C\u7D22", onChange: (event) => setQueryDraft(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { type: "submit", size: "sm", variant: "outline", children: "\u641C\u7D22" }),
        query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { type: "button", size: "sm", variant: "ghost", onClick: () => {
          setQueryDraft("");
          setQuery("");
          setCursor(void 0);
          setCursorStack([]);
        }, children: "\u6E05\u9664" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.browserError, children: error }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.browserEmpty, children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u9875\u2026" }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.browserEmpty, children: "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u8D44\u6599" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.materialList, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.materialRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: styles.materialButton, onClick: () => void showContent(item), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.materialMain, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
              item.source || "\u672A\u6807\u6CE8\u6765\u6E90",
              " \xB7 ",
              item.documentType || `${item.contentLength ?? 0} \u5B57\u7B26`,
              " ",
              item.status ? `\xB7 ${item.status}` : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { style: { ...styles.itemChevron, transform: expandedId === String(item.id) ? "rotate(180deg)" : void 0 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" }) })
        ] }),
        expandedId === String(item.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { style: styles.contentPreview, children: contentLoading ? "\u6B63\u5728\u6309\u9700\u8BFB\u53D6\u539F\u6587\u2026" : content })
      ] }, String(item.id))) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.pagination, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "\u5171 ",
          total,
          " \u6761 \xB7 \u5F53\u524D\u9875\u6700\u591A 30 \u6761"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.paginationButtons, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: !cursorStack.length || loading, onClick: () => {
            const stack = [...cursorStack];
            setCursor(stack.pop());
            setCursorStack(stack);
          }, children: "\u4E0A\u4E00\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: !hasMore || !nextCursor || loading, onClick: () => {
            setCursorStack((stack) => [...stack, cursor]);
            setCursor(nextCursor);
          }, children: "\u4E0B\u4E00\u9875" })
        ] })
      ] })
    ] })
  ] });
}
function TextField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: props.label, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: props.value, disabled: props.disabled, onChange: (event) => props.onChange(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: props.disabled, onClick: props.onSave, children: "\u4FDD\u5B58" })
  ] }) });
}
function NumberField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: props.label, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { type: "number", value: props.value, disabled: props.disabled, onChange: (event) => props.onChange(Number(event.target.value)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: props.disabled, onClick: props.onSave, children: "\u4FDD\u5B58" })
  ] }) });
}
function Toggle(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.toggle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: props.checked, disabled: props.disabled, onChange: (event) => props.onChange(event.target.checked) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: props.label })
  ] });
}
function ServiceCard(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { title: props.title, description: "\u652F\u6301 OpenAI \u517C\u5BB9\u63A5\u53E3\u3002Base URL \u4E0D\u542B\u5177\u4F53\u65B9\u6CD5\u8DEF\u5F84\uFF1BKey \u4FDD\u5B58\u540E\u4E0D\u4F1A\u56DE\u663E\u3002", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { label: `\u5F00\u542F${props.title}`, checked: props.enabled, disabled: props.disabled, onChange: props.onToggle }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "Base URL", value: props.baseUrl, disabled: props.disabled, onChange: props.onBaseUrl, onSave: props.onSaveBase }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u6A21\u578B\u540D\u79F0", value: props.model, disabled: props.disabled, onChange: props.onModel, onSave: props.onSaveModel }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u51ED\u636E\u5F15\u7528\u540D", value: props.keyRef, disabled: props.disabled, onChange: props.onKeyRef, onSave: props.onSaveKeyRef }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: "API Key", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.credentialStatus, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: props.credential?.configured ? "done" : "warning" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: props.credential?.configured ? `\u5DF2\u914D\u7F6E\uFF08${props.credential.source || "DSH \u51ED\u636E\u5E93"}\uFF09` : "\u672A\u914D\u7F6E" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { type: "password", autoComplete: "new-password", placeholder: "\u8F93\u5165\u65B0 Key\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u6E05\u7A7A", value: props.keyDraft, disabled: props.disabled || props.credential?.writable === false, onChange: (event) => props.onKeyDraft(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "primary", disabled: props.disabled || !props.keyDraft.trim(), onClick: props.onSaveKey, children: "\u4FDD\u5B58 Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: props.disabled || !props.credential?.configured || props.credential.writable === false, onClick: props.onClearKey, children: "\u5220\u9664" })
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
  modeDescription: { display: "block", marginTop: 3, color: "var(--dsw-alias-label-tertiary)", fontSize: 11, lineHeight: 1.35 },
  policyGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  policyOption: { display: "flex", flexDirection: "column", gap: 4, padding: "10px 11px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 9, background: "transparent", color: "var(--dsw-alias-label-primary)", textAlign: "left", cursor: "pointer" },
  policyOptionActive: { borderColor: "var(--dsw-alias-brand-primary)", background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)" },
  policyDescription: { color: "var(--dsw-alias-label-tertiary)", fontSize: 11, lineHeight: 1.4 },
  browserCard: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 12, background: "var(--dsw-alias-background-l1)", overflow: "hidden" },
  setupCard: { border: "1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-l2))", borderRadius: 12, background: "linear-gradient(145deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-background-l1)), var(--dsw-alias-background-l1))", overflow: "hidden" },
  setupBody: { display: "flex", flexDirection: "column", gap: 14, padding: "0 16px 16px", borderTop: "1px solid var(--dsw-alias-border-l2)" },
  beginnerNotice: { display: "flex", flexDirection: "column", gap: 4, marginTop: 14, padding: "11px 12px", borderRadius: 9, background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent)", color: "var(--dsw-alias-label-primary)", fontSize: 12, lineHeight: 1.5 },
  setupStatus: { display: "flex", flexDirection: "column", gap: 5, padding: "10px 11px", borderRadius: 9, background: "var(--dsw-alias-background-l2)", color: "var(--dsw-alias-label-secondary)", fontSize: 12 },
  setupError: { color: "#b13b3b", lineHeight: 1.5 },
  setupActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  keyRow: { display: "grid", gridTemplateColumns: "minmax(240px, 1fr) auto auto", gap: 8, alignItems: "center" },
  advancedDetails: { borderRadius: 8, background: "var(--dsw-alias-background-l2)", color: "var(--dsw-alias-label-secondary)", fontSize: 12 },
  advancedSummary: { padding: "9px 11px", cursor: "pointer", color: "var(--dsw-alias-label-secondary)" },
  advancedBody: { display: "flex", flexDirection: "column", gap: 5, padding: "0 11px 11px" },
  browserHeader: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", border: 0, background: "transparent", color: "var(--dsw-alias-label-primary)", textAlign: "left", cursor: "pointer", font: "inherit" },
  browserSubtitle: { display: "block", marginTop: 4, color: "var(--dsw-alias-label-tertiary)", fontSize: 11 },
  browserHeaderMeta: { display: "flex", alignItems: "center", gap: 8, color: "var(--dsw-alias-label-tertiary)", fontSize: 12 },
  browserChevron: { width: 17, height: 17, transition: "transform .16s ease" },
  browserBody: { display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 16px", borderTop: "1px solid var(--dsw-alias-border-l2)" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, paddingTop: 14 },
  storePath: { padding: "8px 10px", borderRadius: 7, background: "var(--dsw-alias-background-l2)", color: "var(--dsw-alias-label-secondary)", fontSize: 11, overflowWrap: "anywhere" },
  browserSearch: { display: "flex", alignItems: "center", gap: 8 },
  browserError: { padding: 10, borderRadius: 8, background: "color-mix(in srgb, #d24b4b 10%, transparent)", color: "#a33131", fontSize: 12 },
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
