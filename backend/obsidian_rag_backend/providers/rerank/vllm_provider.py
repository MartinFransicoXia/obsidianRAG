from __future__ import annotations

import requests

from .base import RerankResult


class VLLMRerankProvider:
    def __init__(self, model_name: str, api_base: str):
        self.model_name = model_name
        self.api_base = api_base.rstrip("/")
        self.session = requests.Session()
        self.session.trust_env = False

    def health(self) -> bool:
        response = self.session.get(f"{self.api_base}/health", timeout=10)
        if response.status_code == 200:
            return True
        response = self.session.get(f"{self.api_base}/version", timeout=10)
        return response.status_code == 200

    def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        if not documents:
            return []
        response = self.session.post(
            f"{self.api_base}/score",
            json={
                "model": self.model_name,
                "text_1": [query] * len(documents),
                "text_2": documents,
            },
            timeout=180,
        )
        response.raise_for_status()
        payload = response.json()
        scores = payload.get("data")
        if not isinstance(scores, list) or len(scores) != len(documents):
            raise RuntimeError("Rerank response size mismatch.")
        results = [
            RerankResult(index=index, score=float(item.get("score") or 0.0), document=documents[index])
            for index, item in enumerate(scores)
        ]
        results.sort(key=lambda item: item.score, reverse=True)
        return results[:top_n]
