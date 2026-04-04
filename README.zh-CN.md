# obsidianRAG

obsidianRAG 是一个面向 Windows 的 Obsidian 插件加 Python 后端，用于对整个 Vault 进行 RAG 问答。

这个项目现在已经从“只有本地路径”的实现，升级成了“provider 可切换、索引支持 realtime 或 batch、检索链路更适合 Obsidian / daily notes”的架构。

当前支持：

- Chat provider：`ollama`、`openai-compatible`
- Embedding provider：`sentence-transformers`、`vllm`、`dashscope`
- Rerank provider：`vllm`、`dashscope`
- 索引模式：`realtime`、`batch`

## 当前架构

- Obsidian 插件
  - 右侧边栏聊天界面
  - provider 配置页
  - provider test 按钮
  - 重建索引、批量状态轮询、取消批量任务
- Python 后端
  - Markdown 文档加载与元数据提取
  - 结构化切片
  - embedding / rerank provider 工厂
  - realtime 索引与 DashScope batch 索引
  - 分组检索与 token budget 上下文组装
- 本地数据目录
  - 向量库：`.obsidian/plugins/obsidianRAG/data/vector_db`
  - 索引任务：`.obsidian/plugins/obsidianRAG/data/index_jobs`
  - 会话数据：`.obsidian/plugins/obsidianRAG/data/sessions`
  - 导出的聊天记录：`AI Chats/`

## 当前检索链路

当前检索流程为：

1. 实时 query embedding
2. chunk 级向量召回
3. neighbor expansion
4. daily notes 的可选 temporal expansion
5. same-note local grouping
6. group rerank
7. 在 token budget 下组装最终上下文
8. 送入 chat 模型生成回答

这已经替代了旧的“命中一个 chunk 就整篇回填”的默认逻辑。

## Provider 支持

### Chat

- `ollama`
- `openai-compatible`

### Embedding

- `sentence-transformers`
- `vllm`
- `dashscope`

### Rerank

- `vllm`
- `dashscope`

### Batch 索引

当前 batch 索引支持：

- provider：`dashscope`
- 用途：仅用于文档 embedding / 索引
- query embedding 仍然始终是实时

## 后端启动

1. 创建 Python 环境
2. 安装依赖：

```powershell
pip install -r requirements.txt
```

3. 启动后端：

```powershell
cd backend
python server.py
```

常用环境变量：

- `OBSIDIAN_RAG_OLLAMA_HOST`
- `OBSIDIAN_RAG_PORT`

现在大部分 provider / model / batch / retrieval 设置，已经改为在 Obsidian 插件设置页中配置，而不是靠环境变量。

## 插件构建

1. 安装 Node.js
2. 安装前端依赖：

```powershell
npm install
```

3. 构建插件：

```powershell
npm run build
```

4. 将以下文件复制到你的 Vault 插件目录：

- `main.js`
- `manifest.json`
- `styles.css`

目标目录：

```text
<vault>/.obsidian/plugins/obsidianRAG/
```

## 设置页分组

设置页现在分为：

1. Backend
2. Chat
3. Embedding
4. Embedding Batch
5. Rerank
6. Retrieval
7. UI / Behavior

你可以配置：

- 后端地址
- chat provider / base URL / API key / model
- embedding provider / base URL / API key / model / dimensions / encoding
- batch 索引相关参数
- rerank provider / base URL / API key / model
- retrieval 参数，例如 chunk 大小、neighbor window、temporal expansion、final context token budget

## Batch 索引说明

Batch 索引只用于文档 embedding。

推荐配置方式：

- `Embedding Provider = dashscope`
- `Enable Embedding Batch = on`
- `Indexing Mode = batch`

当前 batch 行为：

- 创建本地 batch job 记录
- 生成并上传 JSONL
- 创建 DashScope batch 任务
- 轮询状态
- 下载结果
- 对失败行做实时补偿
- 将结果写回本地向量库

## 索引重建行为

后端会保存索引元数据，并判断当前是否需要重建索引。

典型重建原因包括：

- embedding provider 改变
- embedding model 改变
- embedding dimensions 改变
- embedding encoding format 改变
- chunk 参数改变
- prefix rule version 改变
- index version 改变
- 源文件变化

如果你是从旧版本升级过来，建议直接重建索引，不要继续复用旧索引。

## 主要 API

核心接口包括：

- `POST /status`
- `POST /chat`
- `POST /chat/stream`
- `POST /index/build`
- `POST /index/build/status`
- `POST /index/build/cancel`
- `POST /provider/test/chat`
- `POST /provider/test/embedding`
- `POST /provider/test/rerank`
- `POST /provider/test/batch-embedding`

## 测试

当前自动化测试已经覆盖：

- 文档元数据提取
- 结构化切片
- DashScope 序列化
- retrieval helper
- batch 结果回填和失败补偿
- 重建原因判断

运行后端测试：

```powershell
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

运行 TypeScript 检查：

```powershell
npx tsc --noEmit
```

构建插件：

```powershell
npm run build
```

## 项目文档

建议优先阅读：

- [主规范](docs/obsidianRAG_master_development_spec.md)
- [升级交接文档](docs/obsidianRAG_upgrade_handoff_2026-04-04.md)
- [集成测试矩阵](docs/obsidianRAG_integration_test_matrix_2026-04-04.md)
- [手工验收模板](docs/obsidianRAG_manual_acceptance_record_template.md)
- [完整复盘文档](docs/obsidianRAG_final_retro_2026-04-04.md)

## 仍然需要手工验证的部分

即使代码和自动化测试已经补强，以下内容仍建议你手工验证：

- 真实 Vault 上的检索效果
- 真实 DashScope 账号与网络环境
- daily notes 问题质量
- Obsidian 内 source 点击打开原笔记的体验
- 设置页和状态栏的最终中文文案体验
