from __future__ import annotations

from typing import Any

import requests


class DashScopeEmbeddingProvider:
    def __init__(
        self,
        model_name: str,
        api_base: str,
        api_key: str,
        query_instruction: str,
        dimensions: int = 0,
        encoding_format: str = "float",
    ):
        self.model_name = model_name
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key.strip()
        self.query_instruction = query_instruction.strip()
        self.dimensions = dimensions
        self.encoding_format = encoding_format or "float"
        self.session = requests.Session()
        self.session.trust_env = False

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _payload(self, texts: list[str]) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "input": texts,
            "encoding_format": self.encoding_format,
        }
        if self.dimensions > 0:
            payload["dimensions"] = self.dimensions
        return payload

    def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = self.session.post(
            f"{self.api_base}/embeddings",
            json=self._payload(texts),
            headers=self._headers(),
            timeout=180,
        )
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data", [])
        vectors = [item["embedding"] for item in data]
        if len(vectors) != len(texts):
            raise RuntimeError("Embedding response size mismatch.")
        return vectors

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), 10):
            vectors.extend(self._embed_batch(texts[start : start + 10]))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        query_text = text.strip()
        if self.query_instruction:
            query_text = f"Instruct: {self.query_instruction}\nQuery: {query_text}"
        return self._embed_batch([query_text])[0]

    def health(self) -> bool:
        response = self.session.get(f"{self.api_base}/models", headers=self._headers(), timeout=10)
        return response.status_code == 200
