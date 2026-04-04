from __future__ import annotations

import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import uvicorn

from obsidian_rag_backend.config import (
    DEFAULT_CHAT_API_BASE,
    DEFAULT_CHAT_MODEL,
    DEFAULT_CHAT_PROVIDER,
    DEFAULT_DASHSCOPE_API_BASE,
    DEFAULT_DASHSCOPE_RERANK_API_BASE,
    DEFAULT_EMBEDDING_API_BASE,
    DEFAULT_EMBEDDING_BATCH_COMPLETION_WINDOW,
    DEFAULT_EMBEDDING_BATCH_POLL_SECONDS,
    DEFAULT_EMBEDDING_DIMENSIONS,
    DEFAULT_EMBEDDING_ENCODING_FORMAT,
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_EMBEDDING_PROVIDER,
    DEFAULT_FINAL_CONTEXT_TOKEN_BUDGET,
    DEFAULT_FINAL_GROUP_COUNT_CAP,
    DEFAULT_FINAL_NOTE_COUNT,
    DEFAULT_GROUP_MERGE_GAP,
    DEFAULT_INDEXING_MODE,
    DEFAULT_MAX_RESULTS,
    DEFAULT_NEIGHBOR_WINDOW,
    DEFAULT_PORT,
    DEFAULT_RERANK_API_BASE,
    DEFAULT_RERANK_CANDIDATES,
    DEFAULT_RERANK_MODEL,
    DEFAULT_RERANK_PROVIDER,
    DEFAULT_RETRIEVAL_LIMIT,
    DEFAULT_TEMPORAL_WINDOW_DAYS,
    DEFAULT_THRESHOLD,
    MAX_RERANK_CANDIDATES,
    MAX_RETRIEVAL_LIMIT,
    DEFAULT_CHUNK_MAX_TOKENS,
    DEFAULT_CHUNK_OVERLAP_TOKENS,
    DEFAULT_CHUNK_TARGET_TOKENS,
)
from obsidian_rag_backend.models import (
    ChatProviderConfig,
    EmbeddingBatchConfig,
    EmbeddingProviderConfig,
    RetrievalConfig,
    RerankProviderConfig,
)
from obsidian_rag_backend.service import ObsidianRAGService


class ChatConfigModel(BaseModel):
    provider: str = DEFAULT_CHAT_PROVIDER
    api_base: str = DEFAULT_CHAT_API_BASE
    api_key: str = ""
    model: str = DEFAULT_CHAT_MODEL
    enable_thinking: bool = False

    def to_runtime(self) -> ChatProviderConfig:
        return ChatProviderConfig(
            provider=self.provider,
            api_base=self.api_base,
            api_key=self.api_key,
            model=self.model,
            enable_thinking=self.enable_thinking,
        )


class EmbeddingConfigModel(BaseModel):
    provider: str = DEFAULT_EMBEDDING_PROVIDER
    api_base: str = DEFAULT_EMBEDDING_API_BASE
    api_key: str = ""
    model: str = DEFAULT_EMBEDDING_MODEL
    dimensions: int = DEFAULT_EMBEDDING_DIMENSIONS
    encoding_format: str = DEFAULT_EMBEDDING_ENCODING_FORMAT

    def to_runtime(self) -> EmbeddingProviderConfig:
        return EmbeddingProviderConfig(
            provider=self.provider,
            api_base=self.api_base,
            api_key=self.api_key,
            model=self.model,
            dimensions=self.dimensions,
            encoding_format=self.encoding_format,
        )


class EmbeddingBatchConfigModel(BaseModel):
    enabled: bool = False
    api_base: str = DEFAULT_DASHSCOPE_API_BASE
    api_key: str = ""
    completion_window: str = DEFAULT_EMBEDDING_BATCH_COMPLETION_WINDOW
    poll_interval_seconds: int = DEFAULT_EMBEDDING_BATCH_POLL_SECONDS
    output_dir: str = ""
    delete_remote_files_after_download: bool = False
    enable_callback: bool = False
    callback_url: str = ""

    def to_runtime(self) -> EmbeddingBatchConfig:
        return EmbeddingBatchConfig(
            enabled=self.enabled,
            api_base=self.api_base,
            api_key=self.api_key,
            completion_window=self.completion_window,
            poll_interval_seconds=self.poll_interval_seconds,
            output_dir=self.output_dir,
            delete_remote_files_after_download=self.delete_remote_files_after_download,
            enable_callback=self.enable_callback,
            callback_url=self.callback_url,
        )


