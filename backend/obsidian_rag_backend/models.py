from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class Document:
    content: str
    metadata: Dict[str, Any]


@dataclass
class TextChunk:
    content: str
    metadata: Dict[str, Any]
    chunk_id: str
    start_pos: int
    end_pos: int


@dataclass
class SearchHit:
    chunk_id: str
    content: str
    metadata: Dict[str, Any]
    distance: float
    similarity: float


@dataclass
class SessionMessage:
    role: str
    content: str
    thinking: str = ""
    sources: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class VaultPaths:
    vault_root: Path
    plugin_root: Path
    data_root: Path
    vector_root: Path
    sessions_root: Path
    chats_root: Path
    manifest_path: Path
    active_session_path: Path


@dataclass
class ChatResult:
    session_id: str
    answer: str
    sources: List[Dict[str, Any]]
    thinking: str = ""
    exported_path: Optional[str] = None
