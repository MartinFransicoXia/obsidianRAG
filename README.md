# obsidianRAG

obsidianRAG is a Windows-first Obsidian plugin plus Python backend for vault-wide RAG chat.

The project has been upgraded from a local-only path into a provider-aware architecture:

- chat provider can use `ollama` or `openai-compatible`
- embedding provider can use `sentence-transformers`, `vllm`, or `dashscope`
- rerank provider can use `vllm` or `dashscope`
- indexing can run in `realtime` or `batch` mode
- retrieval is no longer based on naive full-note expansion by default

## Current Architecture

- Obsidian plugin
  - right sidebar chat UI
  - provider-aware settings
  - provider test actions
  - index rebuild / batch polling / cancel controls
- Python backend
  - document loading and metadata extraction
  - structured chunking
  - embedding / rerank provider factory
  - realtime indexing and DashScope batch indexing
  - retrieval pipeline with grouping and token-budget packing
- Local data
  - vector DB: `.obsidian/plugins/obsidianRAG/data/vector_db`
  - index jobs: `.obsidian/plugins/obsidianRAG/data/index_jobs`
  - sessions: `.obsidian/plugins/obsidianRAG/data/sessions`
  - exported chats: `AI Chats/`

## Retrieval Pipeline

The current retrieval flow is:

1. realtime query embedding
2. vector recall on chunks
3. neighbor expansion
4. optional temporal expansion for daily notes
5. same-note local grouping
6. group rerank
7. final context packing under a token budget
8. chat generation

This replaces the older behavior of "hit one chunk, then expand to the whole note".

## Provider Support

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

### Batch Indexing

Current batch indexing support is:

- provider: `dashscope`
- usage: indexing only
- query embedding remains realtime

## Backend Setup

1. Create a Python environment.
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Start the backend:

```powershell
cd backend
python server.py
```

Useful environment variables:

- `OBSIDIAN_RAG_OLLAMA_HOST`
- `OBSIDIAN_RAG_PORT`

Most runtime model/provider settings are now configured from the Obsidian plugin UI rather than environment variables.

## Plugin Setup

1. Install Node.js.
2. Install frontend dependencies:

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

## Settings Overview

The settings tab is organized into:

1. Backend
2. Chat
3. Embedding
4. Embedding Batch
5. Rerank
6. Retrieval
7. UI / Behavior

You can configure:

- backend URL
- chat provider / base URL / API key / model
- embedding provider / base URL / API key / model / dimensions / encoding
- batch indexing settings
- rerank provider / base URL / API key / model
- retrieval knobs such as chunk size, neighbor window, temporal expansion, and final context token budget

## Batch Indexing Notes

Batch indexing is intended for document embeddings only.

Expected configuration:

- `Embedding Provider = dashscope`
- `Enable Embedding Batch = on`
- `Indexing Mode = batch`

Current batch behavior:

- create local batch job record
- upload JSONL
- create DashScope batch job
- poll status
- download output
- compensate failed rows with realtime embedding
- write vectors back to the local vector store

## Rebuild Behavior

The backend stores index metadata and can report when a rebuild is needed.

Typical rebuild reasons include:

- embedding provider changed
- embedding model changed
- embedding dimensions changed
- embedding encoding format changed
- chunk settings changed
- prefix rule version changed
- index version changed
- source files changed

If you upgraded from an older version of the project, you should assume the old index is not compatible and rebuild it.

## API Endpoints

Main endpoints:

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

## Testing

Current automated coverage includes:

- document metadata extraction
- structured chunking
- DashScope serialization
- retrieval helpers
- batch result write-back and compensation
- rebuild-reason detection

Run backend tests:

```powershell
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

Type-check the plugin:

```powershell
npx tsc --noEmit
```

Build the plugin:

```powershell
npm run build
```

## Project Docs

Recommended docs to read:

- [Master development spec](docs/obsidianRAG_master_development_spec.md)
- [Upgrade handoff](docs/obsidianRAG_upgrade_handoff_2026-04-04.md)
- [Integration test matrix](docs/obsidianRAG_integration_test_matrix_2026-04-04.md)
- [Manual acceptance template](docs/obsidianRAG_manual_acceptance_record_template.md)
- [Final retrofit / review](docs/obsidianRAG_final_retro_2026-04-04.md)

## What Still Requires Manual Verification

Code and tests can cover a lot, but you should still manually verify:

- real Vault retrieval quality
- real DashScope credentials and network behavior
- daily-note question quality
- source click-through behavior inside Obsidian
- final UI wording and workflow
