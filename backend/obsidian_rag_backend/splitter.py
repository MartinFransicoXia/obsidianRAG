from __future__ import annotations

import re
from typing import List

from .models import Document, TextChunk


class TextSplitter:
    def __init__(self, chunk_size: int, chunk_overlap: int, min_chunk_size: int):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def split_document(self, document: Document) -> List[TextChunk]:
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", document.content) if part.strip()]
        chunks: List[TextChunk] = []
        current = ""
        current_start = 0
        chunk_index = 0

        for paragraph in paragraphs:
            candidate = f"{current}\n\n{paragraph}" if current else paragraph
            if current and len(candidate) > self.chunk_size:
                chunks.append(
                    TextChunk(
                        content=current,
                        metadata=document.metadata.copy(),
                        chunk_id=f"{document.metadata['relative_path']}::{chunk_index}",
                        start_pos=current_start,
                        end_pos=current_start + len(current),
                    )
                )
                overlap = current[-self.chunk_overlap :] if len(current) > self.chunk_overlap else current
                current_start = current_start + len(current) - len(overlap)
                current = overlap
                chunk_index += 1
            current = f"{current}\n\n{paragraph}" if current else paragraph

        if current and len(current) >= self.min_chunk_size:
            chunks.append(
                TextChunk(
                    content=current,
                    metadata=document.metadata.copy(),
                    chunk_id=f"{document.metadata['relative_path']}::{chunk_index}",
                    start_pos=current_start,
                    end_pos=current_start + len(current),
                )
            )

        return chunks

    def split_documents(self, documents: List[Document]) -> List[TextChunk]:
        all_chunks: List[TextChunk] = []
        for document in documents:
            all_chunks.extend(self.split_document(document))
        return all_chunks
