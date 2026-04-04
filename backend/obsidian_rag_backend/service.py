from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
import re
from typing import Dict, Iterator, List
from uuid import uuid4

from .config import (
    DEFAULT_CHUNK_MAX_TOKENS,
    DEFAULT_CHUNK_OVERLAP_TOKENS,
    DEFAULT_CHUNK_TARGET_TOKENS,
    DEFAULT_FINAL_CONTEXT_TOKEN_BUDGET,
    DEFAULT_FINAL_GROUP_COUNT_CAP,
    DEFAULT_FINAL_NOTE_COUNT,
    DEFAULT_GROUP_MERGE_GAP,
    DEFAULT_INDEX_VERSION,
    DEFAULT_MAX_RESULTS,
    DEFAULT_MIN_CHUNK_SIZE,
    DEFAULT_NEIGHBOR_WINDOW,
    DEFAULT_PREFIX_RULE_VERSION,
    DEFAULT_RERANK_CANDIDATES,
    DEFAULT_RETRIEVAL_LIMIT,
    DEFAULT_TEMPORAL_WINDOW_DAYS,
    MAX_RERANK_CANDIDATES,
    MAX_RETRIEVAL_LIMIT,
    build_index_signature,
    ensure_vault_dirs,
    resolve_vault_paths,
)
from .document_loader import VaultDocumentLoader
from .index_job_store import IndexJobStore
from .models import (
    BatchJobRecord,
    ChatProviderConfig,
    ChatResult,
    ContextGroup,
    EmbeddingBatchConfig,
    EmbeddingProviderConfig,
    RetrievalConfig,
    RerankProviderConfig,
    SearchHit,
    SessionMessage,
)
from .ollama_client import OllamaClient
from .openai_compatible_client import OpenAICompatibleClient
from .providers import build_batch_embedding_provider, build_embedding_provider, build_rerank_provider
from .session_store import SessionStore
from .splitter import TextSplitter, estimate_token_count
from .vector_store import VectorStore


def datetime_regex_search(query: str) -> bool:
    return bool(re.search(r"\b\d{4}[-_/.]\d{1,2}[-_/.]\d{1,2}\b", query))


def extract_entity_terms(text: str) -> list[str]:
    english_terms = re.findall(r"(?<![A-Za-z0-9_-])([A-Z][A-Za-z0-9_-]{2,})(?![A-Za-z0-9_-])", text)
    mixed_terms = re.findall(r"(?<![A-Za-z0-9_-])([a-zA-Z][a-zA-Z0-9_-]{3,})(?![A-Za-z0-9_-])", text)
    cjk_terms = re.findall(r"[\u4e00-\u9fff]{2,8}", text)
    stopwords = {
        "this", "that", "with", "from", "have", "what", "when", "where", "which",
        "最近", "这个月", "上周", "前几天", "什么", "哪些", "情况", "项目", "事情",
    }
    ordered: list[str] = []
    for term in english_terms + mixed_terms + cjk_terms:
        normalized = term.strip()
        if len(normalized) < 2:
            continue
        if normalized.lower() in stopwords or normalized in stopwords:
            continue
        if normalized not in ordered:
            ordered.append(normalized)
    return ordered[:12]


