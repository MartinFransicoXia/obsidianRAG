from __future__ import annotations

from typing import Any

import requests

from .base import RerankResult


class DashScopeRerankProvider:
    def __init__(
        self,
        model_name: str,
        api_base: str,
        api_key: str,
        instruct: str = "",
        return_documents: bool = True,
        timeout_seconds: int = 60,
    ):
        self.model_name = model_name
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key.strip()
        self.instruct = instruct.strip()
        self.return_documents = return_documents
        self.timeout_seconds = max(1, timeout_seconds)
        self.session = requests.Session()
        self.session.trust_env = False

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _payload(self, query: str, documents: list[str], top_n: int) -> dict[str, Any]:
        if self.model_name == "qwen3-rerank":
            payload: dict[str, Any] = {
                "model": self.model_name,
                "query": query,
                "documents": documents,
                "top_n": top_n,
            }
            if self.instruct:
                payload["instruct"] = self.instruct
            return payload

        return {
            "model": self.model_name,
            "input": {
                "query": query,
                "documents": documents,
            },
            "parameters": {
                "top_n": top_n,
                "return_documents": self.return_documents,
            },
        }

    def health(self) -> bool:
        if not self.api_key:
            return False
        try:
            self.rerank("health check", ["health check"], top_n=1)
        except Exception:
            return False
        return True

    def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        if not documents:
            return []
        response = self.session.post(
            f"{self.api_base}/api/v1/services/rerank/text-rerank/text-rerank",
            json=self._payload(query, documents, top_n),
            headers=self._headers(),
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("output", {}).get("results", [])
        normalized: list[RerankResult] = []
        for item in results:
            index = int(item.get("index", 0))
            document = item.get("document")
            if isinstance(document, dict):
                document = document.get("text")
            normalized.append(
                RerankResult(
                    index=index,
                    score=float(item.get("relevance_score") or item.get("score") or 0.0),
                    document=document if isinstance(document, str) else None,
                )
            )
        normalized.sort(key=lambda item: item.score, reverse=True)
        return normalized[:top_n]
