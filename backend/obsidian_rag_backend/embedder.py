from __future__ import annotations

import os
from typing import List

import numpy as np
import requests
from sentence_transformers import SentenceTransformer

from .config import DEFAULT_EMBEDDING_API_BASE

QWEN3_QUERY_INSTRUCTION = "Given a user question, retrieve relevant notes that help answer it."


class _SentenceTransformerEmbedder:
    def __init__(self, model_name: str):
        os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
        os.environ.setdefault("HTTP_PROXY", "")
        os.environ.setdefault("HTTPS_PROXY", "")
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        return self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

    def embed_query(self, text: str, instruction: str | None = None) -> np.ndarray:
        query_text = text.strip()
        if instruction:
            query_text = f"Instruct: {instruction}\nQuery: {query_text}"
        return self.model.encode([query_text], convert_to_numpy=True, normalize_embeddings=True)[0]

    def health(self) -> bool:
        return True


class _VLLMEmbedder:
    def __init__(self, model_name: str, api_base: str):
        self.model_name = model_name
        self.api_base = api_base.rstrip("/")
        self.session = requests.Session()
        self.session.trust_env = False

    def _embed(self, inputs: List[str]) -> np.ndarray:
        response = self.session.post(
            f"{self.api_base}/embeddings",
            json={"model": self.model_name, "input": inputs, "encoding_format": "float"},
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        vectors = [item["embedding"] for item in data.get("data", [])]
        if len(vectors) != len(inputs):
            raise RuntimeError("Embedding response size mismatch.")
        return np.asarray(vectors, dtype=np.float32)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        batches: List[np.ndarray] = []
        for start in range(0, len(texts), batch_size):
            batches.append(self._embed(texts[start:start + batch_size]))
        if not batches:
            return np.empty((0, 0), dtype=np.float32)
        return np.vstack(batches)

    def embed_query(self, text: str, instruction: str | None = None) -> np.ndarray:
        query_text = text.strip()
        if instruction:
            query_text = f"Instruct: {instruction}\nQuery: {query_text}"
        return self._embed([query_text])[0]

    def health(self) -> bool:
        response = self.session.get(f"{self.api_base}/models", timeout=10)
        return response.status_code == 200


class LocalEmbedder:
    def __init__(
        self,
        model_name: str,
        backend: str = "vllm",
        api_base: str | None = None,
        query_instruction: str = QWEN3_QUERY_INSTRUCTION,
    ):
        self.model_name = model_name
        self.backend = (backend or "vllm").strip().lower()
        self.api_base = (api_base or DEFAULT_EMBEDDING_API_BASE).rstrip("/")
        self.query_instruction = query_instruction.strip()
        if self.backend == "sentence-transformers":
            self.impl = _SentenceTransformerEmbedder(model_name)
        else:
            self.impl = _VLLMEmbedder(model_name, self.api_base)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        return self.impl.embed_texts(texts, batch_size=batch_size)

    def embed_query(self, text: str) -> np.ndarray:
        return self.impl.embed_query(text, instruction=self.query_instruction)

    def health(self) -> bool:
        return self.impl.health()
