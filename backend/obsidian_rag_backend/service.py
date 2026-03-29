from __future__ import annotations

import json
from datetime import datetime
from typing import Dict, Iterator, List

from .config import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_FINAL_NOTE_COUNT,
    DEFAULT_MAX_RESULTS,
    DEFAULT_MIN_CHUNK_SIZE,
    DEFAULT_RERANK_API_BASE,
    DEFAULT_RERANK_CANDIDATES,
    DEFAULT_RERANK_MODEL,
    DEFAULT_RETRIEVAL_LIMIT,
    DEFAULT_THRESHOLD,
    DEFAULT_EMBEDDING_API_BASE,
    DEFAULT_EMBEDDING_BACKEND,
    build_index_signature,
    ensure_vault_dirs,
    MAX_RERANK_CANDIDATES,
    MAX_RETRIEVAL_LIMIT,
    resolve_vault_paths,
)
from .document_loader import VaultDocumentLoader
from .embedder import LocalEmbedder
from .models import ChatResult, NoteContext, SearchHit, SessionMessage
from .ollama_client import OllamaClient
from .openai_compatible_client import OpenAICompatibleClient
from .reranker import VLLMReranker
from .session_store import SessionStore
from .splitter import TextSplitter
from .vector_store import VectorStore


class ObsidianRAGService:
    def __init__(
        self,
        embedding_model: str,
        ollama_host: str,
        collection_name: str = "obsidianRAG",
        embedding_backend: str = DEFAULT_EMBEDDING_BACKEND,
        embedding_api_base: str = DEFAULT_EMBEDDING_API_BASE,
        rerank_model: str = DEFAULT_RERANK_MODEL,
        rerank_api_base: str = DEFAULT_RERANK_API_BASE,
    ):
        self.embedding_model = embedding_model
        self.collection_name = collection_name
        self.embedder = LocalEmbedder(
            model_name=embedding_model,
            backend=embedding_backend,
            api_base=embedding_api_base,
        )
        self.rerank_model = rerank_model
        self.reranker = VLLMReranker(rerank_model, rerank_api_base)
        self.default_ollama_host = ollama_host

    def _settings_payload(self) -> Dict[str, object]:
        return {
            "embedding_model": self.embedding_model,
            "rerank_model": self.rerank_model,
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
        try:
            embedding_healthy = self.embedder.health()
        except Exception:
            embedding_healthy = False
        try:
            rerank_healthy = self.reranker.health()
        except Exception:
            rerank_healthy = False

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
            "embedding_healthy": embedding_healthy,
            "rerank_model": self.rerank_model,
            "rerank_healthy": rerank_healthy,
        }

    def build_index(self, vault_path: str) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        documents = loader.load_documents()
        splitter = TextSplitter(DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_MIN_CHUNK_SIZE)
        chunks = splitter.split_documents(documents)
        if chunks:
            max_chunk_length = max(len(chunk.content) for chunk in chunks)
            top_chunk_lengths = sorted(
                ((len(chunk.content), chunk.chunk_id) for chunk in chunks),
                reverse=True,
            )[:5]
            print(f"[obsidianRAG] build_index chunk_count={len(chunks)} max_chunk_length={max_chunk_length}")
            print(f"[obsidianRAG] build_index top_chunks={top_chunk_lengths}")
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

    def _load_note_contexts(
        self,
        vault_path: str,
        hits: List[SearchHit],
        final_note_count: int,
    ) -> tuple[List[NoteContext], List[dict]]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        note_contexts: List[NoteContext] = []
        source_payload: List[dict] = []
        seen_paths: set[str] = set()
        for hit in hits:
            relative_path = str(hit.metadata.get("relative_path", "")).strip()
            if not relative_path or relative_path in seen_paths:
                continue
            note = loader.load_note(relative_path)
            seen_paths.add(relative_path)
            note_contexts.append(
                NoteContext(
                    relative_path=relative_path,
                    filepath=str(note.metadata.get("filepath", "")),
                    content=note.content,
                    similarity=hit.similarity,
                    chunk_id=hit.chunk_id,
                    rerank_score=hit.rerank_score,
                )
            )
            source_payload.append(
                {
                    "relative_path": relative_path,
                    "filepath": note.metadata.get("filepath"),
                    "similarity": hit.similarity,
                    "rerank_score": hit.rerank_score,
                    "chunk_id": hit.chunk_id,
                }
            )
            if len(note_contexts) >= final_note_count:
                break
        return note_contexts, source_payload

    def retrieve_context(
        self,
        vault_path: str,
        query: str,
        threshold: float = DEFAULT_THRESHOLD,
        max_results: int = DEFAULT_MAX_RESULTS,
        retrieval_limit: int = DEFAULT_RETRIEVAL_LIMIT,
        rerank_candidates: int = DEFAULT_RERANK_CANDIDATES,
        final_note_count: int = DEFAULT_FINAL_NOTE_COUNT,
    ) -> tuple[List[NoteContext], List[dict]]:
        initial_limit = max(max_results, min(retrieval_limit, MAX_RETRIEVAL_LIMIT))
        rerank_limit = min(max(rerank_candidates, 1), MAX_RERANK_CANDIDATES)
        final_limit = max(1, final_note_count)
        hits = self.search(vault_path, query, threshold=threshold, max_results=initial_limit)
        rerank_input = hits[:rerank_limit]
        try:
            reranked_hits = self.reranker.rerank(query, rerank_input, top_k=rerank_limit)
        except Exception:
            reranked_hits = rerank_input
        return self._load_note_contexts(vault_path, reranked_hits, final_limit)

    def _prepare_chat(
        self,
        vault_path: str,
        query: str,
        provider: str,
        api_base: str | None,
        api_key: str | None,
        threshold: float,
        max_results: int,
        retrieval_limit: int,
        rerank_candidates: int,
        final_note_count: int,
    ) -> tuple[object, str, List[SessionMessage], List[NoteContext], List[dict], SessionStore]:
        _, client = self._build_client(provider, api_base, api_key)
        note_contexts, source_payload = self.retrieve_context(
            vault_path=vault_path,
            query=query,
            threshold=threshold,
            max_results=max_results,
            retrieval_limit=retrieval_limit,
            rerank_candidates=rerank_candidates,
            final_note_count=final_note_count,
        )
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        sessions = SessionStore(vault_paths)
        session_id, history = sessions.load_active()
        history.append(SessionMessage(role="user", content=query))
        return client, session_id, history, note_contexts, source_payload, sessions

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
        retrieval_limit: int = DEFAULT_RETRIEVAL_LIMIT,
        rerank_candidates: int = DEFAULT_RERANK_CANDIDATES,
        final_note_count: int = DEFAULT_FINAL_NOTE_COUNT,
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
            retrieval_limit=retrieval_limit,
            rerank_candidates=rerank_candidates,
            final_note_count=final_note_count,
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
        retrieval_limit: int = DEFAULT_RETRIEVAL_LIMIT,
        rerank_candidates: int = DEFAULT_RERANK_CANDIDATES,
        final_note_count: int = DEFAULT_FINAL_NOTE_COUNT,
    ) -> Iterator[dict]:
        client, session_id, history, hits, source_payload, sessions = self._prepare_chat(
            vault_path=vault_path,
            query=query,
            provider=provider,
            api_base=api_base,
            api_key=api_key,
            threshold=threshold,
            max_results=max_results,
            retrieval_limit=retrieval_limit,
            rerank_candidates=rerank_candidates,
            final_note_count=final_note_count,
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
