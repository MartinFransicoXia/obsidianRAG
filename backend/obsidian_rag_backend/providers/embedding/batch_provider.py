from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
from typing import Any, Protocol, runtime_checkable
from uuid import uuid4

import requests

from ...models import BatchJobRecord, EmbeddingBatchConfig, EmbeddingProviderConfig, TextChunk


@runtime_checkable
class BatchEmbeddingProvider(Protocol):
    def health(self) -> bool:
        ...

    def submit_embedding_batch(self, chunks: list[TextChunk]) -> BatchJobRecord:
        ...

    def poll_batch_status(self, job_id: str) -> dict:
        ...

    def download_batch_results(self, job_id: str) -> list[dict]:
        ...

    def cancel_batch(self, job_id: str) -> None:
        ...


class DashScopeBatchEmbeddingProvider:
    def __init__(
        self,
        embedding: EmbeddingProviderConfig,
        batch: EmbeddingBatchConfig,
        output_root: Path,
    ):
        self.embedding = embedding
        self.batch = batch
        self.output_root = output_root
        self.output_root.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.trust_env = False

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {}
        if self.batch.api_key:
            headers["Authorization"] = f"Bearer {self.batch.api_key}"
        return headers

    def health(self) -> bool:
        response = self.session.get(
            f"{self.batch.api_base.rstrip('/')}/models",
            headers=self._headers(),
            timeout=30,
        )
        return response.status_code == 200

    def _job_dir(self, job_id: str) -> Path:
        path = self.output_root / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _jsonl_line(self, chunk: TextChunk) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.embedding.model,
            "input": chunk.content_with_prefix,
            "encoding_format": self.embedding.encoding_format,
        }
        if self.embedding.dimensions > 0:
            body["dimensions"] = self.embedding.dimensions
        return {
            "custom_id": f"chunk::{chunk.chunk_id}",
            "method": "POST",
            "url": "/v1/embeddings",
            "body": body,
        }

    def _write_jsonl(self, job_id: str, chunks: list[TextChunk]) -> Path:
        job_dir = self._job_dir(job_id)
        path = job_dir / "input.jsonl"
        with path.open("w", encoding="utf-8") as handle:
            for chunk in chunks:
                handle.write(json.dumps(self._jsonl_line(chunk), ensure_ascii=False) + "\n")
        return path

    def _upload_file(self, input_path: Path) -> dict[str, Any]:
        with input_path.open("rb") as handle:
            response = self.session.post(
                f"{self.batch.api_base.rstrip('/')}/files",
                headers=self._headers(),
                data={"purpose": "batch"},
                files={"file": (input_path.name, handle, "application/jsonl")},
                timeout=180,
            )
        response.raise_for_status()
        return response.json()

    def _create_batch(self, file_id: str) -> dict[str, Any]:
        response = self.session.post(
            f"{self.batch.api_base.rstrip('/')}/batches",
            headers={**self._headers(), "Content-Type": "application/json"},
            json={
                "input_file_id": file_id,
                "endpoint": "/v1/embeddings",
                "completion_window": self.batch.completion_window,
            },
            timeout=180,
        )
        response.raise_for_status()
        return response.json()

    def submit_embedding_batch(self, chunks: list[TextChunk]) -> BatchJobRecord:
        job_id = f"local_{uuid4().hex}"
        input_path = self._write_jsonl(job_id, chunks)
        file_payload = self._upload_file(input_path)
        batch_payload = self._create_batch(file_payload["id"])
        now = datetime.now()
        return BatchJobRecord(
            job_id=job_id,
            provider="dashscope",
            provider_job_id=batch_payload["id"],
            input_file_path=str(input_path),
            model=self.embedding.model,
            created_at=now,
            updated_at=now,
            chunk_ids=[chunk.chunk_id for chunk in chunks],
            status=batch_payload.get("status", "queued"),
            request_counts={"total": len(chunks), "completed": 0, "failed": 0},
            file_count=0,
            chunk_count=len(chunks),
            message="Batch embedding job submitted.",
        )

    def poll_batch_status(self, job_id: str) -> dict:
        response = self.session.get(
            f"{self.batch.api_base.rstrip('/')}/batches/{job_id}",
            headers=self._headers(),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def _download_file_content(self, file_id: str) -> str:
        response = self.session.get(
            f"{self.batch.api_base.rstrip('/')}/files/{file_id}/content",
            headers=self._headers(),
            timeout=180,
        )
        response.raise_for_status()
        return response.text

    def download_batch_results(self, job_id: str) -> list[dict]:
        raw_text = self._download_file_content(job_id)
        results: list[dict] = []
        for line in raw_text.splitlines():
            line = line.strip()
            if not line:
                continue
            results.append(json.loads(line))
        return results

    def cancel_batch(self, job_id: str) -> None:
        response = self.session.post(
            f"{self.batch.api_base.rstrip('/')}/batches/{job_id}/cancel",
            headers=self._headers(),
            timeout=60,
        )
        response.raise_for_status()

    def delete_file(self, file_id: str) -> None:
        response = self.session.delete(
            f"{self.batch.api_base.rstrip('/')}/files/{file_id}",
            headers=self._headers(),
            timeout=60,
        )
        response.raise_for_status()
