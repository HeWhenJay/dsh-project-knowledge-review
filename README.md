# dsh-project-knowledge-review

一个面向中文 DSH 用户的独立本地知识复习插件。

它把文字资料、OCR 图片文字和 ASR 音频转写保存到 DSH 用户目录，在回答知识问题前先检索本地 evidence；严格模式下没有足够证据就明确拒答。插件不需要数据库、向量模型、账号登录或项目 Token，也不会连接、安装或识别任何外部项目。

## 主要能力

- 零配置本地资料库：首次使用时自动创建 v2 存储。
- Evidence-first 问答：先检索，再根据 evidence 回答；严格模式证据不足即拒答。
- 当前 DSH 模型作答：插件只提供检索 evidence 和系统约束，最终答案仍由当前会话模型生成。
- Markdown 摘要：文字、OCR、ASR 入库后立即生成 Markdown 自动提要；也可用当前 DSH 模型回写更好的 Markdown 摘要。
- 两级分类：插件自动生成系统初分类，用户可在知识库页面建立并调整自己的二次分类。
- 一级知识库页面：侧栏点击“知识库”进入独立工作区，可查看详细摘要和详细原始内容。
- 安全 Markdown 预览：摘要与原始内容都支持渲染视图和 Markdown 源码视图；不执行 HTML 或脚本。
- 可选 OCR / ASR：默认关闭，只有用户显式开启并配置 DSH 凭据后才访问对应服务。
- 大库友好：轻量 JSONL 索引、单文档原文文件、游标分页和按需原文读取。
- v1 自动迁移：旧版整库 JSON 会迁移到 v2，并保留不可覆盖的原始备份。

## 安装

```bash
dsh plugin --profile web add dsh-project-knowledge-review
```

安装后重新启动当前 DSH Web 进程并刷新页面。插件会在 Web 设置页增加“知识复习”，并在侧栏增加“知识库”一级入口。

默认设置无需修改：

```text
回答策略：strict
资料库：~/.dsh/project-knowledge-review/knowledge.json
OCR：关闭
ASR：关闭
```

## 使用方式

### 添加文字资料

直接对 DSH 说：

```text
把下面内容加入知识库，标题是“React Hooks 笔记”：
……
```

插件调用 `project_knowledge_add_text`，返回资料 ID、Markdown 摘要、摘要来源、系统初分类和用户分类。

### 复习知识

例如：

```text
根据我的知识库解释 useEffect 的清理函数。
```

插件先调用 `project_knowledge_search`。只有检索结果包含 evidence 时，当前 DSH 模型才可基于证据回答并引用资料标题和来源。

### 查看知识库自身信息

例如：

```text
我的知识库有多少份资料？
这些资料保存在哪里？
知识库是否与当前项目共享？
```

插件调用 `project_knowledge_overview`。作用域为当前 DSH 用户的本地资料库，`sharedWithCurrentProject` 始终为 `false`。

### 浏览摘要和原始内容

点击侧栏“知识库”。入口采用与“任务看板”一致的侧栏按钮规格，并固定放在“工作区”区块之前；知识库打开后，点击任意对话、设置、任务看板、SSH、文件树或其他外部功能都会自动退出知识库，并让原点击继续生效。任务看板或 SSH 打开时点击知识库，也会在同一次点击中退出原面板并进入知识库；从知识库点击任务看板或 SSH 也能单击反向切换。

界面采用文档优先的信息架构：借鉴成熟知识产品的安静导航、舒适行宽和按需元数据，在 DSH 原生深浅色主题内保持一致体验。

- 左侧：搜索、分类和类似文档目录的资料导航。
- 中间：居中阅读画布，支持摘要 / 原始内容、渲染 / Markdown 源码。
- 右侧抽屉：按需显示资料 ID、来源、字符数、时间、系统分类、摘要来源和用户分类，默认不挤占正文。
- 窄屏：资料导航和资料信息均变为抽屉，正文使用完整可用宽度。

页面只借鉴主流文档与知识产品的信息架构，不复制第三方品牌或素材。

## 回答策略

### `strict`（默认）

- 知识问题必须先检索。
- 只有 `answerStatus=ANSWERED` 且 evidence 非空时才能回答。
- 只陈述 evidence 支持的结论。
- 没有证据时必须明确说明：`当前知识库中没有足够证据，不能回答`。
- 不使用模型记忆补齐知识结论。

