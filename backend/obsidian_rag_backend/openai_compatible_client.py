from __future__ import annotations

import json
from typing import Iterator, List

import requests

from .models import SearchHit, SessionMessage
from .ollama_client import build_rag_messages


class OpenAICompatibleClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key.strip()
        self.session = requests.Session()
        self.session.trust_env = False

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def health(self) -> bool:
        response = self.session.get(f"{self.base_url}/models", headers=self._headers(), timeout=10)
        return response.status_code == 200

    def get_models(self) -> List[str]:
        response = self.session.get(f"{self.base_url}/models", headers=self._headers(), timeout=15)
        response.raise_for_status()
        data = response.json()
        return [item.get("id", "") for item in data.get("data", []) if item.get("id")]

    def stream_chat(
        self,
        model: str,
        query: str,
        hits: List[SearchHit],
        history: List[SessionMessage],
        enable_thinking: bool = False,
    ) -> Iterator[dict]:
        payload = {
            "model": model.strip(),
            "messages": build_rag_messages(query, hits, history),
            "stream": True,
        }
        if enable_thinking:
            payload["thinking"] = {"type": "enabled"}
        response = self.session.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=self._headers(),
            timeout=None,
            stream=True,
        )
        if response.status_code >= 400:
            detail = response.text.strip()
            raise RuntimeError(f"OpenAI-compatible chat failed for model '{payload['model']}': HTTP {response.status_code} {detail}")

        for raw_line in response.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            line = raw_line.strip()
            if not line.startswith("data:"):
                continue
            data_text = line[5:].strip()
            if data_text == "[DONE]":
                break
            data = json.loads(data_text)
            choices = data.get("choices", [])
            if not choices:
                continue
            delta = choices[0].get("delta", {})
            thinking = (
                delta.get("reasoning_content")
                or delta.get("reasoning")
                or delta.get("thinking")
                or ""
            )
            if thinking:
                yield {"type": "thinking", "delta": thinking}

            content = delta.get("content") or ""
            if isinstance(content, list):
                content = "".join(
                    item.get("text", "")
                    for item in content
                    if isinstance(item, dict) and item.get("type") == "text"
                )
            if content:
                yield {"type": "content", "delta": content}
