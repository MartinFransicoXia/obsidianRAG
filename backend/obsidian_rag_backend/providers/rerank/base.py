from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class RerankResult:
    index: int
    score: float
    document: str | None = None


@runtime_checkable
class RerankProvider(Protocol):
    def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        ...

    def health(self) -> bool:
        ...