### `reference`

- 仍先检索知识库。
- 允许当前模型补充通用知识。
- 必须明确区分“知识库证据”和“模型补充”。

可以在“设置 → 知识复习”中切换策略。

## 工具

插件公开以下 DSH 工具：

| 工具 | 用途 |
| --- | --- |
| `project_knowledge_overview` | 查询数量、标题、来源、存储位置、作用域和共享状态 |
| `project_knowledge_search` | 检索本地 evidence |
| `project_knowledge_add_text` | 添加用户提供或确认有权使用的文字资料 |
| `project_knowledge_update_summary` | 用当前 DSH 模型生成的 Markdown 摘要更新一份资料 |
| `project_knowledge_import_image_ocr` | 对公开图片 URL 执行 OCR 后入库 |
| `project_knowledge_import_audio_asr` | 对公开直链音频执行 ASR 后入库 |

工具名为了保持已有 DSH 会话兼容而保留 `project_knowledge_*` 前缀；这不表示插件会连接任何外部项目。

## 本地 v2 存储

默认路径：

```text
~/.dsh/project-knowledge-review/knowledge.json
```

同目录还会出现：

```text
knowledge.json                         # 常数大小 manifest
knowledge.json.index.jsonl             # 元数据与检索 token 轻量索引
knowledge.json.documents/              # 每份资料一个 JSON 原文文件
knowledge.json.categories.json         # 用户二次分类
knowledge.json.locks/                   # 多进程 ticket 锁
knowledge.json.journal.json             # 中断恢复日志，仅写入期间存在
knowledge.json.v1.backup*.json          # v1 迁移备份（如有）
```

v2 的设计目标：

- 列表和概览不加载全量原文。
- 原文按单条 ID 哈希文件名直接定位。
- 写入和元数据更新使用跨进程 ticket 锁。
- journal 中断恢复保持清单、JSONL 索引和单条原文一致。
- 单次预览、请求体和媒体文件均有大小限制。

## OCR 与 ASR

OCR / ASR 默认关闭。启用步骤：

1. 打开“设置 → 知识复习”。
2. 开启对应服务。
3. 配置 Base URL 与模型名称。
4. 将 API Key 保存到 DSH 凭据库。

安全边界：

- 只接受公开 HTTP(S) 图片 URL，或公开可直接下载的音频 URL。
- 拒绝 URL 用户信息、非 HTTP(S) 协议、本机地址和私有网络地址。
- API Key 不写入插件设置 JSON，也不会回显。
- 插件不自动处理视频网页分享页；请提供字幕文字或公开音频直链。

## 设置项

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 关闭后工具和提示词保持静默 |
| `answerPolicy` | `strict` | `strict` 或 `reference` |
| `localStorePath` | `~/.dsh/project-knowledge-review/knowledge.json` | 插件自己的本地资料库 |
| `projectName` | `我的知识库` | 用户可见名称；仅是命名，不是外部项目 |
| `requestTimeoutMs` | `120000` | OCR / ASR 请求超时 |
| `ocrEnabled` | `false` | 是否启用 OCR |
| `ocrBaseUrl` | DashScope OpenAI 兼容地址 | OCR 服务地址 |
| `ocrModel` | `qwen-vl-ocr` | OCR 模型 |
| `ocrApiKeyEnv` | `DSH_KNOWLEDGE_OCR_API_KEY` | DSH 凭据引用名 |
| `asrEnabled` | `false` | 是否启用 ASR |
| `asrBaseUrl` | OpenAI API 地址 | ASR 服务地址 |
| `asrModel` | `whisper-1` | ASR 模型 |
| `asrApiKeyEnv` | `DSH_KNOWLEDGE_ASR_API_KEY` | DSH 凭据引用名 |

## 隐私与发布边界

- 插件独立发布、独立运行、独立存储。
- 插件没有项目 URL、项目 API Key、配对码、能力文件或项目安装逻辑。
- 插件不会主动向外部项目同步资料。
- 插件摘要和分类只属于插件本地库。
- 如果个人项目希望使用这些资料，应由该项目在自己的服务端实现主动、只读同步；这不属于本插件的公共能力。

## 开发

```bash
npm install
npm test
npm run typecheck
npm pack --dry-run
```

`npm test` 会先清理并重建 `lib/`，防止删除过的旧功能残留在发布包中。

## License

MIT
