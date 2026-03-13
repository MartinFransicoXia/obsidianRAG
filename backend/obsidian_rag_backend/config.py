from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Dict

from .models import VaultPaths

PLUGIN_ID = "obsidianRAG"
DEFAULT_EMBEDDING_MODEL = "BAAI/bge-small-zh-v1.5"
DEFAULT_CHAT_MODEL = "qwen3-vl:30b"
DEFAULT_THRESHOLD = 0.72
DEFAULT_MAX_RESULTS = 8
DEFAULT_CHUNK_SIZE = 200
DEFAULT_CHUNK_OVERLAP = 80
DEFAULT_MIN_CHUNK_SIZE = 5
DEFAULT_PORT = 8765


def resolve_vault_paths(vault_path: str) -> VaultPaths:
    vault_root = Path(vault_path).expanduser().resolve()
    plugin_root = vault_root / ".obsidian" / "plugins" / PLUGIN_ID
    data_root = plugin_root / "data"
    vector_root = data_root / "vector_db"
    sessions_root = data_root / "sessions"
    chats_root = vault_root / "AI Chats"
    manifest_path = data_root / "index_manifest.json"
    active_session_path = sessions_root / "active_session.json"
    return VaultPaths(
        vault_root=vault_root,
        plugin_root=plugin_root,
        data_root=data_root,
        vector_root=vector_root,
        sessions_root=sessions_root,
        chats_root=chats_root,
        manifest_path=manifest_path,
        active_session_path=active_session_path,
    )


def ensure_vault_dirs(paths: VaultPaths) -> None:
    paths.data_root.mkdir(parents=True, exist_ok=True)
    paths.vector_root.mkdir(parents=True, exist_ok=True)
    paths.sessions_root.mkdir(parents=True, exist_ok=True)
    paths.chats_root.mkdir(parents=True, exist_ok=True)


def build_index_signature(entries: list[Dict[str, object]], settings: Dict[str, object]) -> str:
    payload = json.dumps({"entries": entries, "settings": settings}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
