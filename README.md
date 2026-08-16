# 项目知识复习插件

一个面向 DeepSeek Harness（DSH）的中文知识复习插件。它将知识类提问严格绑定到指定项目的私有 RAG：有证据才回答；资料缺失时不猜测、不东拼西凑，而是提醒用户提供有权用于学习的公开视频 URL。视频完成 RAG 索引后，再依据新的 evidence 回答。

## 解决的问题

通用模型在回答知识问题时容易混入训练语料、常识或不相关内容。这个插件将“解释 / 学习 / 复习知识”变成一个可审计流程：

1. 先调用项目 RAG 检索。
2. 只有 `ANSWERED` 且存在 `evidences` 时才能回答。
3. 资料没有足够证据、资料仍在处理或 RAG 不可用时，明确拒答。
4. 用户提供并确认可用于学习的公开视频 URL 后，插件调用项目视频入库接口创建索引任务。
5. 索引完成后重新检索；仍缺证据则继续拒答。

插件不替代项目的 RAG。它复用项目既有的递归切块、Multi-Query、BM25、pgvector、RRF/RAG-Fusion、重排和 evidence guard。

## 前置条件

- DSH Web profile。
- 项目 Python API 正在运行，默认地址为 `http://127.0.0.1:8090`。
- 通过环境变量 `PROJECT_RAG_BEARER_TOKEN` 注入当前项目登录会话的 Bearer Token；该值绝不能提交到仓库或作为工具参数提供给模型。
- 需要使用视频时，项目已配置对应公开平台的视频转写能力，并且用户对该 URL 具有学习使用授权。

## 安装

从 GitHub 安装到 Web profile：

```powershell
dsh plugin --profile web add github:HeWhenJay/dsh-project-knowledge-review
```

本地开发安装：

```powershell
dsh plugin --profile web add .\tools\dsh-project-knowledge-review
```

安装后刷新现有 DSH Web 页面。该插件不会自动启动 RAG 服务。

## 配置

插件默认配置如下：

```yaml
- insert:
    - id: project-knowledge-review
      name: dsh-project-knowledge-review
      config:
        ragBaseUrl: http://127.0.0.1:8090
        projectName: 学迹智配 Agent
        authorizationToken: '' # 建议留空，改用环境变量 PROJECT_RAG_BEARER_TOKEN
        requestTimeoutMs: 120000
```

在 DSH profile 的 `cordis.patch.yml` 中覆盖即可修改 RAG 地址、项目名称和超时。认证令牌优先通过启动 DSH 的环境变量设置：`$env:PROJECT_RAG_BEARER_TOKEN='你的登录令牌'`。如果环境变量和配置均为空，插件会安全拒答，不会绕过项目的用户资料隔离。

## 供模型调用的工具

- `project_knowledge_search`：从项目私有 RAG 检索知识问题。证据不足时返回结构化 `REFUSED`。
- `project_knowledge_import_video`：把用户已确认可用于学习的公开视频 URL 提交给项目 RAG；只入队，不伪造“已学会”或“已完成索引”。

## 隐私与边界

- 插件仅请求配置的项目 RAG API，不会自行联网搜索知识答案。
- 视频仅在用户提供 URL 并确认其可用于学习后才会提交给项目服务。
- 项目 API 的认证、用户隔离和资料可见范围仍由项目后端负责。
- 这是一个严格证据回答模式，不适合需要通用百科、新闻或开放网络检索的提问。

## 开发验证

```powershell
pnpm install
pnpm run typecheck
pnpm run build
```

## 许可证

[MIT](LICENSE)
