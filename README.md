# obsidianRAG

obsidianRAG is a Windows-first Obsidian plugin plus local Python backend for vault-wide RAG chat.

## Architecture

- Obsidian plugin: right sidebar chat UI, settings, commands
- Python backend: indexing, embeddings, vector search, reranking, full-note expansion, session storage, Ollama/OpenAI-compatible chat calls
- Vector database: `.obsidian/plugins/obsidianRAG/data/vector_db`
- Active session data: `.obsidian/plugins/obsidianRAG/data/sessions`
- Exported chats: `AI Chats/`

## Backend setup

1. Create a Python environment.
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Start the backend manually:

```powershell
cd backend
python server.py
```

Environment variables:

- `OBSIDIAN_RAG_OLLAMA_HOST` default: `http://127.0.0.1:11434`
- `OBSIDIAN_RAG_EMBEDDING_MODEL` default: `Qwen/Qwen3-Embedding-8B`
- `OBSIDIAN_RAG_EMBEDDING_BACKEND` default: `vllm`
- `OBSIDIAN_RAG_EMBEDDING_API_BASE` default: `http://127.0.0.1:8001/v1`
- `OBSIDIAN_RAG_RERANK_MODEL` default: `Qwen/Qwen3-Reranker-4B`
- `OBSIDIAN_RAG_RERANK_API_BASE` default: `http://127.0.0.1:8002`
- `OBSIDIAN_RAG_PORT` default: `8765`

Recommended local serving layout:

- Embedding service: `vLLM` on `http://127.0.0.1:8001/v1`
- Rerank service: `vLLM` score endpoint on `http://127.0.0.1:8002`
- Chat service: keep using the existing Ollama or OpenAI-compatible provider path

GPU and cache notes:

- If you have multiple NVIDIA GPUs, set `CUDA_VISIBLE_DEVICES` before starting each `vLLM` server.
- To keep downloaded model weights between restarts, point `HF_HOME` to a persistent folder.
- Example:

```powershell
$env:CUDA_VISIBLE_DEVICES="0"
$env:HF_HOME="F:\obsidianRAG\models_cache\hf"
```

## Plugin setup

1. Install Node.js.
2. Install plugin dependencies:

```powershell
npm install
```

3. Build the plugin:

```powershell
npm run build
```

4. Copy these files into your vault plugin directory:

- `main.js`
- `manifest.json`
- `styles.css`

Target directory:

```text
<vault>/.obsidian/plugins/obsidianRAG/
```

## Current behavior

- Every question triggers a fresh retrieval pass.
- Retrieval is now a multi-stage pipeline:
  1. vector recall from Chroma
  2. rerank on the top candidates
  3. deduplicate by note path
  4. expand each selected hit to the full note
  5. send the final note set to the chat provider
- Retrieval uses a similarity threshold plus configurable recall and rerank candidate limits.
- Vault changes are detected at startup via a manifest comparison and the UI suggests rebuilding.
- Sessions are stored live in plugin data and exported to Markdown when you click `End` or `New`.

Default retrieval values:

- `threshold`: `0.72`
- `retrieval_limit`: `30` with an enforced max of `50`
- `rerank_candidates`: `15` with an enforced max of `30`
- `final_note_count`: `5`

## API notes

`POST /chat` and `POST /chat/stream` now accept these retrieval fields:

- `threshold`
- `max_results`
- `retrieval_limit`
- `rerank_candidates`
- `final_note_count`

`POST /status` also reports:

- `embedding_model`
- `embedding_healthy`
- `rerank_model`
- `rerank_healthy`

## Notes

- The backend still keeps the previous local sentence-transformers embedding path as a fallback.
- If your GPU cannot reliably host `Qwen3-Embedding-8B`, switch `OBSIDIAN_RAG_EMBEDDING_MODEL` to a smaller model without changing the rest of the backend flow.
- If the rerank service is unavailable, the backend falls back to the vector-recall ordering instead of failing the whole chat request.
