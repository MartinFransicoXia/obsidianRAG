from __future__ import annotations

import unittest
from pathlib import Path
import sys
import types

if "requests" not in sys.modules:
    class _FakeSession:
        def __init__(self) -> None:
            self.trust_env = False

    sys.modules["requests"] = types.SimpleNamespace(Session=_FakeSession)

from obsidian_rag_backend.models import EmbeddingBatchConfig, EmbeddingProviderConfig, TextChunk
from obsidian_rag_backend.providers.embedding.batch_provider import DashScopeBatchEmbeddingProvider
from obsidian_rag_backend.providers.rerank.dashscope_provider import DashScopeRerankProvider


class DashScopeSerializationTests(unittest.TestCase):
    def test_batch_jsonl_line_uses_content_with_prefix(self) -> None:
        provider = DashScopeBatchEmbeddingProvider(
            embedding=EmbeddingProviderConfig(
                provider="dashscope",
                api_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
                api_key="secret",
                model="text-embedding-v4",
                dimensions=1024,
                encoding_format="float",
            ),
            batch=EmbeddingBatchConfig(
                enabled=True,
                api_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
                api_key="secret",
                completion_window="24h",
            ),
            output_root=Path("backend/tests/fixtures"),
        )
        chunk = TextChunk(
            content="plain body",
            content_with_prefix="[Note] Daily/2026-04-02.md\n\nplain body",
            metadata={},
            chunk_id="Daily/2026-04-02.md::0",
            start_pos=0,
            end_pos=10,
        )

        payload = provider._jsonl_line(chunk)
        self.assertEqual(payload["custom_id"], "chunk::Daily/2026-04-02.md::0")
        self.assertEqual(payload["method"], "POST")
        self.assertEqual(payload["url"], "/v1/embeddings")
        self.assertEqual(payload["body"]["input"], "[Note] Daily/2026-04-02.md\n\nplain body")
        self.assertEqual(payload["body"]["dimensions"], 1024)

    def test_rerank_payload_differs_by_model(self) -> None:
        qwen_provider = DashScopeRerankProvider(
            model_name="qwen3-rerank",
            api_base="https://dashscope.aliyuncs.com",
            api_key="secret",
            instruct="retrieve relevant notes",
        )
        gte_provider = DashScopeRerankProvider(
            model_name="gte-rerank-v2",
            api_base="https://dashscope.aliyuncs.com",
            api_key="secret",
            return_documents=True,
        )

        qwen_payload = qwen_provider._payload("query", ["a", "b"], 2)
        gte_payload = gte_provider._payload("query", ["a", "b"], 2)

        self.assertEqual(qwen_payload["model"], "qwen3-rerank")
        self.assertIn("documents", qwen_payload)
        self.assertIn("instruct", qwen_payload)
        self.assertEqual(gte_payload["model"], "gte-rerank-v2")
        self.assertIn("input", gte_payload)
        self.assertIn("parameters", gte_payload)
        self.assertTrue(gte_payload["parameters"]["return_documents"])


if __name__ == "__main__":
    unittest.main()
