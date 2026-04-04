from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import re
from typing import List

from .models import Document, TextChunk


HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
SENTENCE_SPLIT_RE = re.compile(r"(?<=[。！？!?\.])\s+")


def estimate_token_count(text: str) -> int:
    ascii_words = re.findall(r"[A-Za-z0-9_]+", text)
    cjk_chars = re.findall(r"[\u4e00-\u9fff]", text)
    punctuation = re.findall(r"[^\w\s]", text)
    return max(1, len(ascii_words) + len(cjk_chars) + max(0, len(punctuation) // 2))


@dataclass
class TextUnit:
    text: str
    start_pos: int
    end_pos: int
    token_count: int


@dataclass
class Section:
    heading_path: list[str]
    section_title: str | None
    start_pos: int
    end_pos: int
    content: str


class TextSplitter:
    def __init__(self, chunk_size: int, chunk_overlap: int, min_chunk_size: int):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def _split_sections(self, content: str) -> list[Section]:
        if not content.strip():
            return []

        lines = content.splitlines(keepends=True)
        sections: list[Section] = []
        heading_stack: list[tuple[int, str]] = []
        section_lines: list[str] = []
        section_heading_path: list[str] = []
        section_title: str | None = None
        section_start = 0
        offset = 0
        in_code_block = False

        def flush(current_offset: int) -> None:
            text = "".join(section_lines).strip()
            if not text:
                return
            sections.append(
                Section(
                    heading_path=list(section_heading_path),
                    section_title=section_title,
                    start_pos=section_start,
                    end_pos=current_offset,
                    content=text,
                )
            )

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block

            heading_match = HEADING_RE.match(line.strip()) if not in_code_block else None
            if heading_match:
                flush(offset)
                level = len(heading_match.group(1))
                title = heading_match.group(2).strip()
                heading_stack = [(lvl, text) for lvl, text in heading_stack if lvl < level]
                heading_stack.append((level, title))
                section_heading_path = [text for _, text in heading_stack]
                section_title = title
                section_lines = []
                section_start = offset
            else:
                section_lines.append(line)
            offset += len(line)

        flush(offset)
        return sections or [Section(heading_path=[], section_title=None, start_pos=0, end_pos=len(content), content=content.strip())]

    def _split_blocks(self, section: Section) -> list[TextUnit]:
        lines = section.content.splitlines(keepends=True)
        blocks: list[TextUnit] = []
        block_lines: list[str] = []
        block_start = section.start_pos
        offset = section.start_pos
        in_code_block = False

        def flush(current_offset: int) -> None:
            text = "".join(block_lines).strip()
            if not text:
                return
            blocks.extend(self._split_large_text(text, block_start, current_offset))

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
            is_blank = not stripped
            if is_blank and not in_code_block:
                flush(offset)
                block_lines = []
                block_start = offset + len(line)
            else:
                if not block_lines:
                    block_start = offset
                block_lines.append(line)
            offset += len(line)

        flush(offset)
        return blocks

    def _split_large_text(self, text: str, start_pos: int, end_pos: int) -> list[TextUnit]:
        token_count = estimate_token_count(text)
        if token_count <= self.chunk_size:
            return [TextUnit(text=text, start_pos=start_pos, end_pos=end_pos, token_count=token_count)]

        sentences = [part.strip() for part in SENTENCE_SPLIT_RE.split(text) if part.strip()]
        if len(sentences) > 1:
            units: list[TextUnit] = []
            cursor = start_pos
            for sentence in sentences:
                units.extend(self._split_large_text(sentence, cursor, cursor + len(sentence)))
                cursor += len(sentence) + 1
            return units

        hard_limit = max(1, self.chunk_size * 4)
        pieces: list[TextUnit] = []
        step = max(1, hard_limit - self.chunk_overlap * 4)
        local_start = 0
        while local_start < len(text):
            piece = text[local_start : local_start + hard_limit].strip()
            if piece:
                piece_start = start_pos + local_start
                pieces.append(
                    TextUnit(
                        text=piece,
                        start_pos=piece_start,
                        end_pos=piece_start + len(piece),
                        token_count=estimate_token_count(piece),
                    )
                )
            local_start += step
        return pieces

    def _build_prefix(self, document: Document, section: Section) -> str:
        metadata = document.metadata
        lines = [f"[Note] {metadata.get('relative_path', 'unknown')}"]
        note_title = str(metadata.get("note_title") or metadata.get("filename") or "").strip()
        if note_title:
            lines.append(f"[Title] {note_title}")
        doc_type = str(metadata.get("doc_type") or "").strip()
        if doc_type:
            lines.append(f"[Type] {doc_type}")
        note_date = str(metadata.get("note_date") or "").strip()
        if note_date:
            lines.append(f"[Date] {note_date}")
        if section.heading_path:
            lines.append(f"[Section] {' > '.join(section.heading_path)}")
        return "\n".join(lines)

    def _combine_units(self, document: Document, section: Section, units: list[TextUnit], chunk_index_start: int) -> list[TextChunk]:
        if not units:
            return []

        chunks: list[TextChunk] = []
        start_index = 0
        chunk_index = chunk_index_start
        prefix = self._build_prefix(document, section)
        note_date_raw = document.metadata.get("note_date")
        note_date = date.fromisoformat(note_date_raw) if isinstance(note_date_raw, str) and note_date_raw else None

        while start_index < len(units):
            end_index = start_index
            current_units: list[TextUnit] = []
            current_tokens = 0
            while end_index < len(units):
                candidate_tokens = current_tokens + units[end_index].token_count
                if current_units and candidate_tokens > self.chunk_size:
                    break
                current_units.append(units[end_index])
                current_tokens = candidate_tokens
                if current_tokens >= self.chunk_size:
                    end_index += 1
                    break
                end_index += 1

            text = "\n\n".join(unit.text for unit in current_units).strip()
            if estimate_token_count(text) >= self.min_chunk_size:
                content_with_prefix = f"{prefix}\n\n{text}".strip()
                chunks.append(
                    TextChunk(
                        content=text,
                        content_with_prefix=content_with_prefix,
                        metadata=document.metadata.copy(),
                        chunk_id=f"{document.metadata['relative_path']}::{chunk_index}",
                        start_pos=current_units[0].start_pos,
                        end_pos=current_units[-1].end_pos,
                        note_id=str(document.metadata.get("note_id", document.metadata.get("relative_path", ""))),
                        relative_path=str(document.metadata.get("relative_path", "")),
                        filepath=str(document.metadata.get("filepath", "")),
                        note_title=str(document.metadata.get("note_title", document.metadata.get("filename", ""))),
                        doc_type=str(document.metadata.get("doc_type", "note")),
                        note_date=note_date,
                        chunk_index=chunk_index,
                        section_title=section.section_title,
                        heading_path=list(section.heading_path),
                        token_count=estimate_token_count(content_with_prefix),
                    )
                )
                chunk_index += 1

            if end_index >= len(units):
                break

            overlap_tokens = 0
            next_start = end_index
            for idx in range(end_index - 1, start_index - 1, -1):
                overlap_tokens += units[idx].token_count
                next_start = idx
                if overlap_tokens >= self.chunk_overlap:
                    break
            start_index = next_start if next_start > start_index else start_index + 1

        return chunks

    def split_document(self, document: Document) -> List[TextChunk]:
        sections = self._split_sections(document.content)
        chunks: list[TextChunk] = []
        chunk_index = 0
        for section in sections:
            units = self._split_blocks(section)
            new_chunks = self._combine_units(document, section, units, chunk_index)
            chunks.extend(new_chunks)
            chunk_index += len(new_chunks)

        for index, chunk in enumerate(chunks):
            chunk.prev_chunk_id = chunks[index - 1].chunk_id if index > 0 else None
            chunk.next_chunk_id = chunks[index + 1].chunk_id if index + 1 < len(chunks) else None
        return chunks

    def split_documents(self, documents: List[Document]) -> List[TextChunk]:
        all_chunks: List[TextChunk] = []
        for document in documents:
            all_chunks.extend(self.split_document(document))
        return all_chunks
