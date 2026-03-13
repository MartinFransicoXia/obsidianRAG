from __future__ import annotations

import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import uvicorn

from obsidian_rag_backend.config import DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL, DEFAULT_MAX_RESULTS, DEFAULT_PORT, DEFAULT_THRESHOLD
from obsidian_rag_backend.service import ObsidianRAGService


class StatusRequest(BaseModel):
    vault_path: str
    provider: str = "ollama"
    api_base: str | None = None
    api_key: str | None = None


class BuildIndexRequest(BaseModel):
    vault_path: str


class ChatRequest(BaseModel):
    vault_path: str
    query: str = Field(min_length=1)
    provider: str = "ollama"
    api_base: str | None = None
    api_key: str | None = None
    model: str = DEFAULT_CHAT_MODEL
    enable_thinking: bool = False
    threshold: float = DEFAULT_THRESHOLD
    max_results: int = DEFAULT_MAX_RESULTS


class EndSessionRequest(BaseModel):
    vault_path: str


embedding_model = os.environ.get("OBSIDIAN_RAG_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
ollama_host = os.environ.get("OBSIDIAN_RAG_OLLAMA_HOST", "http://127.0.0.1:11434")
service = ObsidianRAGService(embedding_model=embedding_model, ollama_host=ollama_host)
app = FastAPI(title="obsidianRAG backend", version="0.1.0")
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
            provider=payload.provider,
            api_base=payload.api_base,
            api_key=payload.api_key,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/index/build")
def build_index(payload: BuildIndexRequest):
    try:
        return service.build_index(payload.vault_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        result = service.chat(
            vault_path=payload.vault_path,
            query=payload.query,
            model=payload.model,
            provider=payload.provider,
            api_base=payload.api_base,
            api_key=payload.api_key,
            enable_thinking=payload.enable_thinking,
            threshold=payload.threshold,
            max_results=payload.max_results,
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
                model=payload.model,
                provider=payload.provider,
                api_base=payload.api_base,
                api_key=payload.api_key,
                enable_thinking=payload.enable_thinking,
                threshold=payload.threshold,
                max_results=payload.max_results,
            ):
                yield json.dumps(event, ensure_ascii=False) + "\n"
        except Exception as exc:
            yield json.dumps({"type": "error", "message": str(exc)}, ensure_ascii=False) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


@app.post("/session/end")
def end_session(payload: EndSessionRequest):
    try:
        return service.end_session(payload.vault_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    port = int(os.environ.get("OBSIDIAN_RAG_PORT", DEFAULT_PORT))
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=False)
