from __future__ import annotations

from typing import List

import chromadb
from chromadb.config import Settings

from .models import SearchHit, TextChunk, VaultPaths


class VectorStore:
    def __init__(self, vault_paths: VaultPaths, collection_name: str = "obsidian_notes"):
        self.vault_paths = vault_paths
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(
            path=str(vault_paths.vector_root),
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )

    def reset_collection(self) -> None:
        try:
            self.client.delete_collection(self.collection_name)
        except Exception:
            pass

    def _collection(self):
        return self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(self, chunks: List[TextChunk], embeddings: List[List[float]]) -> None:
        collection = self._collection()
        max_batch_size = getattr(self.client, "max_batch_size", None) or 5000
        for start in range(0, len(chunks), max_batch_size):
            batch_chunks = chunks[start:start + max_batch_size]
            batch_embeddings = embeddings[start:start + max_batch_size]
            print(
                "[obsidianRAG] vector_store add "
                f"start={start} end={start + len(batch_chunks)} batch_size={len(batch_chunks)}"
            )
            collection.add(
                ids=[chunk.chunk_id for chunk in batch_chunks],
                embeddings=[
                    embedding.tolist() if hasattr(embedding, "tolist") else list(embedding)
                    for embedding in batch_embeddings
                ],
                documents=[chunk.content for chunk in batch_chunks],
                metadatas=[
                    {
                        "filename": chunk.metadata.get("filename", "unknown"),
                        "filepath": chunk.metadata.get("filepath", "unknown"),
                        "relative_path": chunk.metadata.get("relative_path", "unknown"),
                        "note_id": chunk.note_id or chunk.metadata.get("relative_path", "unknown"),
                        "note_title": chunk.note_title,
                        "doc_type": chunk.doc_type,
                        "note_date": chunk.note_date.isoformat() if chunk.note_date else None,
                        "chunk_id": chunk.chunk_id,
                        "chunk_index": chunk.chunk_index,
                        "prev_chunk_id": chunk.prev_chunk_id,
                        "next_chunk_id": chunk.next_chunk_id,
                        "section_title": chunk.section_title,
                        "heading_path": " > ".join(chunk.heading_path),
                        "token_count": chunk.token_count,
                        "start_pos": chunk.start_pos,
                        "end_pos": chunk.end_pos,
                        "source": chunk.metadata.get("source", "unknown"),
                    }
                    for chunk in batch_chunks
                ],
            )

    def count(self) -> int:
        return self._collection().count()

    def get_chunks_for_note(self, relative_path: str) -> List[SearchHit]:
        collection = self._collection()
        raw = collection.get(where={"relative_path": relative_path}, include=["documents", "metadatas"])
        documents = raw.get("documents", [])
        metadatas = raw.get("metadatas", [])
        hits: List[SearchHit] = []
        for document, metadata in zip(documents, metadatas):
            hits.append(
                SearchHit(
                    chunk_id=metadata.get("chunk_id", "unknown"),
                    content=document,
                    metadata=metadata,
                    distance=0.0,
                    similarity=0.0,
                    note_id=metadata.get("note_id", ""),
                    relative_path=metadata.get("relative_path", ""),
                    chunk_index=int(metadata.get("chunk_index", 0) or 0),
                    score=0.0,
                    source="note",
                    token_count=int(metadata.get("token_count", 0) or 0),
                )
            )
        hits.sort(key=lambda item: item.chunk_index)
        return hits

    def get_chunks_by_note_date(self, note_date: str) -> List[SearchHit]:
        collection = self._collection()
        raw = collection.get(where={"note_date": note_date}, include=["documents", "metadatas"])
        documents = raw.get("documents", [])
        metadatas = raw.get("metadatas", [])
        hits: List[SearchHit] = []
        for document, metadata in zip(documents, metadatas):
            hits.append(
                SearchHit(
                    chunk_id=metadata.get("chunk_id", "unknown"),
                    content=document,
                    metadata=metadata,
                    distance=0.0,
                    similarity=0.0,
                    note_id=metadata.get("note_id", ""),
                    relative_path=metadata.get("relative_path", ""),
                    chunk_index=int(metadata.get("chunk_index", 0) or 0),
                    score=0.0,
                    source="temporal",
                    token_count=int(metadata.get("token_count", 0) or 0),
                )
            )
        hits.sort(key=lambda item: (item.relative_path, item.chunk_index))
        return hits

    def get_all_chunks(self) -> List[SearchHit]:
        collection = self._collection()
        raw = collection.get(include=["documents", "metadatas"])
        documents = raw.get("documents", [])
        metadatas = raw.get("metadatas", [])
        hits: List[SearchHit] = []
        for document, metadata in zip(documents, metadatas):
            hits.append(
                SearchHit(
                    chunk_id=metadata.get("chunk_id", "unknown"),
                    content=document,
                    metadata=metadata,
                    distance=0.0,
                    similarity=0.0,
                    note_id=metadata.get("note_id", ""),
                    relative_path=metadata.get("relative_path", ""),
                    chunk_index=int(metadata.get("chunk_index", 0) or 0),
                    score=0.0,
                    source="entity_expansion",
                    token_count=int(metadata.get("token_count", 0) or 0),
                )
            )
        hits.sort(key=lambda item: (item.relative_path, item.chunk_index))
        return hits

    def search(self, query_embedding, threshold: float, max_results: int) -> List[SearchHit]:
        collection = self._collection()
        total = collection.count()
        if total == 0:
            return []

        query_vector = query_embedding.tolist() if hasattr(query_embedding, "tolist") else list(query_embedding)
        raw = collection.query(
            query_embeddings=[query_vector],
            n_results=min(max_results, total),
            include=["documents", "metadatas", "distances"],
        )
        hits: List[SearchHit] = []
        documents = raw.get("documents", [[]])
        metadatas = raw.get("metadatas", [[]])
        distances = raw.get("distances", [[]])
        if not documents or not documents[0]:
            return []

        for document, metadata, distance in zip(documents[0], metadatas[0], distances[0]):
            similarity = 1 - float(distance)
            if similarity < threshold:
                continue
            hits.append(
                SearchHit(
                    chunk_id=metadata.get("chunk_id", "unknown"),
                    content=document,
                    metadata=metadata,
                    distance=float(distance),
                    similarity=similarity,
                    note_id=metadata.get("note_id", ""),
                    relative_path=metadata.get("relative_path", ""),
                    chunk_index=int(metadata.get("chunk_index", 0) or 0),
                    score=similarity,
                    source="vector",
                    token_count=int(metadata.get("token_count", 0) or 0),
                )
            )
        return hits