class RerankConfigModel(BaseModel):
    provider: str = DEFAULT_RERANK_PROVIDER
    api_base: str = DEFAULT_RERANK_API_BASE
    api_key: str = ""
    model: str = DEFAULT_RERANK_MODEL
    top_n: int = 10
    instruct: str = ""
    return_documents: bool = True
    timeout_seconds: int = 60

    def to_runtime(self) -> RerankProviderConfig:
        return RerankProviderConfig(
            provider=self.provider,
            api_base=self.api_base,
            api_key=self.api_key,
            model=self.model,
            top_n=self.top_n,
            instruct=self.instruct,
            return_documents=self.return_documents,
            timeout_seconds=self.timeout_seconds,
        )


class RetrievalConfigModel(BaseModel):
    similarity_threshold: float | None = DEFAULT_THRESHOLD
    max_results: int = DEFAULT_MAX_RESULTS
    retrieval_limit: int = Field(default=DEFAULT_RETRIEVAL_LIMIT, ge=1, le=MAX_RETRIEVAL_LIMIT)
    rerank_candidates: int = Field(default=DEFAULT_RERANK_CANDIDATES, ge=1, le=MAX_RERANK_CANDIDATES)
    final_note_count: int = Field(default=DEFAULT_FINAL_NOTE_COUNT, ge=1)
    chunk_target_tokens: int = DEFAULT_CHUNK_TARGET_TOKENS
    chunk_overlap_tokens: int = DEFAULT_CHUNK_OVERLAP_TOKENS
    chunk_max_tokens: int = DEFAULT_CHUNK_MAX_TOKENS
    neighbor_window: int = DEFAULT_NEIGHBOR_WINDOW
    same_note_group_merge_gap: int = DEFAULT_GROUP_MERGE_GAP
    final_group_count_cap: int = DEFAULT_FINAL_GROUP_COUNT_CAP
    final_context_token_budget: int = DEFAULT_FINAL_CONTEXT_TOKEN_BUDGET
    enable_temporal_expansion: bool = True
    temporal_window_days: int = DEFAULT_TEMPORAL_WINDOW_DAYS
    enable_second_pass_entity_expansion: bool = False
    enable_query_rewrite: bool = False
    indexing_mode: str = DEFAULT_INDEXING_MODE

    def to_runtime(self) -> RetrievalConfig:
        return RetrievalConfig(
            similarity_threshold=self.similarity_threshold,
            max_results=self.max_results,
            retrieval_limit=self.retrieval_limit,
            rerank_candidates=self.rerank_candidates,
            final_note_count=self.final_note_count,
            chunk_target_tokens=self.chunk_target_tokens,
            chunk_overlap_tokens=self.chunk_overlap_tokens,
            chunk_max_tokens=self.chunk_max_tokens,
            neighbor_window=self.neighbor_window,
            same_note_group_merge_gap=self.same_note_group_merge_gap,
            final_group_count_cap=self.final_group_count_cap,
            final_context_token_budget=self.final_context_token_budget,
            enable_temporal_expansion=self.enable_temporal_expansion,
            temporal_window_days=self.temporal_window_days,
            enable_second_pass_entity_expansion=self.enable_second_pass_entity_expansion,
            enable_query_rewrite=self.enable_query_rewrite,
            indexing_mode=self.indexing_mode,
        )


class StatusRequest(BaseModel):
    vault_path: str
    chat: ChatConfigModel = Field(default_factory=ChatConfigModel)
    embedding: EmbeddingConfigModel = Field(default_factory=EmbeddingConfigModel)
    batch: EmbeddingBatchConfigModel = Field(default_factory=EmbeddingBatchConfigModel)
    rerank: RerankConfigModel = Field(default_factory=RerankConfigModel)
    retrieval: RetrievalConfigModel = Field(default_factory=RetrievalConfigModel)


class BuildIndexRequest(BaseModel):
    vault_path: str
    embedding: EmbeddingConfigModel = Field(default_factory=EmbeddingConfigModel)
    batch: EmbeddingBatchConfigModel = Field(default_factory=EmbeddingBatchConfigModel)
    retrieval: RetrievalConfigModel = Field(default_factory=RetrievalConfigModel)


class BuildIndexStatusRequest(BaseModel):
    vault_path: str
    job_id: str | None = None
    embedding: EmbeddingConfigModel = Field(default_factory=EmbeddingConfigModel)
    batch: EmbeddingBatchConfigModel = Field(default_factory=EmbeddingBatchConfigModel)
    retrieval: RetrievalConfigModel = Field(default_factory=RetrievalConfigModel)


