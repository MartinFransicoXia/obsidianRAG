from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Iterable, List

from .models import Document, VaultPaths


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

    def load_documents(self) -> List[Document]:
        documents: List[Document] = []
        for path in self.iter_files():
            content = path.read_text(encoding="utf-8")
            stat = path.stat()
            documents.append(
                Document(
                    content=content,
                    metadata={
                        "filename": path.name,
                        "filepath": str(path),
                        "relative_path": path.relative_to(self.vault_paths.vault_root).as_posix(),
                        "file_size": stat.st_size,
                        "modified_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "source": "obsidian_vault",
                    },
                )
            )
        return documents
