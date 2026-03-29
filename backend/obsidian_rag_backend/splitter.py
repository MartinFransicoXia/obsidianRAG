from __future__ import annotations

import re
from typing import List

from .models import Document, TextChunk


class TextSplitter:
    def __init__(self, chunk_size: int, chunk_overlap: int, min_chunk_size: int):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def _split_long_text(self, text: str) -> List[str]:
        text = text.strip()
        if not text:
            return []
        if len(text) <= self.chunk_size:
            return [text]

        pieces: List[str] = []
        step = max(1, self.chunk_size - self.chunk_overlap)
        start = 0
        while start < len(text):
            piece = text[start : start + self.chunk_size].strip()
            if piece:
                pieces.append(piece)
            start += step
        return pieces

    def _append_chunk(
        self,
        chunks: List[TextChunk],
        document: Document,
        content: str,
        start_pos: int,
        chunk_index: int,
    ) -> int:
        for piece in self._split_long_text(content):
            if len(piece) < self.min_chunk_size:
                continue
            chunks.append(
                TextChunk(
                    content=piece,
                    metadata=document.metadata.copy(),
                    chunk_id=f"{document.metadata['relative_path']}::{chunk_index}",
                    start_pos=start_pos,
                    end_pos=start_pos + len(piece),
                )
            )
            chunk_index += 1
        return chunk_index

    def split_document(self, document: Document) -> List[TextChunk]:
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", document.content) if part.strip()]
        chunks: List[TextChunk] = []
        current = ""
        current_start = 0
        chunk_index = 0

        for paragraph in paragraphs:
            for part in self._split_long_text(paragraph):
                candidate = f"{current}\n\n{part}" if current else part
                if current and len(candidate) > self.chunk_size:
                    chunk_index = self._append_chunk(
                        chunks,
                        document,
                        current,
                        current_start,
                        chunk_index,
                    )
                    overlap = current[-self.chunk_overlap :] if len(current) > self.chunk_overlap else current
                    current_start = current_start + len(current) - len(overlap)
                    current = overlap
                    candidate = f"{current}\n\n{part}" if current else part

                current = candidate

        if current and len(current) >= self.min_chunk_size:
            self._append_chunk(
                chunks,
                document,
                current,
                current_start,
                chunk_index,
            )

        return chunks

    def split_documents(self, documents: List[Document]) -> List[TextChunk]:
        all_chunks: List[TextChunk] = []
        for document in documents:
            all_chunks.extend(self.split_document(document))
        return all_chunks