class ChatRequest(BaseModel):
    vault_path: str
    query: str = Field(min_length=1)
    chat: ChatConfigModel = Field(default_factory=ChatConfigModel)
    embedding: EmbeddingConfigModel = Field(default_factory=EmbeddingConfigModel)
    rerank: RerankConfigModel = Field(default_factory=RerankConfigModel)
    retrieval: RetrievalConfigModel = Field(default_factory=RetrievalConfigModel)


class EndSessionRequest(BaseModel):
    vault_path: str


class ProviderTestRequest(BaseModel):
    chat: ChatConfigModel | None = None
    embedding: EmbeddingConfigModel | None = None
    batch: EmbeddingBatchConfigModel | None = None
    rerank: RerankConfigModel | None = None


ollama_host = os.environ.get("OBSIDIAN_RAG_OLLAMA_HOST", "http://127.0.0.1:11434")
service = ObsidianRAGService(ollama_host=ollama_host)
app = FastAPI(title="obsidianRAG backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/status")
def status(payload: StatusRequest):
    try:
        return service.get_status(
            payload.vault_path,
            chat=payload.chat.to_runtime(),
            embedding=payload.embedding.to_runtime(),
            batch=payload.batch.to_runtime(),
            rerank=payload.rerank.to_runtime(),
            retrieval=payload.retrieval.to_runtime(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/index/build")
def build_index(payload: BuildIndexRequest):
    try:
        return service.build_index(
            payload.vault_path,
            embedding=payload.embedding.to_runtime(),
            batch=payload.batch.to_runtime(),
            retrieval=payload.retrieval.to_runtime(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/index/build/status")
def build_index_status(payload: BuildIndexStatusRequest):
    try:
        return service.build_index_status(
            vault_path=payload.vault_path,
            job_id=payload.job_id,
            embedding=payload.embedding.to_runtime(),
            batch=payload.batch.to_runtime(),
            retrieval=payload.retrieval.to_runtime(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/index/build/cancel")
def build_index_cancel(payload: BuildIndexStatusRequest):
    try:
        return service.cancel_index_build(
            vault_path=payload.vault_path,
            job_id=payload.job_id,
            embedding=payload.embedding.to_runtime(),
            batch=payload.batch.to_runtime(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        result = service.chat(
            vault_path=payload.vault_path,
            query=payload.query,
            chat=payload.chat.to_runtime(),
            embedding=payload.embedding.to_runtime(),
            rerank=payload.rerank.to_runtime(),
            retrieval=payload.retrieval.to_runtime(),
        )
        return {
            "session_id": result.session_id,
            "answer": result.answer,
            "thinking": result.thinking,
            "sources": result.sources,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    def event_stream():
        try:
            for event in service.stream_chat(
                vault_path=payload.vault_path,
                query=payload.query,
                chat=payload.chat.to_runtime(),
                embedding=payload.embedding.to_runtime(),
                rerank=payload.rerank.to_runtime(),
                retrieval=payload.retrieval.to_runtime(),
            ):
                yield json.dumps(event, ensure_ascii=False) + "\n"
        except Exception as exc:
            yield json.dumps({"type": "error", "message": str(exc)}, ensure_ascii=False) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


@app.post("/provider/test/chat")
def provider_test_chat(payload: ProviderTestRequest):
    try:
        if payload.chat is None:
            raise ValueError("chat config is required")
        return service.test_chat_provider(payload.chat.to_runtime())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/provider/test/embedding")
def provider_test_embedding(payload: ProviderTestRequest):
    try:
        if payload.embedding is None:
            raise ValueError("embedding config is required")
        return service.test_embedding_provider(payload.embedding.to_runtime())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/provider/test/rerank")
def provider_test_rerank(payload: ProviderTestRequest):
    try:
        if payload.rerank is None:
            raise ValueError("rerank config is required")
        return service.test_rerank_provider(payload.rerank.to_runtime())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/provider/test/batch-embedding")
def provider_test_batch_embedding(payload: ProviderTestRequest):
    try:
        if payload.batch is None or payload.embedding is None:
            raise ValueError("batch and embedding config are required")
        return service.test_batch_embedding_provider(
            batch=payload.batch.to_runtime(),
            embedding=payload.embedding.to_runtime(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/session/end")
def end_session(payload: EndSessionRequest):
    try:
        return service.end_session(payload.vault_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    port = int(os.environ.get("OBSIDIAN_RAG_PORT", DEFAULT_PORT))
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=False)
