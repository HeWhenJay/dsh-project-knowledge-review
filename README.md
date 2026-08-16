# 项目知识复习插件

面向 DeepSeek Harness（DSH）的中文知识复习插件。它不追求让模型“知道更多”，而是要求模型只依据你实际保存或索引的学习资料回答：有 evidence 才回答；资料不足时明确拒答并提示补充资料，避免把模型记忆、网络常识和不相干内容混入学习答案。

从 `0.3.0` 起，插件安装后会在 DSH Web 的“设置”中增加“知识复习”栏目。用户可直接启停服务、切换本地/项目 RAG 模式，并配置 OCR、ASR、模型名、服务 URL 与 API Key。设置热更新，无需重新安装插件；API Key 使用 DSH 凭据库保存，页面不会回显明文。`0.3.1` 修复了 Host RAG 客户端与 Web 设置 bundle 的同名构建覆盖问题；`0.3.2` 修复 DSH ModuleLoader 中 `module is not defined` 的 Web bundle 包装错误；`0.4.0` 使用主题化运行模式菜单与 Lucide `BookOpenCheck` 图标，并新增意图分流、严格/参考回答策略、分页知识内容浏览器和可选的完整多模态一键准备。

## 开箱即用

默认采用 `local` 零配置模式：不需要 PostgreSQL、pgvector、向量模型、Python 服务、登录令牌或 API Key。你只需在 DSH 中选择一个可用的对话模型，安装插件并刷新页面，然后把课程笔记、Markdown、文档摘录或字幕文本发给助手。

默认本地资料库：

```text
~/.dsh/project-knowledge-review/knowledge.json
```

Windows 上通常为：

```text
C:\Users\你的用户名\.dsh\project-knowledge-review\knowledge.json
```

本地模式使用中文字符、英文单词和技术标识符的关键词覆盖率与标题加权排序。它没有模型下载和额外费用，但近义表达、跨语言语义匹配弱于向量检索。资料未命中时，严格拒答规则仍然生效。

## DSH Web 设置栏目

安装或升级后刷新 `http://127.0.0.1:3080`，进入“设置 → 知识复习”。当前 DSH `0.1.0-rc.6` 对第三方 settings namespace 仍有 Web 白名单限制，因此插件内置了仅限本机回环访问的设置桥接；API Key 仍完全使用 DSH 官方 credentials API。

| 设置 | 默认值 | 生效方式 | 说明 |
| --- | --- | --- | --- |
| 开启知识复习服务 | 开启 | 立即 | 关闭后系统提示词保持静默，所有知识复习工具拒绝执行 |
| 运行模式 | `local` | 立即 | `local` 为本地 JSON；`project-rag` 连接项目 Python RAG |
| 回答策略 | `strict` | 立即 | `strict` 仅 evidence；`reference` 知识库优先并允许标注的模型补充 |
| 知识库名称 | `我的知识库` | 立即 | 用于严格知识复习提示词 |
| 本地资料库路径 | `~/.dsh/project-knowledge-review/knowledge.json` | 下次调用 | 可改到其他磁盘 |
| RAG 服务 URL | `http://127.0.0.1:8090` | 下次调用 | 仅项目 RAG 模式使用 |
| 请求超时 | `120000` 毫秒 | 下次调用 | 适用于项目 RAG、OCR、ASR |
| OCR 开关 | 关闭 | 立即 | 开启图片 URL 识别工具 |
| OCR Base URL | 百炼兼容地址 | 下次调用 | OpenAI 兼容 `/chat/completions` 服务根地址 |
| OCR 模型 | `qwen-vl-ocr` | 下次调用 | 可改成兼容视觉模型名称 |
| OCR 凭据引用 | `DSH_KNOWLEDGE_OCR_API_KEY` | 下次调用 | 这是引用名，不是 Key 明文 |
| ASR 开关 | 关闭 | 立即 | 开启可下载音频 URL 转写工具 |
| ASR Base URL | `https://api.openai.com/v1` | 下次调用 | OpenAI 兼容 `/audio/transcriptions` 服务根地址 |
| ASR 模型 | `whisper-1` | 下次调用 | 可改成兼容转写模型名称 |
| ASR 凭据引用 | `DSH_KNOWLEDGE_ASR_API_KEY` | 下次调用 | 这是引用名，不是 Key 明文 |

