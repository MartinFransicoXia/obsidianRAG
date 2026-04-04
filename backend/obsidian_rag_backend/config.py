from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Dict

from .models import VaultPaths

PLUGIN_ID = "obsidianRAG"
DEFAULT_CHAT_PROVIDER = "ollama"
DEFAULT_CHAT_API_BASE = ""
DEFAULT_EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B"
DEFAULT_EMBEDDING_PROVIDER = "vllm"
DEFAULT_EMBEDDING_API_BASE = "http://127.0.0.1:8001/v1"
DEFAULT_EMBEDDING_DIMENSIONS = 0
DEFAULT_EMBEDDING_ENCODING_FORMAT = "float"
DEFAULT_RERANK_MODEL = "Qwen/Qwen3-Reranker-4B"
DEFAULT_RERANK_PROVIDER = "vllm"
DEFAULT_RERANK_API_BASE = "http://127.0.0.1:8002"
DEFAULT_DASHSCOPE_API_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_DASHSCOPE_RERANK_API_BASE = "https://dashscope.aliyuncs.com"
DEFAULT_EMBEDDING_BATCH_COMPLETION_WINDOW = "24h"
DEFAULT_EMBEDDING_BATCH_POLL_SECONDS = 30
DEFAULT_CHAT_MODEL = "qwen3-vl:30b"
DEFAULT_THRESHOLD = 0.72
DEFAULT_MAX_RESULTS = 8
DEFAULT_RETRIEVAL_LIMIT = 30
MAX_RETRIEVAL_LIMIT = 50
DEFAULT_RERANK_CANDIDATES = 15
MAX_RERANK_CANDIDATES = 30
DEFAULT_FINAL_NOTE_COUNT = 5
DEFAULT_CHUNK_TARGET_TOKENS = 420
DEFAULT_CHUNK_OVERLAP_TOKENS = 64
DEFAULT_CHUNK_MAX_TOKENS = 520
DEFAULT_NEIGHBOR_WINDOW = 1
DEFAULT_GROUP_MERGE_GAP = 1
DEFAULT_FINAL_GROUP_COUNT_CAP = 8
DEFAULT_FINAL_CONTEXT_TOKEN_BUDGET = 4800
DEFAULT_TEMPORAL_WINDOW_DAYS = 2
DEFAULT_PREFIX_RULE_VERSION = "v1"
DEFAULT_INDEX_VERSION = "v2"
DEFAULT_INDEXING_MODE = "realtime"
DEFAULT_MIN_CHUNK_SIZE = 5
DEFAULT_PORT = 8765


def resolve_vault_paths(vault_path: str) -> VaultPaths:
    vault_root = Path(vault_path).expanduser().resolve()
    plugin_root = vault_root / ".obsidian" / "plugins" / PLUGIN_ID
    data_root = plugin_root / "data"
    vector_root = data_root / "vector_db"
    index_jobs_root = data_root / "index_jobs"
    sessions_root = data_root / "sessions"
    chats_root = vault_root / "AI Chats"
    manifest_path = data_root / "index_manifest.json"
    active_session_path = sessions_root / "active_session.json"
    return VaultPaths(
        vault_root=vault_root,
        plugin_root=plugin_root,
        data_root=data_root,
        vector_root=vector_root,
        index_jobs_root=index_jobs_root,
        sessions_root=sessions_root,
        chats_root=chats_root,
        manifest_path=manifest_path,
        active_session_path=active_session_path,
    )


def ensure_vault_dirs(paths: VaultPaths) -> None:
    paths.data_root.mkdir(parents=True, exist_ok=True)
    paths.vector_root.mkdir(parents=True, exist_ok=True)
    paths.index_jobs_root.mkdir(parents=True, exist_ok=True)
    paths.sessions_root.mkdir(parents=True, exist_ok=True)
    paths.chats_root.mkdir(parents=True, exist_ok=True)


def build_index_signature(entries: list[Dict[str, object]], settings: Dict[str, object]) -> str:
    payload = json.dumps({"entries": entries, "settings": settings}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
