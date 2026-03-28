# obsidianRAG

obsidianRAG 是一个面向 Windows 的 Obsidian 插件，配合本地 Python 后端，为整个库提供 RAG 问答能力。

## 架构概览

- Obsidian 插件：右侧边栏聊天界面、设置项、命令入口
- Python 后端：索引构建、向量化、向量检索、重排、整篇笔记扩展、会话存储、Ollama/OpenAI-compatible 聊天调用
- 向量数据库目录：`.obsidian/plugins/obsidianRAG/data/vector_db`
- 当前会话目录：`.obsidian/plugins/obsidianRAG/data/sessions`
- 导出的聊天记录目录：`AI Chats/`

## 后端安装

1. 创建 Python 虚拟环境。
2. 安装依赖：

```powershell
pip install -r requirements.txt
```

3. 手动启动后端：

```powershell
cd backend
python server.py
```

## 后端环境变量

- `OBSIDIAN_RAG_OLLAMA_HOST`
  默认值：`http://127.0.0.1:11434`
- `OBSIDIAN_RAG_EMBEDDING_MODEL`
  默认值：`Qwen/Qwen3-Embedding-8B`
- `OBSIDIAN_RAG_EMBEDDING_BACKEND`
  默认值：`vllm`
- `OBSIDIAN_RAG_EMBEDDING_API_BASE`
  默认值：`http://127.0.0.1:8001/v1`
- `OBSIDIAN_RAG_RERANK_MODEL`
  默认值：`Qwen/Qwen3-Reranker-4B`
- `OBSIDIAN_RAG_RERANK_API_BASE`
  默认值：`http://127.0.0.1:8002`
- `OBSIDIAN_RAG_PORT`
  默认值：`8765`

推荐的本地服务拆分方式：

- embedding 服务：使用 `vLLM`，地址 `http://127.0.0.1:8001/v1`
- rerank 服务：使用 `vLLM` 的 score 接口，地址 `http://127.0.0.1:8002`
- chat 服务：继续沿用现有 Ollama 或 OpenAI-compatible 路径

## GPU 与模型缓存

- 如果机器上有多张 NVIDIA 显卡，建议在启动 `vLLM` 前显式设置 `CUDA_VISIBLE_DEVICES`
- 为了避免每次重启都重新下载模型，建议把 `HF_HOME` 指向固定目录

示例：

```powershell
$env:CUDA_VISIBLE_DEVICES="0"
$env:HF_HOME="F:\obsidianRAG\models_cache\hf"
```

只要缓存目录还在，模型文件通常不会重复下载。

## 插件安装

1. 安装 Node.js。
2. 安装插件依赖：

```powershell
npm install
```

3. 构建插件：

```powershell
npm run build
```

4. 将以下文件复制到你的 vault 插件目录：

- `main.js`
- `manifest.json`
- `styles.css`

目标目录：

```text
<vault>/.obsidian/plugins/obsidianRAG/
```

## 当前检索行为

每次提问都会重新执行一次检索。当前检索链路为：

1. 在 Chroma 中做向量召回
2. 对召回候选做 rerank
3. 按笔记路径去重
4. 将命中的片段扩展为整篇笔记
5. 将最终选中的笔记集合交给聊天模型

这样做的目标是尽量提升相关性，同时减少同一篇笔记重复命中造成的上下文浪费。

## 默认检索参数

- `threshold`：`0.72`
- `retrieval_limit`：默认 `30`，最大 `50`
- `rerank_candidates`：默认 `15`，最大 `30`
- `final_note_count`：默认 `5`

默认情况下，最终只会把 `5` 篇去重后的整篇笔记送给聊天模型。

## API 说明

`POST /chat` 和 `POST /chat/stream` 现在支持以下检索参数：

- `threshold`
- `max_results`
- `retrieval_limit`
- `rerank_candidates`
- `final_note_count`

`POST /status` 会额外返回：

- `embedding_model`
- `embedding_healthy`
- `rerank_model`
- `rerank_healthy`

## 补充说明

- 后端仍然保留了原来的 `sentence-transformers` 本地 embedding 作为后备路径
- 如果 `Qwen3-Embedding-8B` 在当前显卡上不稳定，可以只替换 `OBSIDIAN_RAG_EMBEDDING_MODEL`，不需要改动主检索流程
- 如果 rerank 服务暂时不可用，后端会退回向量召回顺序，而不是让整个聊天请求直接失败