### 意图分流与回答策略

插件会先区分：知识问题、知识库自身信息、资料导入和普通工程请求。询问“有哪些资料、存储在哪里、是否与当前项目共用”时使用 `project_knowledge_overview`，不会再误走 evidence 查询和严格拒答链。

- 严格知识库：只有 evidence 命中时才回答，且只陈述资料支持的结论。
- 参考知识库：知识库 evidence 作为优先上下文；允许当前 DSH 模型补充，但必须把“知识库内容”和“模型补充”分开标注。

### 大规模知识内容浏览

设置页的“知识库内容”默认折叠，展开后才请求数据。列表采用服务端游标分页，每页最多 30 条，只返回标题、来源、状态等元数据；点击单条时才读取原文，单次预览最多 200,000 字符。翻页替换当前页而不无限追加，因此数万条资料时浏览器 DOM 仍保持常数级规模。项目 RAG 使用 `(updated_at, id)` keyset 游标；本地零配置模式使用轻量 JSONL sidecar 索引和单条原文文件，翻页不再重复解析整库原文。旧版 `knowledge.json` 会在首次访问时自动迁移并保留 `.v1.backup.json` 备份。

作用域说明：默认本地库位于 DSH 用户目录并跨工作区共用；项目 RAG 使用独立 `DSH_PLUGIN_RAG_USER_ID` 分区，不会自动等同于当前项目网站登录用户的资料库。

### API Key 安全行为

- 页面只允许“写入新 Key”或“删除 Key”，不会读取或回填已保存的明文。
- 本地凭据默认保存在 `$DSH_HOME/.credentials.yaml`，不是 `settings.yaml`。
- Host 在每次 OCR/ASR 操作开始时重新解析凭据，Key 轮换后下一次请求立即生效。
- Key 不进入 `cordis.patch.yml`、日志、前端状态、源码或 Git。
- 若同名环境变量覆盖本地凭据，页面会显示来源且可能不可写；这是 DSH 凭据 provider 的保护行为。
- 设置与凭据 RPC 只允许回环同源页面使用；通过局域网或反向代理打开的远程匿名页面不能配置 Key。

## 能力与依赖

| 能力 | `local` | `project-rag` |
| --- | --- | --- |
| 纯文本写入与 evidence 检索 | 支持 | 支持 |
| PostgreSQL / pgvector | 不需要 | 需要 |
| embedding / rerank | 不需要 | 通常需要，由 Python RAG 配置 |
| PDF / Office / 扫描件 | 不支持 | 支持，取决于项目解析服务 |
| 图片 URL OCR | 可选，直接在 DSH 设置配置 | 可使用本插件 OCR，也可由项目 RAG 处理 |
| 可下载音频 URL ASR | 可选，直接在 DSH 设置配置 | 可使用本插件 ASR，也可由项目 RAG 处理 |
| 视频网页 URL | 不支持 | 支持，由项目 RAG 入队索引 |
| 最终答案模型 | 当前 DSH 会话模型 | 当前 DSH 会话模型 |
| 项目登录 Token | 不需要 | 不需要 |

## OCR 与 ASR 边界

本插件直接提供：

- `project_knowledge_import_image_ocr`：下载公开图片 URL，调用 OpenAI 兼容视觉接口，并把识别文本写入本地知识库。
- `project_knowledge_import_audio_asr`：下载公开可直连音频 URL，调用 OpenAI 兼容转写接口，并把文本写入本地知识库。

安全限制：

- 只允许 `http` / `https` URL。
- 拒绝本机、环回和私有网络地址，并在每次重定向后重新检查。
- 图片最大 15MB，音频最大 100MB。
- ASR 工具处理的是可直接下载的音频文件，不是抖音、Bilibili、YouTube 等视频分享网页。视频网页应切换 `project-rag`，由项目 RAG 的平台下载、字幕和耐久任务链处理。

## 可选项目 RAG 增强模式

需要 PDF/Office/扫描件、视频网页 URL、语义向量检索、BM25 + pgvector、重排、RRF、耐久索引任务或大量资料时，展开设置页的“新手一键准备”：

