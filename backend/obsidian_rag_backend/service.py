from __future__ import annotations

import json
from datetime import datetime
from typing import Dict, Iterator, List

from .config import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_MAX_RESULTS,
    DEFAULT_MIN_CHUNK_SIZE,
    DEFAULT_THRESHOLD,
    build_index_signature,
    ensure_vault_dirs,
    resolve_vault_paths,
)
from .document_loader import VaultDocumentLoader
from .embedder import LocalEmbedder
from .models import ChatResult, SearchHit, SessionMessage
from .ollama_client import OllamaClient
from .openai_compatible_client import OpenAICompatibleClient
from .session_store import SessionStore
from .splitter import TextSplitter
from .vector_store import VectorStore


class ObsidianRAGService:
    def __init__(self, embedding_model: str, ollama_host: str, collection_name: str = "obsidianRAG"):
        self.embedding_model = embedding_model
        self.collection_name = collection_name
        self.embedder = LocalEmbedder(embedding_model)
        self.default_ollama_host = ollama_host

    def _settings_payload(self) -> Dict[str, object]:
        return {
            "embedding_model": self.embedding_model,
            "chunk_size": DEFAULT_CHUNK_SIZE,
            "chunk_overlap": DEFAULT_CHUNK_OVERLAP,
            "min_chunk_size": DEFAULT_MIN_CHUNK_SIZE,
            "collection_name": self.collection_name,
        }

    def _build_client(self, provider: str, api_base: str | None, api_key: str | None):
        normalized = (provider or "ollama").strip().lower()
        if normalized == "ollama":
            host = (api_base or self.default_ollama_host).strip() or self.default_ollama_host
            return "ollama", OllamaClient(host)
        if normalized in {"openai-compatible", "openai_compatible", "openai"}:
            if not api_base or not api_base.strip():
                raise ValueError("OpenAI-compatible provider requires a base URL.")
            return "openai-compatible", OpenAICompatibleClient(api_base.strip(), api_key or "")
        raise ValueError(f"Unsupported provider '{provider}'.")

    def get_status(
        self,
        vault_path: str,
        provider: str = "ollama",
        api_base: str | None = None,
        api_key: str | None = None,
    ) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        entries = loader.list_entries()
        current_signature = build_index_signature(entries, self._settings_payload())

        if vault_paths.manifest_path.exists():
            manifest = json.loads(vault_paths.manifest_path.read_text(encoding="utf-8"))
        else:
            manifest = {}

        vector_store = VectorStore(vault_paths, self.collection_name)
        try:
            vector_count = vector_store.count()
        except Exception:
            vector_count = 0

        try:
            provider_name, client = self._build_client(provider, api_base, api_key)
            llm_healthy = client.health()
        except Exception:
            provider_name = (provider or "ollama").strip().lower() or "ollama"
            llm_healthy = False

        return {
            "vault_path": str(vault_paths.vault_root),
            "indexed_files": len(entries),
            "vector_count": vector_count,
            "needs_rebuild": manifest.get("signature") != current_signature or vector_count == 0,
            "last_indexed_at": manifest.get("indexed_at"),
            "ollama_healthy": llm_healthy if provider_name == "ollama" else False,
            "llm_provider": provider_name,
            "llm_healthy": llm_healthy,
            "embedding_model": self.embedding_model,
        }

    def build_index(self, vault_path: str) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        documents = loader.load_documents()
        splitter = TextSplitter(DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_MIN_CHUNK_SIZE)
        chunks = splitter.split_documents(documents)
        embeddings = self.embedder.embed_texts([chunk.content for chunk in chunks]) if chunks else []

        store = VectorStore(vault_paths, self.collection_name)
        store.reset_collection()
        if chunks:
            store.add_chunks(chunks, embeddings)

        entries = loader.list_entries()
        manifest = {
            "indexed_at": datetime.now().isoformat(timespec="seconds"),
            "signature": build_index_signature(entries, self._settings_payload()),
            "file_count": len(entries),
            "chunk_count": len(chunks),
            "embedding_model": self.embedding_model,
        }
        vault_paths.manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return manifest

    def search(self, vault_path: str, query: str, threshold: float = DEFAULT_THRESHOLD, max_results: int = DEFAULT_MAX_RESULTS) -> List[SearchHit]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        store = VectorStore(vault_paths, self.collection_name)
        query_embedding = self.embedder.embed_query(query)
        return store.search(query_embedding, threshold=threshold, max_results=max_results)

    def _prepare_chat(
        self,
        vault_path: str,
        query: str,
        provider: str,
        api_base: str | None,
        api_key: str | None,
        threshold: float,
        max_results: int,
    ) -> tuple[object, str, List[SessionMessage], List[SearchHit], List[dict], SessionStore]:
        _, client = self._build_client(provider, api_base, api_key)
        hits = self.search(vault_path, query, threshold=threshold, max_results=max_results)
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        sessions = SessionStore(vault_paths)
        session_id, history = sessions.load_active()
        history.append(SessionMessage(role="user", content=query))
        source_payload = [
            {
                "relative_path": hit.metadata.get("relative_path"),
                "filepath": hit.metadata.get("filepath"),
                "similarity": hit.similarity,
                "chunk_id": hit.chunk_id,
            }
            for hit in hits
        ]
        return client, session_id, history, hits, source_payload, sessions

    def _finalize_chat(
        self,
        sessions: SessionStore,
        session_id: str,
        history: List[SessionMessage],
        answer: str,
        thinking: str,
        source_payload: List[dict],
    ) -> ChatResult:
        history.append(SessionMessage(role="assistant", content=answer, thinking=thinking, sources=source_payload))
        sessions.save_active(session_id, history)
        return ChatResult(session_id=session_id, answer=answer, thinking=thinking, sources=source_payload)

    def chat(
        self,
        vault_path: str,
        query: str,
        model: str,
        provider: str = "ollama",
        api_base: str | None = None,
        api_key: str | None = None,
        enable_thinking: bool = False,
        threshold: float = DEFAULT_THRESHOLD,
        max_results: int = DEFAULT_MAX_RESULTS,
    ) -> ChatResult:
        final_result: ChatResult | None = None
        for event in self.stream_chat(
            vault_path=vault_path,
            query=query,
            model=model,
            provider=provider,
            api_base=api_base,
            api_key=api_key,
            enable_thinking=enable_thinking,
            threshold=threshold,
            max_results=max_results,
        ):
            if event["type"] == "done":
                final_result = ChatResult(
                    session_id=event["session_id"],
                    answer=event["answer"],
                    thinking=event.get("thinking", ""),
                    sources=event["sources"],
                )
        if final_result is None:
            raise RuntimeError("Chat stream ended without a final result.")
        return final_result

    def stream_chat(
        self,
        vault_path: str,
        query: str,
        model: str,
        provider: str = "ollama",
        api_base: str | None = None,
        api_key: str | None = None,
        enable_thinking: bool = False,
        threshold: float = DEFAULT_THRESHOLD,
        max_results: int = DEFAULT_MAX_RESULTS,
    ) -> Iterator[dict]:
        client, session_id, history, hits, source_payload, sessions = self._prepare_chat(
            vault_path=vault_path,
            query=query,
            provider=provider,
            api_base=api_base,
            api_key=api_key,
            threshold=threshold,
            max_results=max_results,
        )
        yield {"type": "session", "session_id": session_id}

        answer_parts: List[str] = []
        thinking_parts: List[str] = []
        for event in client.stream_chat(
            model=model,
            query=query,
            hits=hits,
            history=history[:-1],
            enable_thinking=enable_thinking,
        ):
            if event["type"] == "thinking":
                thinking_parts.append(event["delta"])
            elif event["type"] == "content":
                answer_parts.append(event["delta"])
            yield event

        answer = "".join(answer_parts)
        thinking = "".join(thinking_parts)
        result = self._finalize_chat(
            sessions=sessions,
            session_id=session_id,
            history=history,
            answer=answer,
            thinking=thinking,
            source_payload=source_payload,
        )
        yield {"type": "sources", "sources": source_payload}
        yield {
            "type": "done",
            "session_id": result.session_id,
            "answer": result.answer,
            "thinking": result.thinking,
            "sources": result.sources,
        }

    def end_session(self, vault_path: str) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        sessions = SessionStore(vault_paths)
        session_id, history = sessions.load_active()
        if not history:
            return {"session_id": session_id, "exported_path": None}
        exported_path = sessions.end_session(session_id, history)
        return {"session_id": session_id, "exported_path": exported_path}
