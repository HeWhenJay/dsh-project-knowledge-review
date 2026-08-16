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

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "connection"];
function apply(ctx) {
  const connection = ctx.get("connection");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "knowledge-review",
    order: 35,
    label: () => "\u77E5\u8BC6\u590D\u4E60",
    inject: () => ({ api: connection.api })
  }, KnowledgeReviewSettings));
}
function KnowledgeReviewSettings({ api }) {
  const [settings, setSettings] = (0, import_react.useState)();
  const [revision, setRevision] = (0, import_react.useState)();
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [notice, setNotice] = (0, import_react.useState)("");
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
    const refs = [...new Set([value.ocrApiKeyEnv, value.asrApiKeyEnv].filter(Boolean))];
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
    if (!api || !settings) return;
    const ref = kind === "ocr" ? settings.ocrApiKeyEnv : settings.asrApiKeyEnv;
    const value = (kind === "ocr" ? ocrKey : asrKey).trim();
    if (!value) return setNotice("\u8BF7\u8F93\u5165 API Key\uFF1B\u5DF2\u4FDD\u5B58\u7684 Key \u4E0D\u4F1A\u56DE\u663E\u3002");
    setBusy(true);
    try {
      const response = await api.credentials.set({ ref, value });
      if (!response.result.ok) throw new Error(response.result.error.message);
      kind === "ocr" ? setOcrKey("") : setAsrKey("");
      await loadCredentials(settings);
      setNotice(`${kind.toUpperCase()} API Key \u5DF2\u5B89\u5168\u4FDD\u5B58\u5230 DSH \u51ED\u636E\u5E93\u3002`);
    } catch (error) {
      setNotice(messageOf(error));
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: "\u8FD0\u884C\u6A21\u5F0F", help: "local \u65E0\u9700\u6570\u636E\u5E93\u548C\u5411\u91CF\u6A21\u578B\uFF1Bproject-rag \u8FDE\u63A5\u5B8C\u6574\u9879\u76EE RAG\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: styles.select, value: settings.mode, disabled: busy, onChange: (event) => void saveField("mode", event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "local", children: "\u672C\u5730\u96F6\u914D\u7F6E\u6A21\u5F0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "project-rag", children: "\u9879\u76EE RAG \u589E\u5F3A\u6A21\u5F0F" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u77E5\u8BC6\u5E93\u540D\u79F0", value: settings.projectName, disabled: busy, onChange: (value) => updateDraft("projectName", value), onSave: () => void saveField("projectName", settings.projectName) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, { label: "\u672C\u5730\u8D44\u6599\u5E93\u8DEF\u5F84", value: settings.localStorePath, disabled: busy, onChange: (value) => updateDraft("localStorePath", value), onSave: () => void saveField("localStorePath", settings.localStorePath) })
    ] }),
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
  select: { minHeight: 36, borderRadius: 8, padding: "0 10px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-background-l1)", color: "inherit" },
  credentialStatus: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--dsw-alias-label-tertiary)" }
};
return module.exports; } });
//# sourceMappingURL=web-client.js.map
