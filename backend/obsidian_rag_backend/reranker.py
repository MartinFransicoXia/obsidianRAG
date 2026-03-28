from __future__ import annotations

from typing import List

import requests

from .models import SearchHit


class VLLMReranker:
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

    def rerank(self, query: str, hits: List[SearchHit], top_k: int) -> List[SearchHit]:
        if not hits:
            return []

        documents = [hit.content for hit in hits]
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
        if not isinstance(scores, list) or len(scores) != len(hits):
            raise RuntimeError("Rerank response size mismatch.")

        reranked: List[SearchHit] = []
        for hit, item in zip(hits, scores):
            score = item.get("score")
            reranked.append(
                SearchHit(
                    chunk_id=hit.chunk_id,
                    content=hit.content,
                    metadata=hit.metadata,
                    distance=hit.distance,
                    similarity=hit.similarity,
                    rerank_score=float(score) if score is not None else None,
                )
            )
        reranked.sort(key=lambda hit: (hit.rerank_score is None, -(hit.rerank_score or 0.0), -hit.similarity))
        return reranked[:top_k]