class ObsidianRAGService:
    def __init__(self, ollama_host: str, collection_name: str = "obsidianRAG"):
        self.collection_name = collection_name
        self.default_ollama_host = ollama_host

    def _build_chat_client(self, config: ChatProviderConfig):
        normalized = (config.provider or "ollama").strip().lower()
        if normalized == "ollama":
            host = config.api_base.strip() or self.default_ollama_host
            return "ollama", OllamaClient(host)
        if normalized in {"openai-compatible", "openai_compatible", "openai"}:
            if not config.api_base.strip():
                raise ValueError("OpenAI-compatible provider requires a base URL.")
            return "openai-compatible", OpenAICompatibleClient(config.api_base.strip(), config.api_key or "")
        raise ValueError(f"Unsupported provider '{config.provider}'.")

    def _index_settings_payload(
        self,
        embedding: EmbeddingProviderConfig,
        retrieval: RetrievalConfig,
    ) -> Dict[str, object]:
        return {
            "embedding_provider": embedding.provider,
            "embedding_model": embedding.model,
            "embedding_dimensions": embedding.dimensions,
            "embedding_encoding_format": embedding.encoding_format,
            "chunk_target_tokens": retrieval.chunk_target_tokens,
            "chunk_overlap_tokens": retrieval.chunk_overlap_tokens,
            "chunk_max_tokens": retrieval.chunk_max_tokens,
            "prefix_rule_version": DEFAULT_PREFIX_RULE_VERSION,
            "index_version": DEFAULT_INDEX_VERSION,
            "collection_name": self.collection_name,
        }

    def _load_manifest(self, vault_path: str) -> dict:
        vault_paths = resolve_vault_paths(vault_path)
        if vault_paths.manifest_path.exists():
            return json.loads(vault_paths.manifest_path.read_text(encoding="utf-8"))
        return {}

    def _build_rebuild_reasons(
        self,
        manifest: dict,
        embedding: EmbeddingProviderConfig,
        retrieval: RetrievalConfig,
        vector_count: int,
    ) -> list[str]:
        reasons: list[str] = []
        if vector_count == 0:
            reasons.append("index_empty")
        if not manifest:
            reasons.append("manifest_missing")
            return reasons

        checks = [
            ("embedding_provider", embedding.provider, "embedding_provider_changed"),
            ("embedding_model", embedding.model, "embedding_model_changed"),
            ("embedding_dimensions", embedding.dimensions, "embedding_dimensions_changed"),
            ("embedding_encoding_format", embedding.encoding_format, "embedding_encoding_format_changed"),
            ("chunk_target_tokens", retrieval.chunk_target_tokens, "chunk_target_tokens_changed"),
            ("chunk_overlap_tokens", retrieval.chunk_overlap_tokens, "chunk_overlap_tokens_changed"),
            ("chunk_max_tokens", retrieval.chunk_max_tokens, "chunk_max_tokens_changed"),
            ("prefix_rule_version", DEFAULT_PREFIX_RULE_VERSION, "prefix_rule_version_changed"),
            ("index_version", DEFAULT_INDEX_VERSION, "index_version_changed"),
        ]
        for key, current_value, reason in checks:
            if manifest.get(key) != current_value:
                reasons.append(reason)
        return reasons

    def _index_job_store(self, vault_path: str) -> IndexJobStore:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        return IndexJobStore(vault_paths)

    def _resolve_batch_output_root(self, vault_path: str, batch: EmbeddingBatchConfig) -> Path:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        output_dir = (batch.output_dir or "").strip()
        if output_dir:
            path = Path(output_dir)
            if not path.is_absolute():
                path = vault_paths.vault_root / path
        else:
            path = vault_paths.index_jobs_root / "batch_outputs"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _job_status_payload(self, record: BatchJobRecord | None) -> dict:
        if record is None:
            return {
                "mode": "batch",
                "status": "idle",
                "job_id": None,
                "provider_job_id": None,
                "request_counts": {"total": 0, "completed": 0, "failed": 0},
                "output_file_id": None,
                "error_file_id": None,
                "message": "No active batch indexing job.",
            }
        return {
            "mode": "batch",
            "status": record.status,
            "job_id": record.job_id,
            "provider_job_id": record.provider_job_id,
            "request_counts": record.request_counts,
            "output_file_id": record.output_file_id,
            "error_file_id": record.error_file_id,
            "message": record.message,
            "file_count": record.file_count,
            "chunk_count": record.chunk_count,
        }

    def _sync_manifest(
        self,
        vault_path: str,
        embedding: EmbeddingProviderConfig,
        retrieval: RetrievalConfig,
        file_count: int,
        chunk_count: int,
    ) -> dict:
        vault_paths = resolve_vault_paths(vault_path)
        loader = VaultDocumentLoader(vault_paths)
        entries = loader.list_entries()
        manifest = {
            "indexed_at": datetime.now().isoformat(timespec="seconds"),
            "signature": build_index_signature(entries, self._index_settings_payload(embedding, retrieval)),
            "file_count": file_count,
            "chunk_count": chunk_count,
            "embedding_provider": embedding.provider,
            "embedding_model": embedding.model,
            "embedding_dimensions": embedding.dimensions,
            "embedding_encoding_format": embedding.encoding_format,
            "chunk_target_tokens": retrieval.chunk_target_tokens,
            "chunk_overlap_tokens": retrieval.chunk_overlap_tokens,
            "chunk_max_tokens": retrieval.chunk_max_tokens,
            "prefix_rule_version": DEFAULT_PREFIX_RULE_VERSION,
            "index_version": DEFAULT_INDEX_VERSION,
        }
        vault_paths.manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return manifest

    def _finalize_batch_job(
        self,
        vault_path: str,
        record: BatchJobRecord,
        embedding: EmbeddingProviderConfig,
        batch: EmbeddingBatchConfig,
        retrieval: RetrievalConfig,
    ) -> BatchJobRecord:
        store = self._index_job_store(vault_path)
        chunks = store.load_chunks(record.job_id)
        output_root = self._resolve_batch_output_root(vault_path, batch)
        provider = build_batch_embedding_provider(embedding, batch, output_root)

        results = provider.download_batch_results(record.output_file_id or "")
        (output_root / record.job_id / "output.json").write_text(
            json.dumps(results, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        chunk_map = {chunk.chunk_id: chunk for chunk in chunks}
        vectors_by_chunk: dict[str, list[float]] = {}
        failed_chunk_ids: list[str] = []

        for item in results:
            custom_id = str(item.get("custom_id", ""))
            if not custom_id.startswith("chunk::"):
                continue
            chunk_id = custom_id[len("chunk::") :]
            body = item.get("response", {}).get("body", {})
            data = body.get("data", [])
            embedding_vector = None
            if isinstance(data, list) and data:
                embedding_vector = data[0].get("embedding")
            if embedding_vector:
                vectors_by_chunk[chunk_id] = embedding_vector
            else:
                failed_chunk_ids.append(chunk_id)

        if record.error_file_id:
            failed_results = provider.download_batch_results(record.error_file_id)
            (output_root / record.job_id / "error.json").write_text(
                json.dumps(failed_results, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            for item in failed_results:
                custom_id = str(item.get("custom_id", ""))
                if custom_id.startswith("chunk::"):
                    failed_chunk_ids.append(custom_id[len("chunk::") :])

        failed_chunk_ids = list(dict.fromkeys(chunk_id for chunk_id in failed_chunk_ids if chunk_id not in vectors_by_chunk))
        if failed_chunk_ids:
            realtime_provider = build_embedding_provider(embedding, usage="index_realtime")
            compensation_chunks = [chunk_map[chunk_id] for chunk_id in failed_chunk_ids if chunk_id in chunk_map]
            if compensation_chunks:
                compensation_vectors = realtime_provider.embed_texts([chunk.content_with_prefix for chunk in compensation_chunks])
                for chunk, vector in zip(compensation_chunks, compensation_vectors):
                    vectors_by_chunk[chunk.chunk_id] = vector

        ordered_chunks = [chunk for chunk in chunks if chunk.chunk_id in vectors_by_chunk]
        ordered_vectors = [vectors_by_chunk[chunk.chunk_id] for chunk in ordered_chunks]
        vault_paths = resolve_vault_paths(vault_path)
        vector_store = VectorStore(vault_paths, self.collection_name)
        vector_store.reset_collection()
        if ordered_chunks:
            vector_store.add_chunks(ordered_chunks, ordered_vectors)

        record.updated_at = datetime.now()
        record.status = "completed"
        record.request_counts = {
            "total": len(chunks),
            "completed": len(ordered_chunks),
            "failed": max(0, len(chunks) - len(ordered_chunks)),
        }
        record.message = "Batch indexing completed."
        record.chunk_count = len(chunks)
        record.output_file_path = str(output_root / record.job_id / "output.json")
        record.error_file_path = str(output_root / record.job_id / "error.json") if record.error_file_id else None
        if batch.delete_remote_files_after_download:
            if record.output_file_id:
                try:
                    provider.delete_file(record.output_file_id)
                except Exception:
                    pass
            if record.error_file_id:
                try:
                    provider.delete_file(record.error_file_id)
                except Exception:
                    pass
        self._sync_manifest(
            vault_path=vault_path,
            embedding=embedding,
            retrieval=retrieval,
            file_count=record.file_count,
            chunk_count=record.chunk_count,
        )
        store.save_record(record)
        return record

    def get_status(
        self,
        vault_path: str,
        chat: ChatProviderConfig,
        embedding: EmbeddingProviderConfig,
        batch: EmbeddingBatchConfig,
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        entries = loader.list_entries()
        current_signature = build_index_signature(entries, self._index_settings_payload(embedding, retrieval))
        manifest = self._load_manifest(vault_path)

        vector_store = VectorStore(vault_paths, self.collection_name)
        try:
            vector_count = vector_store.count()
        except Exception:
            vector_count = 0

        try:
            provider_name, client = self._build_chat_client(chat)
            chat_healthy = client.health() if provider_name == "ollama" else bool(chat.api_base.strip())
        except Exception:
            provider_name = (chat.provider or "ollama").strip().lower() or "ollama"
            chat_healthy = False
        active_job = self._index_job_store(vault_path).load_active_record()
        rebuild_reasons = self._build_rebuild_reasons(
            manifest=manifest,
            embedding=embedding,
            retrieval=retrieval,
            vector_count=vector_count,
        )
        if manifest.get("signature") != current_signature and "source_files_changed" not in rebuild_reasons:
            rebuild_reasons.append("source_files_changed")

        return {
            "vault_path": str(vault_paths.vault_root),
            "indexed_files": len(entries),
            "vector_count": vector_count,
            "last_indexed_at": manifest.get("indexed_at"),
            "chat_provider": provider_name,
            "chat_healthy": chat_healthy,
            "embedding_provider": embedding.provider,
            "embedding_model": embedding.model,
            "embedding_configured": self._embedding_configured(embedding),
            "embedding_batch_enabled": batch.enabled,
            "rerank_provider": rerank.provider,
            "rerank_model": rerank.model,
            "rerank_configured": self._rerank_configured(rerank),
            "active_index_job": active_job.job_id if active_job and active_job.status not in {"completed", "failed", "cancelled", "expired"} else None,
            "needs_rebuild": bool(rebuild_reasons),
            "rebuild_reasons": rebuild_reasons,
        }

    def _embedding_configured(self, config: EmbeddingProviderConfig) -> bool:
        provider = (config.provider or "").strip().lower()
        if provider == "sentence-transformers":
            return bool(config.model.strip())
        if provider in {"vllm", "dashscope"}:
            return bool(config.model.strip() and config.api_base.strip() and (provider == "vllm" or config.api_key.strip()))
        return False

    def _rerank_configured(self, config: RerankProviderConfig) -> bool:
        provider = (config.provider or "").strip().lower()
        if provider == "vllm":
            return bool(config.model.strip() and config.api_base.strip())
        if provider == "dashscope":
            return bool(config.model.strip() and config.api_base.strip() and config.api_key.strip())
        return False

    def build_index(
        self,
        vault_path: str,
        embedding: EmbeddingProviderConfig,
        retrieval: RetrievalConfig,
        batch: EmbeddingBatchConfig,
    ) -> Dict[str, object]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        loader = VaultDocumentLoader(vault_paths)
        documents = loader.load_documents()
        splitter = TextSplitter(
            retrieval.chunk_target_tokens or DEFAULT_CHUNK_TARGET_TOKENS,
            retrieval.chunk_overlap_tokens or DEFAULT_CHUNK_OVERLAP_TOKENS,
            DEFAULT_MIN_CHUNK_SIZE,
        )
        chunks = splitter.split_documents(documents)

        if retrieval.indexing_mode == "batch":
            if not batch.enabled:
                raise RuntimeError("Batch indexing requires embedding_batch_enabled = true.")
            if (embedding.provider or "").strip().lower() != "dashscope":
                raise RuntimeError("Batch indexing currently supports DashScope embedding only.")
            output_root = self._resolve_batch_output_root(vault_path, batch)
            provider = build_batch_embedding_provider(embedding, batch, output_root)
            record = provider.submit_embedding_batch(chunks)
            record.file_count = len(documents)
            record.chunk_count = len(chunks)
            record.request_counts = {"total": len(chunks), "completed": 0, "failed": 0}
            record.message = "Batch indexing job submitted."
            self._index_job_store(vault_path).save_job(record, chunks)
            return self._job_status_payload(record) | {"file_count": len(documents), "chunk_count": len(chunks)}

        provider = build_embedding_provider(embedding, usage="index_realtime")
        embeddings = provider.embed_texts([chunk.content_with_prefix for chunk in chunks]) if chunks else []

        store = VectorStore(vault_paths, self.collection_name)
        store.reset_collection()
        if chunks:
            store.add_chunks(chunks, embeddings)

        self._sync_manifest(
            vault_path=vault_path,
            embedding=embedding,
            retrieval=retrieval,
            file_count=len(documents),
            chunk_count=len(chunks),
        )
        return {
            "mode": "sync",
            "status": "completed",
            "file_count": len(documents),
            "chunk_count": len(chunks),
        }

    def build_index_status(
        self,
        vault_path: str,
        embedding: EmbeddingProviderConfig,
        batch: EmbeddingBatchConfig,
        retrieval: RetrievalConfig,
        job_id: str | None = None,
    ) -> dict:
        store = self._index_job_store(vault_path)
        record = store.load_record(job_id) if job_id else store.load_active_record()
        if record is None:
            return self._job_status_payload(None)
        if not record.provider_job_id:
            return self._job_status_payload(record)

        provider = build_batch_embedding_provider(embedding, batch, self._resolve_batch_output_root(vault_path, batch))
        provider_status = provider.poll_batch_status(record.provider_job_id)
        record.updated_at = datetime.now()
        record.status = provider_status.get("status", record.status)
        record.output_file_id = provider_status.get("output_file_id", record.output_file_id)
        record.error_file_id = provider_status.get("error_file_id", record.error_file_id)
        record.request_counts = {
            "total": int(provider_status.get("request_counts", {}).get("total", record.request_counts.get("total", 0)) or 0),
            "completed": int(provider_status.get("request_counts", {}).get("completed", record.request_counts.get("completed", 0)) or 0),
            "failed": int(provider_status.get("request_counts", {}).get("failed", record.request_counts.get("failed", 0)) or 0),
        }
        record.message = provider_status.get("message", record.message)
        store.save_record(record)

        if record.status in {"completed", "finalizing"} and record.output_file_id and record.output_file_path is None:
            record = self._finalize_batch_job(vault_path, record, embedding, batch, retrieval)
            store.save_record(record)
        return self._job_status_payload(record)

    def cancel_index_build(
        self,
        vault_path: str,
        embedding: EmbeddingProviderConfig,
        batch: EmbeddingBatchConfig,
        job_id: str | None = None,
    ) -> dict:
        store = self._index_job_store(vault_path)
        record = store.load_record(job_id) if job_id else store.load_active_record()
        if record is None:
            return self._job_status_payload(None)
        if record.provider_job_id:
            provider = build_batch_embedding_provider(embedding, batch, self._resolve_batch_output_root(vault_path, batch))
            provider.cancel_batch(record.provider_job_id)
        record.status = "cancelled"
        record.updated_at = datetime.now()
        record.message = "Batch indexing job cancelled."
        store.save_record(record)
        return self._job_status_payload(record)

    def search(
        self,
        vault_path: str,
        query: str,
        embedding: EmbeddingProviderConfig,
        retrieval: RetrievalConfig,
    ) -> List[SearchHit]:
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        store = VectorStore(vault_paths, self.collection_name)
        provider = build_embedding_provider(embedding, usage="query")
        query_embedding = provider.embed_query(query)
        threshold = retrieval.similarity_threshold if retrieval.similarity_threshold is not None else 0.0
        max_results = max(1, min(retrieval.retrieval_limit, MAX_RETRIEVAL_LIMIT))
        return store.search(query_embedding, threshold=threshold, max_results=max_results)

    def _merge_hits_by_chunk(self, hits: List[SearchHit]) -> List[SearchHit]:
        merged: dict[str, SearchHit] = {}
        for hit in hits:
            existing = merged.get(hit.chunk_id)
            if existing is None or hit.similarity > existing.similarity:
                merged[hit.chunk_id] = hit
        return sorted(merged.values(), key=lambda item: (-item.similarity, item.relative_path, item.chunk_index))

    def _expand_neighbors(self, vault_path: str, hits: List[SearchHit], retrieval: RetrievalConfig) -> List[SearchHit]:
        if not hits or retrieval.neighbor_window <= 0:
            return hits

        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        store = VectorStore(vault_paths, self.collection_name)
        expanded: List[SearchHit] = list(hits)
        hits_by_note: dict[str, List[SearchHit]] = {}
        for hit in hits:
            hits_by_note.setdefault(hit.relative_path, []).append(hit)

        for relative_path, note_hits in hits_by_note.items():
            note_chunks = store.get_chunks_for_note(relative_path)
            by_index = {chunk.chunk_index: chunk for chunk in note_chunks}
            for hit in note_hits:
                for offset in range(-retrieval.neighbor_window, retrieval.neighbor_window + 1):
                    if offset == 0:
                        continue
                    neighbor = by_index.get(hit.chunk_index + offset)
                    if neighbor is None:
                        continue
                    expanded.append(
                        SearchHit(
                            chunk_id=neighbor.chunk_id,
                            content=neighbor.content,
                            metadata=neighbor.metadata,
                            distance=neighbor.distance,
                            similarity=max(0.0, hit.similarity - 0.01 * abs(offset)),
                            note_id=neighbor.note_id,
                            relative_path=neighbor.relative_path,
                            chunk_index=neighbor.chunk_index,
                            score=max(0.0, hit.similarity - 0.01 * abs(offset)),
                            source="neighbor",
                            token_count=neighbor.token_count,
                        )
                    )
        return self._merge_hits_by_chunk(expanded)

    def _query_has_temporal_hint(self, query: str) -> bool:
        normalized = query.lower()
        keywords = ["最近", "上周", "这个月", "前几天", "today", "yesterday", "last week", "this month"]
        if any(keyword in query or keyword in normalized for keyword in keywords):
            return True
        return bool(datetime_regex_search(query))

    def _expand_temporal(self, vault_path: str, hits: List[SearchHit], retrieval: RetrievalConfig) -> List[SearchHit]:
        if not hits or not retrieval.enable_temporal_expansion:
            return hits

        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        store = VectorStore(vault_paths, self.collection_name)
        expanded: List[SearchHit] = list(hits)
        for hit in hits:
            if str(hit.metadata.get("doc_type", "")) != "daily_note":
                continue
            note_date_raw = hit.metadata.get("note_date")
            if not isinstance(note_date_raw, str) or not note_date_raw:
                continue
            note_date = datetime.fromisoformat(note_date_raw).date()
            for offset in range(1, retrieval.temporal_window_days + 1):
                for target_date in (note_date - timedelta(days=offset), note_date + timedelta(days=offset)):
                    temporal_chunks = store.get_chunks_by_note_date(target_date.isoformat())
                    for candidate in temporal_chunks[: max(1, retrieval.neighbor_window + 1)]:
                        expanded.append(
                            SearchHit(
                                chunk_id=candidate.chunk_id,
                                content=candidate.content,
                                metadata=candidate.metadata,
                                distance=candidate.distance,
                                similarity=max(0.0, hit.similarity - 0.02 * offset),
                                note_id=candidate.note_id,
                                relative_path=candidate.relative_path,
                                chunk_index=candidate.chunk_index,
                                score=max(0.0, hit.similarity - 0.02 * offset),
                                source="temporal",
                                token_count=candidate.token_count,
                            )
                        )
        return self._merge_hits_by_chunk(expanded)

    def _expand_entities(
        self,
        vault_path: str,
        query: str,
        hits: List[SearchHit],
        groups: List[ContextGroup],
        retrieval: RetrievalConfig,
    ) -> List[SearchHit]:
        if not hits or not retrieval.enable_second_pass_entity_expansion:
            return hits

        candidate_terms = extract_entity_terms(query)
        for group in groups[:3]:
            candidate_terms.extend(extract_entity_terms(group.relative_path))
            candidate_terms.extend(extract_entity_terms(group.merged_text[:300]))
        entity_terms: list[str] = []
        for term in candidate_terms:
            if term not in entity_terms:
                entity_terms.append(term)
        if not entity_terms:
            return hits

        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        store = VectorStore(vault_paths, self.collection_name)
        existing_ids = {hit.chunk_id for hit in hits}
        expanded = list(hits)
        for candidate in store.get_all_chunks():
            if candidate.chunk_id in existing_ids:
                continue
            text = f"{candidate.relative_path}\n{candidate.content}".lower()
            matches = [term for term in entity_terms if term.lower() in text]
            if not matches:
                continue
            bonus = min(0.25, 0.05 * len(matches))
            expanded.append(
                SearchHit(
                    chunk_id=candidate.chunk_id,
                    content=candidate.content,
                    metadata=candidate.metadata,
                    distance=0.0,
                    similarity=max(0.2, hits[0].similarity * 0.6 + bonus),
                    note_id=candidate.note_id,
                    relative_path=candidate.relative_path,
                    chunk_index=candidate.chunk_index,
                    score=max(0.2, hits[0].similarity * 0.6 + bonus),
                    source="entity_expansion",
                    token_count=candidate.token_count,
                )
            )
            existing_ids.add(candidate.chunk_id)
            if len(expanded) >= len(hits) + max(5, retrieval.neighbor_window * 4):
                break
        return self._merge_hits_by_chunk(expanded)

    def _build_groups(self, hits: List[SearchHit], retrieval: RetrievalConfig) -> List[ContextGroup]:
        grouped_hits: dict[str, List[SearchHit]] = {}
        for hit in hits:
            grouped_hits.setdefault(hit.relative_path, []).append(hit)

        groups: List[ContextGroup] = []
        for relative_path, note_hits in grouped_hits.items():
            ordered = sorted(note_hits, key=lambda item: item.chunk_index)
            current: List[SearchHit] = []
            for hit in ordered:
                if not current:
                    current = [hit]
                    continue
                gap = hit.chunk_index - current[-1].chunk_index - 1
                if gap <= retrieval.same_note_group_merge_gap:
                    current.append(hit)
                else:
                    groups.append(self._make_group(current))
                    current = [hit]
            if current:
                groups.append(self._make_group(current))
        return groups

    def _make_group(self, hits: List[SearchHit]) -> ContextGroup:
        first = hits[0]
        note_date_raw = first.metadata.get("note_date")
        note_date = datetime.fromisoformat(note_date_raw).date() if isinstance(note_date_raw, str) and note_date_raw else None
        merged_text = "\n\n".join(hit.content.strip() for hit in hits if hit.content.strip())
        vector_score = max(hit.similarity for hit in hits)
        return ContextGroup(
            group_id=f"{first.relative_path}::{hits[0].chunk_index}-{hits[-1].chunk_index}",
            note_id=first.note_id,
            relative_path=first.relative_path,
            note_date=note_date,
            chunk_ids=[hit.chunk_id for hit in hits],
            merged_text=merged_text,
            token_count=sum(max(1, hit.token_count or estimate_token_count(hit.content)) for hit in hits),
            vector_score=vector_score,
            group_score=vector_score,
            hit_count=len(hits),
            filepath=str(first.metadata.get("filepath", "")),
        )

    def _rerank_groups(
        self,
        query: str,
        groups: List[ContextGroup],
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> List[ContextGroup]:
        if not groups:
            return []

        provider = build_rerank_provider(rerank)
        rerank_limit = min(len(groups), max(1, retrieval.final_group_count_cap, rerank.top_n))
        results = provider.rerank(query, [group.merged_text for group in groups], top_n=rerank_limit)
        updated = list(groups)
        for result in results:
            group = updated[result.index]
            group.rerank_score = result.score
            group.group_score = (group.vector_score * 0.45) + (result.score * 0.45) + (min(group.hit_count, 3) * 0.05)
        for group in updated:
            if group.rerank_score is None:
                group.group_score = group.vector_score
        updated.sort(key=lambda item: (item.group_score, item.vector_score, item.hit_count), reverse=True)
        return updated

    def _select_diverse_groups(self, groups: List[ContextGroup], retrieval: RetrievalConfig) -> List[ContextGroup]:
        if not groups:
            return []
        remaining = list(groups)
        selected: List[ContextGroup] = []
        seen_notes: set[str] = set()
        seen_dates: set[str] = set()
        max_groups = max(1, min(retrieval.final_group_count_cap, retrieval.final_note_count))

        while remaining and len(selected) < max_groups:
            best_group = None
            best_effective_score = None
            for group in remaining:
                effective_score = group.group_score
                if group.note_id in seen_notes:
                    effective_score -= 0.12
                if group.note_date is not None and group.note_date.isoformat() in seen_dates:
                    effective_score -= 0.05
                if best_effective_score is None or effective_score > best_effective_score:
                    best_group = group
                    best_effective_score = effective_score
            assert best_group is not None
            best_group.source_diversity_rank = len(selected) + 1
            selected.append(best_group)
            seen_notes.add(best_group.note_id)
            if best_group.note_date is not None:
                seen_dates.add(best_group.note_date.isoformat())
            remaining.remove(best_group)
        return selected

    def _pack_context_groups(self, groups: List[ContextGroup], retrieval: RetrievalConfig) -> List[ContextGroup]:
        packed: List[ContextGroup] = []
        used_tokens = 0
        for group in self._select_diverse_groups(groups, retrieval):
            if packed and used_tokens + group.token_count > retrieval.final_context_token_budget:
                continue
            packed.append(group)
            used_tokens += group.token_count
        if not packed and groups:
            groups[0].source_diversity_rank = 1
            return [groups[0]]
        return packed

    def _build_source_payload(self, groups: List[ContextGroup]) -> List[dict]:
        return [
            {
                "relative_path": group.relative_path,
                "filepath": group.filepath,
                "similarity": group.vector_score,
                "rerank_score": group.rerank_score,
                "chunk_id": group.chunk_ids[0] if group.chunk_ids else None,
            }
            for group in groups
        ]

    def retrieve_context(
        self,
        vault_path: str,
        query: str,
        embedding: EmbeddingProviderConfig,
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> tuple[List[ContextGroup], List[dict]]:
        hits = self.search(vault_path, query, embedding=embedding, retrieval=retrieval)
        hits = hits[: min(max(retrieval.rerank_candidates, 1), MAX_RERANK_CANDIDATES, len(hits))] if hits else []
        expanded_hits = self._expand_neighbors(vault_path, hits, retrieval)
        if self._query_has_temporal_hint(query):
            expanded_hits = self._expand_temporal(vault_path, expanded_hits, retrieval)
        groups = self._build_groups(expanded_hits, retrieval)
        expanded_hits = self._expand_entities(vault_path, query, expanded_hits, groups, retrieval)
        groups = self._build_groups(expanded_hits, retrieval)
        try:
            reranked_groups = self._rerank_groups(query, groups, rerank=rerank, retrieval=retrieval)
        except Exception:
            reranked_groups = sorted(groups, key=lambda item: item.vector_score, reverse=True)
        packed_groups = self._pack_context_groups(reranked_groups, retrieval)
        return packed_groups, self._build_source_payload(packed_groups)

    def _prepare_chat(
        self,
        vault_path: str,
        query: str,
        chat: ChatProviderConfig,
        embedding: EmbeddingProviderConfig,
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> tuple[object, str, List[SessionMessage], List[ContextGroup], List[dict], SessionStore]:
        _, client = self._build_chat_client(chat)
        context_groups, source_payload = self.retrieve_context(
            vault_path=vault_path,
            query=query,
            embedding=embedding,
            rerank=rerank,
            retrieval=retrieval,
        )
        vault_paths = resolve_vault_paths(vault_path)
        ensure_vault_dirs(vault_paths)
        sessions = SessionStore(vault_paths)
        session_id, history = sessions.load_active()
        history.append(SessionMessage(role="user", content=query))
        return client, session_id, history, context_groups, source_payload, sessions

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
        chat: ChatProviderConfig,
        embedding: EmbeddingProviderConfig,
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> ChatResult:
        final_result: ChatResult | None = None
        for event in self.stream_chat(
            vault_path=vault_path,
            query=query,
            chat=chat,
            embedding=embedding,
            rerank=rerank,
            retrieval=retrieval,
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
        chat: ChatProviderConfig,
        embedding: EmbeddingProviderConfig,
        rerank: RerankProviderConfig,
        retrieval: RetrievalConfig,
    ) -> Iterator[dict]:
        client, session_id, history, hits, source_payload, sessions = self._prepare_chat(
            vault_path=vault_path,
            query=query,
            chat=chat,
            embedding=embedding,
            rerank=rerank,
            retrieval=retrieval,
        )
        yield {"type": "session", "session_id": session_id}

        answer_parts: List[str] = []
        thinking_parts: List[str] = []
        for event in client.stream_chat(
            model=chat.model,
            query=query,
            hits=hits,
            history=history[:-1],
            enable_thinking=chat.enable_thinking,
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

    def test_chat_provider(self, chat: ChatProviderConfig) -> Dict[str, object]:
        _, client = self._build_chat_client(chat)
        if not client.health():
            raise RuntimeError("Chat provider health check failed.")
        return {
            "success": True,
            "message": "ok",
            "request_id": f"chat-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        }

    def test_embedding_provider(self, embedding: EmbeddingProviderConfig) -> Dict[str, object]:
        provider = build_embedding_provider(embedding, usage="query")
        vector = provider.embed_query("health check")
        if not vector:
            raise RuntimeError("Embedding provider returned an empty vector.")
        return {
            "success": True,
            "message": "ok",
            "request_id": f"embedding-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        }

    def test_rerank_provider(self, rerank: RerankProviderConfig) -> Dict[str, object]:
        provider = build_rerank_provider(rerank)
        results = provider.rerank("health check", ["alpha", "beta"], top_n=1)
        if not results:
            raise RuntimeError("Rerank provider returned an empty result.")
        return {
            "success": True,
            "message": "ok",
            "request_id": f"rerank-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        }

    def test_batch_embedding_provider(
        self,
        batch: EmbeddingBatchConfig,
        embedding: EmbeddingProviderConfig,
    ) -> Dict[str, object]:
        if not batch.enabled:
            raise RuntimeError("Batch embedding is disabled.")
        if not batch.api_base.strip() or not batch.api_key.strip():
            raise RuntimeError("Batch embedding requires API base URL and API key.")
        if (embedding.provider or "").strip().lower() != "dashscope":
            raise RuntimeError("Batch embedding currently targets DashScope only.")
        provider = build_batch_embedding_provider(embedding, batch, Path(batch.output_dir or "."))
        if not provider.health():
            raise RuntimeError("Batch embedding provider health check failed.")
        return {
            "success": True,
            "message": "ok",
            "request_id": f"batch-{uuid4().hex[:12]}",
        }


def build_default_retrieval_config() -> RetrievalConfig:
    return RetrievalConfig(
        similarity_threshold=None,
        max_results=DEFAULT_MAX_RESULTS,
        retrieval_limit=DEFAULT_RETRIEVAL_LIMIT,
        rerank_candidates=DEFAULT_RERANK_CANDIDATES,
        final_note_count=DEFAULT_FINAL_NOTE_COUNT,
        chunk_target_tokens=DEFAULT_CHUNK_TARGET_TOKENS,
        chunk_overlap_tokens=DEFAULT_CHUNK_OVERLAP_TOKENS,
        chunk_max_tokens=DEFAULT_CHUNK_MAX_TOKENS,
        neighbor_window=DEFAULT_NEIGHBOR_WINDOW,
        same_note_group_merge_gap=DEFAULT_GROUP_MERGE_GAP,
        final_group_count_cap=DEFAULT_FINAL_GROUP_COUNT_CAP,
        final_context_token_budget=DEFAULT_FINAL_CONTEXT_TOKEN_BUDGET,
        enable_temporal_expansion=True,
        temporal_window_days=DEFAULT_TEMPORAL_WINDOW_DAYS,
        enable_second_pass_entity_expansion=False,
        enable_query_rewrite=False,
    )
