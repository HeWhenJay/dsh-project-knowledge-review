# 项目知识复习插件

面向 DeepSeek Harness（DSH）的中文知识复习插件。它的目标不是让模型“知道更多”，而是让模型只依据你实际保存的学习资料回答：有证据才回答；资料不足时明确拒答并提示补充资料，避免把模型记忆、网络常识和不相干内容混入学习答案。

从 `0.2.0` 起，插件默认采用**零配置本地模式**：不需要 PostgreSQL、pgvector、向量模型、embedding API Key、Python 服务或登录令牌。用户粘贴学习文本后即可开始严格检索问答。需要 PDF/视频/OCR/语义向量检索时，再选择可选的项目 RAG 增强模式。

## 先看结论：你需要配置什么

| 能力 | 默认本地模式 `local` | 项目 RAG 增强模式 `project-rag` |
| --- | --- | --- |
| 安装 DSH 插件 | 需要 | 需要 |
| DSH 中选择可回答问题的模型 | 需要 | 需要 |
| PostgreSQL / pgvector | 不需要 | 需要 |
| 向量 embedding 模型 | 不需要 | 需要 |
| embedding / rerank API Key | 不需要 | 通常需要 |
| 启动 Python RAG 服务 | 不需要 | 需要 |
| 项目登录 Token | 不需要 | 不需要 |
| 纯文本、笔记、Markdown 内容 | 支持，粘贴后立即可检索 | 支持 |
| 自动处理 PDF、Office、扫描件 | 不支持 | 支持，依赖项目 RAG 解析能力 |
| 视频 URL、字幕、ASR、OCR | 不支持 | 支持，依赖项目 RAG 和平台/模型配置 |
| 语义近义词检索 | 不支持，仅关键词混合检索 | 支持，依赖 embedding 与重排 |
| 长期资料与耐久任务 | 本地 JSON 文件，适合个人轻量资料 | PostgreSQL/pgvector，适合完整项目资料库 |

## 默认零配置本地模式

### 用户实际需要做的事

只需要三步：

1. 已经能正常使用 DSH，并在 DSH 中选择一个模型。
2. 安装本插件并刷新 DSH 页面。
3. 把可学习的文本资料粘贴给助手，例如课程笔记、Markdown、文档摘录或视频字幕；助手会调用 `project_knowledge_add_text` 将它写入本地知识库。

不需要数据库、不需要 Python、也不需要任何 API Key。最终回答始终由当前 DSH 会话中你选择的模型生成。

默认资料库位置：

```text
~/.dsh/project-knowledge-review/knowledge.json
```

在 Windows 上通常是：

```text
C:\Users\你的用户名\.dsh\project-knowledge-review\knowledge.json
```

它是普通 UTF-8 JSON 文件；可自行备份、迁移或删除。删除该文件即清空本地资料库。

### 本地模式如何检索

本地模式使用中文字符、英文单词、技术标识符（例如 `useEffect`、`RAG`、`pgvector`）的关键词覆盖率和标题加权排序，并返回原始资料片段作为 evidence。

这不是向量检索，也不下载模型。因此：

- 优点：首次安装立即可用、没有模型下载、没有成本、没有 API Key。
- 边界：近义表达和跨语言语义匹配能力有限；资料应尽量使用清楚的标题和原始术语。
- 安全规则不变：没有命中证据时，插件要求模型明确拒答，不猜测。

### 配置示例

默认配置已随插件安装，无需修改：

```yaml
- insert:
    - id: project-knowledge-review
      name: dsh-project-knowledge-review
      config:
        mode: local
        localStorePath: ~/.dsh/project-knowledge-review/knowledge.json
        projectName: 我的知识库
```

如需把资料库放在其他磁盘，只覆盖 `localStorePath`：

```yaml
- id: project-knowledge-review
  config:
    localStorePath: D:/学习资料/dsh-knowledge.json
```

## 可选项目 RAG 增强模式

只有在你需要以下能力时才启用：PDF/Office/扫描件解析、视频 URL、ASR、OCR、向量语义检索、BM25 + pgvector 混合检索、重排、RRF、耐久索引任务和大量资料管理。

### 需要配置的内容

1. 启动本项目 Python RAG 服务，默认地址为 `http://127.0.0.1:8090`。
2. 准备 PostgreSQL 和 pgvector。正式持久化资料必须使用它；内存模式仅适合临时验证，重启会丢失资料。
3. 为 Python 服务配置 RAG 所需要的模型能力：
   - `DASHSCOPE_API_KEY`：默认百炼 embedding、rerank、RAG 生成、OCR/ASR 相关能力。
   - 视频链接若包含抖音等特定平台，还可能需要项目说明中的平台转写配置，例如 `SOCIALDATAX_API_KEY`。
4. 在插件配置中把 `mode` 改为 `project-rag`。

示例：

```yaml
- id: project-knowledge-review
  config:
    mode: project-rag
    ragBaseUrl: http://127.0.0.1:8090
    projectName: 学迹智配 Agent
    requestTimeoutMs: 120000
```

项目 RAG 模式不需要登录 Token。插件调用的是仅限本机回环访问的 `/api/dsh-plugin/rag/*` 接口，并使用独立的 `DSH_PLUGIN_RAG_USER_ID` 资料分区；原网站的登录和用户私有资料接口不受影响。

### 关于 DSH API Key 与 Python API Key

DSH 和 Python RAG 是两个独立进程：

- DSH 中的模型和 Key：用于最终和你对话、组织 evidence 并输出答案。
- Python RAG 的模型和 Key：用于 embedding、rerank、视频 ASR/OCR、解析和索引。

因此，默认本地模式不需要 Python Key；项目 RAG 模式仍需为 Python 服务配置它自己的 Key。插件不会读取、复制、保存或向模型暴露任何 Key。

## 安装与升级

```powershell
dsh plugin --profile web add github:HeWhenJay/dsh-project-knowledge-review
```

已安装时升级：

```powershell
dsh plugin --profile web update dsh-project-knowledge-review
```

安装或升级后刷新 DSH Web 页面。零配置本地模式不需要再启动任何服务。

## 模型工具和严格回答流程

- `project_knowledge_add_text`：将用户提供或确认有权使用的纯文本资料写入本地知识库。
- `project_knowledge_search`：检索当前模式下的知识库；只有返回 evidence 时才能回答知识内容。
- `project_knowledge_import_video`：仅在 `project-rag` 模式注册；把确认可学习的公开视频 URL 提交给项目 RAG 索引队列。

流程：

```text
知识问题
  ↓
project_knowledge_search
  ├─ 有 evidence → 当前 DSH 模型仅基于 evidence 回答
  └─ 无 evidence → 明确拒答，要求补充资料
                         ↓
              local：粘贴文字并调用 add_text
              project-rag：可提交文件或公开视频 URL
                         ↓
                    重新检索后回答
```

## 隐私与限制

- 本地模式只在你的电脑上写入 JSON 文件，不会自动上传文本或联网搜索知识。
- 插件不会自动抓取视频 URL；只有项目 RAG 增强模式中，且用户确认有权学习与索引后才提交 URL。
- 资料不足时插件会拒答，这项限制是刻意设计，不是故障。
- 本地 JSON 不适合多人、海量资料或严格权限管理；这些需求应使用项目 RAG 增强模式。

## 开发验证

```powershell
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm test
```

## 许可证

[MIT](LICENSE)
