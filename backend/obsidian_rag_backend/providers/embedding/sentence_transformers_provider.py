from __future__ import annotations

import os

from sentence_transformers import SentenceTransformer


class SentenceTransformersEmbeddingProvider:
    def __init__(self, model_name: str, query_instruction: str):
        os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
        os.environ.setdefault("HTTP_PROXY", "")
        os.environ.setdefault("HTTPS_PROXY", "")
        self.model = SentenceTransformer(model_name)
        self.query_instruction = query_instruction.strip()

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return vectors.tolist()

    def embed_query(self, text: str) -> list[float]:
        query_text = text.strip()
        if self.query_instruction:
            query_text = f"Instruct: {self.query_instruction}\nQuery: {query_text}"
        vector = self.model.encode([query_text], convert_to_numpy=True, normalize_embeddings=True)[0]
        return vector.tolist()

    def health(self) -> bool:
        return True
