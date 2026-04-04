from __future__ import annotations

from dataclasses import asdict
from datetime import date, datetime
import json
from pathlib import Path
from typing import Any

from .models import BatchJobRecord, TextChunk, VaultPaths


class IndexJobStore:
    def __init__(self, vault_paths: VaultPaths):
        self.vault_paths = vault_paths
        self.active_job_path = vault_paths.index_jobs_root / "active_index_job.json"

    def _job_dir(self, job_id: str) -> Path:
        path = self.vault_paths.index_jobs_root / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _serialize_chunk(self, chunk: TextChunk) -> dict[str, Any]:
        payload = asdict(chunk)
        if isinstance(chunk.note_date, date):
            payload["note_date"] = chunk.note_date.isoformat()
        return payload

    def _deserialize_chunk(self, payload: dict[str, Any]) -> TextChunk:
        note_date = payload.get("note_date")
        if isinstance(note_date, str) and note_date:
            payload = {**payload, "note_date": date.fromisoformat(note_date)}
        return TextChunk(**payload)

    def _serialize_record(self, record: BatchJobRecord) -> dict[str, Any]:
        payload = asdict(record)
        payload["created_at"] = record.created_at.isoformat()
        payload["updated_at"] = record.updated_at.isoformat()
        return payload

    def _deserialize_record(self, payload: dict[str, Any]) -> BatchJobRecord:
        data = payload.copy()
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return BatchJobRecord(**data)

    def save_job(self, record: BatchJobRecord, chunks: list[TextChunk]) -> None:
        job_dir = self._job_dir(record.job_id)
        (job_dir / "chunks.json").write_text(
            json.dumps([self._serialize_chunk(chunk) for chunk in chunks], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        self.save_record(record)

    def save_record(self, record: BatchJobRecord) -> None:
        job_dir = self._job_dir(record.job_id)
        payload = self._serialize_record(record)
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        (job_dir / "record.json").write_text(text, encoding="utf-8")
        self.active_job_path.write_text(text, encoding="utf-8")

    def load_active_record(self) -> BatchJobRecord | None:
        if not self.active_job_path.exists():
            return None
        return self._deserialize_record(json.loads(self.active_job_path.read_text(encoding="utf-8")))

    def load_record(self, job_id: str) -> BatchJobRecord | None:
        path = self._job_dir(job_id) / "record.json"
        if not path.exists():
            return None
        return self._deserialize_record(json.loads(path.read_text(encoding="utf-8")))

    def load_chunks(self, job_id: str) -> list[TextChunk]:
        path = self._job_dir(job_id) / "chunks.json"
        if not path.exists():
            return []
        payload = json.loads(path.read_text(encoding="utf-8"))
        return [self._deserialize_chunk(item) for item in payload]

    def clear_active_job(self, job_id: str | None = None) -> None:
        if not self.active_job_path.exists():
            return
        if job_id is None:
            self.active_job_path.unlink()
            return
        active = self.load_active_record()
        if active and active.job_id == job_id:
            self.active_job_path.unlink()
