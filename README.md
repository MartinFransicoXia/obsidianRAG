# obsidianRAG

obsidianRAG is a Windows-first Obsidian plugin plus local Python backend for vault-wide RAG chat.

## Architecture

- Obsidian plugin: right sidebar chat UI, settings, commands
- Python backend: indexing, embeddings, vector search, session storage, Ollama calls
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
- `OBSIDIAN_RAG_EMBEDDING_MODEL` default: `BAAI/bge-small-zh-v1.5`
- `OBSIDIAN_RAG_PORT` default: `8765`

The embedding model is cached locally after the first successful download, so later index rebuilds do not need to download it again unless the cache is removed or the model changes.

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
- Retrieval uses a similarity threshold and a max-results cap.
- Vault changes are detected at startup via a manifest comparison and the UI suggests rebuilding.
- Sessions are stored live in plugin data and exported to Markdown when you click `End` or `New`.

## Next likely improvements

- Stream responses from Ollama into the sidebar
- Incremental indexing instead of full rebuilds
- Better conversation summarization for longer sessions
- Richer source previews and click-through navigation
