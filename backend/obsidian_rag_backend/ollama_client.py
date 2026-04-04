from __future__ import annotations

import json
from typing import Iterator, List

import requests

from .models import ContextGroup, NoteContext, SearchHit, SessionMessage


MODEL_ALIASES = {
    "qwen-vl:30b": "qwen3-vl:30b",
}


def build_rag_messages(query: str, hits: List[SearchHit] | List[NoteContext] | List[ContextGroup], history: List[SessionMessage]) -> list[dict]:
    context_blocks = []
    for hit in hits:
        relative_path = hit.metadata.get("relative_path", "unknown") if hasattr(hit, "metadata") else getattr(hit, "relative_path", "unknown")
        similarity = getattr(hit, "similarity", getattr(hit, "vector_score", 0.0))
        rerank_score = getattr(hit, "rerank_score", None)
        content = getattr(hit, "content", getattr(hit, "merged_text", ""))
        score_suffix = f" | rerank={rerank_score:.3f}" if rerank_score is not None else ""
        context_blocks.append(f"[Source: {relative_path} | similarity={similarity:.3f}{score_suffix}]\n{content}")
    context = "\n\n---\n\n".join(context_blocks) if context_blocks else "No matching notes found."

    history_lines = []
    for item in history[-4:]:
        history_lines.append(f"{item.role}: {item.content}")
    history_text = "\n".join(history_lines) if history_lines else "No previous turns."

    system_prompt = (
        "You are an Obsidian vault assistant. "
        "Answer in Chinese. Base your answer on the retrieved notes when possible. "
        "If the notes are insufficient, say so clearly. Keep the answer concise and factual."
    )
    user_prompt = (
        f"Conversation history:\n{history_text}\n\n"
        f"Retrieved notes:\n{context}\n\n"
        f"User question:\n{query}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


class OllamaClient:
    def __init__(self, host: str):
        self.host = host.rstrip("/")
        self.session = requests.Session()
        self.session.trust_env = False

    def health(self) -> bool:
        response = self.session.get(f"{self.host}/api/tags", timeout=5)
        return response.status_code == 200

    def get_models(self) -> List[str]:
        response = self.session.get(f"{self.host}/api/tags", timeout=10)
        response.raise_for_status()
        data = response.json()
        return [item.get("name", "") for item in data.get("models", []) if item.get("name")]

    def resolve_model(self, model: str) -> str:
        requested = model.strip()
        if not requested:
            return requested

        alias = MODEL_ALIASES.get(requested)
        available = self.get_models()
        if requested in available:
            return requested
        if alias and alias in available:
            return alias

        normalized = requested.replace("-", "")
        for candidate in available:
            if candidate.replace("-", "") == normalized:
                return candidate
        return requested

    def build_messages(self, query: str, hits: List[SearchHit] | List[NoteContext] | List[ContextGroup], history: List[SessionMessage]) -> list[dict]:
        return build_rag_messages(query, hits, history)

    def stream_chat(
        self,
        model: str,
        query: str,
        hits: List[SearchHit] | List[NoteContext] | List[ContextGroup],
        history: List[SessionMessage],
        enable_thinking: bool = False,
    ) -> Iterator[dict]:
        resolved_model = self.resolve_model(model)
        payload = {
            "model": resolved_model,
            "messages": self.build_messages(query, hits, history),
            "stream": True,
        }
        response = self.session.post(f"{self.host}/api/chat", json=payload, timeout=None, stream=True)
        if response.status_code >= 400:
            detail = response.text.strip()
            raise RuntimeError(f"Ollama chat failed for model '{resolved_model}': HTTP {response.status_code} {detail}")

        for raw_line in response.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            data = json.loads(raw_line)
            if data.get("error"):
                raise RuntimeError(str(data["error"]))
            message = data.get("message", {})
            thinking = message.get("thinking") or ""
            if thinking:
                yield {"type": "thinking", "delta": thinking}
            content = message.get("content") or ""
            if content:
                yield {"type": "content", "delta": content}
