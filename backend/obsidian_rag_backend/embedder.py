from __future__ import annotations

import os
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer


class LocalEmbedder:
    def __init__(self, model_name: str):
        os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
        os.environ.setdefault("HTTP_PROXY", "")
        os.environ.setdefault("HTTPS_PROXY", "")
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        return self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

    def embed_query(self, text: str) -> np.ndarray:
        return self.model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
