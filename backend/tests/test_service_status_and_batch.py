from __future__ import annotations

from datetime import datetime
from pathlib import Path
import shutil
import sys
import types
import unittest
from unittest.mock import patch

if "chromadb" not in sys.modules:
    class _FakeCollection:
        def count(self):
            return 0

    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def get_or_create_collection(self, *args, **kwargs):
            return _FakeCollection()

    fake_settings_module = types.SimpleNamespace(Settings=lambda **kwargs: kwargs)
    sys.modules["chromadb"] = types.SimpleNamespace(PersistentClient=_FakeClient)
    sys.modules["chromadb.config"] = fake_settings_module

from obsidian_rag_backend.config import DEFAULT_INDEX_VERSION, DEFAULT_PREFIX_RULE_VERSION, ensure_vault_dirs, resolve_vault_paths
from obsidian_rag_backend.models import BatchJobRecord, EmbeddingBatchConfig, EmbeddingProviderConfig, RetrievalConfig, TextChunk
import obsidian_rag_backend.service as service_module
from obsidian_rag_backend.service import ObsidianRAGService


def make_retrieval_config() -> RetrievalConfig:
    return RetrievalConfig(
        similarity_threshold=None,
        max_results=8,
        retrieval_limit=30,
        rerank_candidates=15,
        final_note_count=5,
        chunk_target_tokens=420,
        chunk_overlap_tokens=64,
        chunk_max_tokens=520,
        neighbor_window=1,
        same_note_group_merge_gap=1,
        final_group_count_cap=8,
        final_context_token_budget=4800,
        enable_temporal_expansion=True,
        temporal_window_days=2,
        enable_second_pass_entity_expansion=False,
        enable_query_rewrite=False,
    )


def make_embedding_config() -> EmbeddingProviderConfig:
    return EmbeddingProviderConfig(
        provider="dashscope",
        api_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key="secret",
        model="text-embedding-v4",
        dimensions=1024,
        encoding_format="float",
    )


def make_chunk(chunk_id: str, index: int) -> TextChunk:
    return TextChunk(
        content=f"chunk {index}",
        content_with_prefix=f"[Note] Daily/2026-04-02.md\n\nchunk {index}",
        metadata={"filepath": "F:/vault/Daily/2026-04-02.md", "note_date": "2026-04-02", "doc_type": "daily_note"},
        chunk_id=chunk_id,
        note_id="Daily/2026-04-02.md",
        relative_path="Daily/2026-04-02.md",
        filepath="F:/vault/Daily/2026-04-02.md",
        note_title="Daily Reflection",
        doc_type="daily_note",
        chunk_index=index,
        token_count=32,
        start_pos=index * 10,
        end_pos=index * 10 + 9,
    )


class _FakeBatchProvider:
    def __init__(self, output_results: list[dict], error_results: list[dict]) -> None:
        self.output_results = output_results
        self.error_results = error_results
        self.deleted_file_ids: list[str] = []

    def download_batch_results(self, file_id: str) -> list[dict]:
        if file_id == "output-file":
            return self.output_results
        if file_id == "error-file":
            return self.error_results
        raise AssertionError(f"Unexpected file_id {file_id}")

    def delete_file(self, file_id: str) -> None:
        self.deleted_file_ids.append(file_id)


class _FakeRealtimeEmbeddingProvider:
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [[0.7, 0.8] for _ in texts]


class _FakeVectorStore:
    instances: list["_FakeVectorStore"] = []

    def __init__(self, *args, **kwargs) -> None:
        self.reset_called = False
        self.added_chunks: list[TextChunk] = []
        self.added_vectors: list[list[float]] = []
        _FakeVectorStore.instances.append(self)

    def reset_collection(self) -> None:
        self.reset_called = True

    def add_chunks(self, chunks: list[TextChunk], embeddings: list[list[float]]) -> None:
        self.added_chunks = list(chunks)
        self.added_vectors = list(embeddings)

    def count(self) -> int:
        return len(self.added_chunks)


class ServiceStatusAndBatchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = ObsidianRAGService(ollama_host="http://127.0.0.1:11434")
        self.embedding = make_embedding_config()
        self.retrieval = make_retrieval_config()
        self.batch = EmbeddingBatchConfig(
            enabled=True,
            api_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key="secret",
            completion_window="24h",
        )

    def test_build_rebuild_reasons_identifies_config_changes(self) -> None:
        manifest = {
            "embedding_provider": "vllm",
            "embedding_model": "old-model",
            "embedding_dimensions": 768,
            "embedding_encoding_format": "base64",
            "chunk_target_tokens": 300,
            "chunk_overlap_tokens": 32,
            "chunk_max_tokens": 400,
            "prefix_rule_version": "v0",
            "index_version": "v1",
        }

        reasons = self.service._build_rebuild_reasons(
            manifest=manifest,
            embedding=self.embedding,
            retrieval=self.retrieval,
            vector_count=16,
        )

        self.assertIn("embedding_provider_changed", reasons)
        self.assertIn("embedding_model_changed", reasons)
        self.assertIn("embedding_dimensions_changed", reasons)
        self.assertIn("embedding_encoding_format_changed", reasons)
        self.assertIn("chunk_target_tokens_changed", reasons)
        self.assertIn("chunk_overlap_tokens_changed", reasons)
        self.assertIn("chunk_max_tokens_changed", reasons)
        self.assertIn("prefix_rule_version_changed", reasons)
        self.assertIn("index_version_changed", reasons)

    def test_finalize_batch_job_compensates_failed_rows_and_updates_manifest(self) -> None:
        temp_dir = Path(__file__).resolve().parent / "_tmp_service_status"
        shutil.rmtree(temp_dir, ignore_errors=True)
        temp_dir.mkdir(parents=True, exist_ok=True)
        try:
            vault_path = str(temp_dir / "vault")
            vault_paths = resolve_vault_paths(vault_path)
            ensure_vault_dirs(vault_paths)
            (vault_paths.index_jobs_root / "batch_outputs" / "local_test_job").mkdir(parents=True, exist_ok=True)

            chunks = [make_chunk("Daily/2026-04-02.md::0", 0), make_chunk("Daily/2026-04-02.md::1", 1)]
            record = BatchJobRecord(
                job_id="local_test_job",
                provider="dashscope",
                provider_job_id="provider-job",
                input_file_path=str(vault_paths.index_jobs_root / "local_test_job" / "input.jsonl"),
                output_file_id="output-file",
                error_file_id="error-file",
                model=self.embedding.model,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                chunk_ids=[chunk.chunk_id for chunk in chunks],
                status="finalizing",
                request_counts={"total": 2, "completed": 1, "failed": 1},
                file_count=1,
                chunk_count=2,
            )
            store = self.service._index_job_store(vault_path)
            store.save_job(record, chunks)

            batch_provider = _FakeBatchProvider(
                output_results=[
                    {
                        "custom_id": "chunk::Daily/2026-04-02.md::0",
                        "response": {"body": {"data": [{"embedding": [0.1, 0.2]}]}},
                    },
                    {
                        "custom_id": "chunk::Daily/2026-04-02.md::1",
                        "response": {"body": {"data": []}},
                    },
                ],
                error_results=[
                    {"custom_id": "chunk::Daily/2026-04-02.md::1"},
                ],
            )

            _FakeVectorStore.instances.clear()
            with (
                patch.object(service_module, "build_batch_embedding_provider", return_value=batch_provider),
                patch.object(service_module, "build_embedding_provider", return_value=_FakeRealtimeEmbeddingProvider()),
                patch.object(service_module, "VectorStore", _FakeVectorStore),
            ):
                finalized = self.service._finalize_batch_job(
                    vault_path=vault_path,
                    record=record,
                    embedding=self.embedding,
                    batch=self.batch,
                    retrieval=self.retrieval,
                )

            self.assertEqual(finalized.status, "completed")
            self.assertEqual(finalized.request_counts, {"total": 2, "completed": 2, "failed": 0})
            self.assertTrue(Path(finalized.output_file_path or "").exists())
            self.assertTrue(Path(vault_paths.manifest_path).exists())

            manifest = service_module.json.loads(vault_paths.manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["embedding_provider"], self.embedding.provider)
            self.assertEqual(manifest["embedding_model"], self.embedding.model)
            self.assertEqual(manifest["embedding_dimensions"], self.embedding.dimensions)
            self.assertEqual(manifest["prefix_rule_version"], DEFAULT_PREFIX_RULE_VERSION)
            self.assertEqual(manifest["index_version"], DEFAULT_INDEX_VERSION)

            self.assertTrue(_FakeVectorStore.instances)
            vector_store = _FakeVectorStore.instances[-1]
            self.assertTrue(vector_store.reset_called)
            self.assertEqual([chunk.chunk_id for chunk in vector_store.added_chunks], [chunk.chunk_id for chunk in chunks])
            self.assertEqual(len(vector_store.added_vectors), 2)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