1. 填写 DashScope 模型 Key。点击准备时，插件会先把 Key 安全写入 DSH 凭据库，明文不进入浏览器持久状态、普通设置、项目文件或日志。
2. 保持默认安装目录，点击“一键准备完整多模态”并确认。
3. 插件自动检查 Docker、Git、Conda，下载官方项目，创建插件独占的 pgvector 容器、具名数据卷和安装目录内的隔离 Conda 环境，然后执行非破坏性数据库 bootstrap。
4. 只有 `/health` 和插件固定知识分区接口都通过后，运行模式才自动切换到 `project-rag`。

数据库密码由插件随机生成，只保存在 DSH 用户私有安装目录。重复启动会复用带插件 ownership label 的容器和持久卷，不会接管、关闭或替换同名但不归插件管理的容器，也不会杀死占用 5433/8090 的其他进程。失败时页面显示原因，默认 `local` 模式始终可继续使用。

一键准备不会声称静默安装 Docker Desktop、WSL2、虚拟化能力或代替用户申请第三方模型 Key；这些属于操作系统或外部账号边界。缺少时页面会明确标出 Docker/Git/Conda 状态。已有高级部署也可以直接填写 RAG 服务 URL 并手动选择 `project-rag`。

项目 RAG 模式调用本机回环 `/api/dsh-plugin/rag/*` 接口，使用独立的 `DSH_PLUGIN_RAG_USER_ID` 资料分区，不需要网站登录 Token，也不会自动与当前项目网站登录用户的资料库共用。

## 安装与升级

安装：

```powershell
dsh plugin --profile web add github:HeWhenJay/dsh-project-knowledge-review
```

升级：

```powershell
dsh plugin --profile web update dsh-project-knowledge-review
```

安装或升级后刷新现有 DSH Web 页面，不需要启动替代 Web 服务器。默认本地模式不需要再启动任何服务。

## 模型工具与严格回答流程

- `project_knowledge_search`：检索当前模式的知识库；只有返回 evidence 时才能回答。
- `project_knowledge_add_text`：把用户提供或确认有权使用的纯文本写入本地知识库。
- `project_knowledge_import_image_ocr`：OCR 公开图片 URL 后写入本地知识库。
- `project_knowledge_import_audio_asr`：ASR 公开可下载音频 URL 后写入本地知识库。
- `project_knowledge_import_video`：仅项目 RAG 模式可用，把公开视频网页 URL 提交到索引队列。

```text
知识问题
  ↓
project_knowledge_search
  ├─ 有 evidence → 当前 DSH 模型仅依据 evidence 回答
  └─ 无 evidence → 明确拒答，不用通用模型知识补齐
                         ↓
             粘贴文本 / OCR 图片 / ASR 音频
             或 project-rag 导入视频网页
                         ↓
                    重新检索后回答
```

## 配置文件默认值

插件包附带的 `cordis.patch.yml` 提供安全默认值；Web 页面中的用户设置作为更高优先级的持久层覆盖这些默认值。普通用户不需要手改 YAML。

```yaml
- insert:
    - id: project-knowledge-review
      name: dsh-project-knowledge-review
      config:
        enabled: true
        mode: local
        answerPolicy: strict
        localStorePath: ~/.dsh/project-knowledge-review/knowledge.json
        projectName: 我的知识库
        ragBaseUrl: http://127.0.0.1:8090
        ragApiKeyEnv: DSH_KNOWLEDGE_RAG_API_KEY
        requestTimeoutMs: 120000
        ocrEnabled: false
        ocrBaseUrl: https://dashscope.aliyuncs.com/compatible-mode/v1
        ocrModel: qwen-vl-ocr
        ocrApiKeyEnv: DSH_KNOWLEDGE_OCR_API_KEY
        asrEnabled: false
        asrBaseUrl: https://api.openai.com/v1
        asrModel: whisper-1
        asrApiKeyEnv: DSH_KNOWLEDGE_ASR_API_KEY
```

## 隐私与限制

- 本地文本资料默认只写入你的 JSON 文件，不会自动联网搜索知识。
- 启用 OCR/ASR 后，用户明确提交的媒体内容会发送到配置的模型服务端点。
- 插件不会把存储的 API Key 交给模型；Key 只在 Host 发起指定服务请求时使用。
- 资料不足时拒答是刻意设计的学习证据约束，不是故障。
- 本地 JSON 不适合多人、海量资料或严格权限管理；这些需求应使用项目 RAG。

## 开发验证

```powershell
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm test
```

## 许可证

[MIT](LICENSE)
