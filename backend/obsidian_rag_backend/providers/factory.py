from __future__ import annotations

from pathlib import Path

from ..models import EmbeddingBatchConfig, EmbeddingProviderConfig, RerankProviderConfig
from .embedding.base import EmbeddingUsage


QWEN3_QUERY_INSTRUCTION = "Given a user question, retrieve relevant notes that help answer it."


def build_embedding_provider(config: EmbeddingProviderConfig, usage: EmbeddingUsage):
    provider = (config.provider or "vllm").strip().lower()
    if provider == "sentence-transformers":
        from .embedding.sentence_transformers_provider import SentenceTransformersEmbeddingProvider

        return SentenceTransformersEmbeddingProvider(
            model_name=config.model,
            query_instruction=QWEN3_QUERY_INSTRUCTION,
        )
    if provider == "dashscope":
        from .embedding.dashscope_provider import DashScopeEmbeddingProvider

        return DashScopeEmbeddingProvider(
            model_name=config.model,
            api_base=config.api_base,
            api_key=config.api_key,
            query_instruction=QWEN3_QUERY_INSTRUCTION,
            dimensions=config.dimensions,
            encoding_format=config.encoding_format,
        )
    if provider == "vllm":
        from .embedding.vllm_provider import VLLMEmbeddingProvider

        request_batch_size = 1 if usage == "query" else 16
        return VLLMEmbeddingProvider(
            model_name=config.model,
            api_base=config.api_base,
            api_key=config.api_key,
            query_instruction=QWEN3_QUERY_INSTRUCTION,
            dimensions=config.dimensions,
            encoding_format=config.encoding_format,
            request_batch_size=request_batch_size,
        )
    raise ValueError(f"Unsupported embedding provider '{config.provider}'.")


def build_rerank_provider(config: RerankProviderConfig):
    provider = (config.provider or "vllm").strip().lower()
    if provider == "dashscope":
        from .rerank.dashscope_provider import DashScopeRerankProvider

        return DashScopeRerankProvider(
            model_name=config.model,
            api_base=config.api_base,
            api_key=config.api_key,
            instruct=config.instruct,
            return_documents=config.return_documents,
            timeout_seconds=config.timeout_seconds,
        )
    if provider == "vllm":
        from .rerank.vllm_provider import VLLMRerankProvider

        return VLLMRerankProvider(model_name=config.model, api_base=config.api_base)
    raise ValueError(f"Unsupported rerank provider '{config.provider}'.")


def build_batch_embedding_provider(
    embedding: EmbeddingProviderConfig,
    batch: EmbeddingBatchConfig,
    output_root: Path,
):
    provider = (embedding.provider or "").strip().lower()
    if provider == "dashscope":
        from .embedding.batch_provider import DashScopeBatchEmbeddingProvider

        return DashScopeBatchEmbeddingProvider(embedding=embedding, batch=batch, output_root=output_root)
    raise ValueError(f"Unsupported batch embedding provider '{embedding.provider}'.")
