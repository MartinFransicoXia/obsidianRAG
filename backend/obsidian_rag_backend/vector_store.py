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
                        "chunk_id": chunk.chunk_id,
                        "start_pos": chunk.start_pos,
                        "end_pos": chunk.end_pos,
                        "source": chunk.metadata.get("source", "unknown"),
                    }
                    for chunk in batch_chunks
                ],
            )

    def count(self) -> int:
        return self._collection().count()

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
                )
            )
        return hits
