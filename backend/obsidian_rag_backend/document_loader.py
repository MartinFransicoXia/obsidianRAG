from __future__ import annotations

import re
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable, List

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - fallback for minimal runtime environments
    yaml = None

from .models import Document, VaultPaths


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
DATE_PATTERNS = ("%Y-%m-%d", "%Y_%m_%d", "%Y.%m.%d")


class VaultDocumentLoader:
    def __init__(self, vault_paths: VaultPaths, extension: str = ".md"):
        self.vault_paths = vault_paths
        self.extension = extension

    def _should_skip(self, path: Path) -> bool:
        try:
            relative = path.relative_to(self.vault_paths.vault_root).as_posix()
        except ValueError:
            return True

        if not relative.endswith(self.extension):
            return True
        if relative.startswith(".obsidian/plugins/obsidianRAG/data/"):
            return True
        if relative.startswith("AI Chats/"):
            return True
        if relative.startswith(".trash/"):
            return True
        return False

    def iter_files(self) -> Iterable[Path]:
        for path in self.vault_paths.vault_root.rglob(f"*{self.extension}"):
            if path.is_file() and not self._should_skip(path):
                yield path

    def list_entries(self) -> List[dict]:
        entries = []
        for path in self.iter_files():
            stat = path.stat()
            entries.append(
                {
                    "relative_path": path.relative_to(self.vault_paths.vault_root).as_posix(),
                    "size": stat.st_size,
                    "modified": int(stat.st_mtime),
                }
            )
        entries.sort(key=lambda item: item["relative_path"])
        return entries

    def _extract_frontmatter(self, content: str) -> tuple[dict[str, Any], str]:
        match = FRONTMATTER_RE.match(content)
        if not match:
            return {}, content
        raw = match.group(1)
        parsed = self._parse_frontmatter(raw)
        if not isinstance(parsed, dict):
            parsed = {}
        return parsed, content[match.end() :]

    def _parse_frontmatter(self, raw: str) -> dict[str, Any]:
        if yaml is not None:
            return yaml.safe_load(raw) or {}

        parsed: dict[str, Any] = {}
        for line in raw.splitlines():
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            parsed[key.strip()] = value.strip()
        return parsed

    def _parse_date_like(self, value: Any) -> date | None:
        if isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        if not isinstance(value, str):
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        for pattern in DATE_PATTERNS:
            try:
                return datetime.strptime(cleaned, pattern).date()
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(cleaned).date()
        except ValueError:
            return None

    def _extract_date(self, frontmatter: dict[str, Any], path: Path, relative_path: str) -> date | None:
        frontmatter_date = self._parse_date_like(frontmatter.get("date"))
        if frontmatter_date is not None:
            return frontmatter_date

        stem = path.stem
        parsed_stem = self._parse_date_like(stem)
        if parsed_stem is not None:
            return parsed_stem

        normalized = relative_path.lower()
        if any(token in normalized for token in ("daily", "journal", "diary")):
            for part in reversed(path.parts):
                parsed = self._parse_date_like(Path(part).stem)
                if parsed is not None:
                    return parsed
        return None

    def _infer_doc_type(self, frontmatter: dict[str, Any], relative_path: str, title: str, note_date: date | None) -> str:
        explicit = frontmatter.get("type")
        if isinstance(explicit, str) and explicit.strip():
            return explicit.strip().lower()

        normalized_path = relative_path.lower()
        normalized_title = title.lower()
        if any(token in normalized_path for token in ("daily", "journal", "diary")) or note_date is not None:
            return "daily_note"
        if any(token in normalized_path or token in normalized_title for token in ("meeting", "minutes", "1on1")):
            return "meeting"
        if any(token in normalized_path or token in normalized_title for token in ("project", "roadmap", "milestone")):
            return "project"
        if title.strip():
            return "note"
        return "other"

    def _build_document(self, path: Path) -> Document:
        raw_content = path.read_text(encoding="utf-8")
        stat = path.stat()
        relative_path = path.relative_to(self.vault_paths.vault_root).as_posix()
        frontmatter, content = self._extract_frontmatter(raw_content)
        note_title = str(frontmatter.get("title") or path.stem)
        note_date = self._extract_date(frontmatter, path, relative_path)
        doc_type = self._infer_doc_type(frontmatter, relative_path, note_title, note_date)
        return Document(
            content=content,
            metadata={
                "filename": path.name,
                "filepath": str(path),
                "relative_path": relative_path,
                "file_size": stat.st_size,
                "modified_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "source": "obsidian_vault",
                "frontmatter": frontmatter,
                "note_title": note_title,
                "note_id": relative_path,
                "doc_type": doc_type,
                "note_date": note_date.isoformat() if note_date else None,
            },
        )

    def load_documents(self) -> List[Document]:
        return [self._build_document(path) for path in self.iter_files()]

    def load_note(self, relative_path: str) -> Document:
        path = (self.vault_paths.vault_root / relative_path).resolve()
        if self._should_skip(path) or not path.is_file():
            raise FileNotFoundError(f"Note not found: {relative_path}")
        return self._build_document(path)
