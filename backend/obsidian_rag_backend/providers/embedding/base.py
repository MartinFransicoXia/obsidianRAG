from __future__ import annotations

from typing import Literal, Protocol, runtime_checkable


EmbeddingUsage = Literal["query", "index_realtime", "index_batch"]


@runtime_checkable
class EmbeddingProvider(Protocol):
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...

    def embed_query(self, text: str) -> list[float]:
        ...

    def health(self) -> bool:
        ...
