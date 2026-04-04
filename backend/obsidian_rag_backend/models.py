from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
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
    content_with_prefix: str = ""
    note_id: str = ""
    relative_path: str = ""
    filepath: str = ""
    note_title: str = ""
    doc_type: str = "note"
    note_date: Optional[date] = None
    chunk_index: int = 0
    prev_chunk_id: Optional[str] = None
    next_chunk_id: Optional[str] = None
    section_title: Optional[str] = None
    heading_path: List[str] = field(default_factory=list)
    token_count: int = 0


@dataclass
class SearchHit:
    chunk_id: str
    content: str
    metadata: Dict[str, Any]
    distance: float
    similarity: float
    note_id: str = ""
    relative_path: str = ""
    chunk_index: int = 0
    score: float = 0.0
    source: str = "vector"
    token_count: int = 0
    rerank_score: Optional[float] = None


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
    index_jobs_root: Path
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


@dataclass
class NoteContext:
    relative_path: str
    filepath: str
    content: str
    similarity: float
    chunk_id: str
    rerank_score: Optional[float] = None


@dataclass
class ContextGroup:
    group_id: str
    note_id: str
    relative_path: str
    note_date: Optional[date]
    chunk_ids: List[str]
    merged_text: str
    token_count: int
    vector_score: float
    rerank_score: Optional[float] = None
    group_score: float = 0.0
    hit_count: int = 0
    source_diversity_rank: Optional[int] = None
    filepath: str = ""


@dataclass
class ChatProviderConfig:
    provider: str
    api_base: str
    api_key: str
    model: str
    enable_thinking: bool = False


@dataclass
class EmbeddingProviderConfig:
    provider: str
    api_base: str
    api_key: str
    model: str
    dimensions: int = 0
    encoding_format: str = "float"


@dataclass
class EmbeddingBatchConfig:
    enabled: bool = False
    api_base: str = ""
    api_key: str = ""
    completion_window: str = "24h"
    poll_interval_seconds: int = 30
    output_dir: str = ""
    delete_remote_files_after_download: bool = False
    enable_callback: bool = False
    callback_url: str = ""


@dataclass
class RerankProviderConfig:
    provider: str
    api_base: str
    api_key: str
    model: str
    top_n: int = 10
    instruct: str = ""
    return_documents: bool = True
    timeout_seconds: int = 60


@dataclass
class RetrievalConfig:
    similarity_threshold: Optional[float]
    max_results: int
    retrieval_limit: int
    rerank_candidates: int
    final_note_count: int
    chunk_target_tokens: int
    chunk_overlap_tokens: int
    chunk_max_tokens: int
    neighbor_window: int
    same_note_group_merge_gap: int
    final_group_count_cap: int
    final_context_token_budget: int
    enable_temporal_expansion: bool = True
    temporal_window_days: int = 2
    enable_second_pass_entity_expansion: bool = False
    enable_query_rewrite: bool = False
    indexing_mode: str = "realtime"


@dataclass
class BatchJobRecord:
    job_id: str
    provider: str
    input_file_path: str
    model: str
    created_at: datetime
    updated_at: datetime
    chunk_ids: List[str]
    provider_job_id: Optional[str] = None
    output_file_path: Optional[str] = None
    error_file_path: Optional[str] = None
    output_file_id: Optional[str] = None
    error_file_id: Optional[str] = None
    status: str = "queued"
    request_counts: Dict[str, int] = field(default_factory=lambda: {"total": 0, "completed": 0, "failed": 0})
    file_count: int = 0
    chunk_count: int = 0
    message: str = ""


@dataclass
class IndexMetadata:
    embedding_provider: str
    embedding_model: str
    embedding_dimensions: int
    embedding_encoding_format: str
    chunk_target_tokens: int
    chunk_overlap_tokens: int
    chunk_max_tokens: int
    prefix_rule_version: str
    index_version: str
    created_at: datetime
