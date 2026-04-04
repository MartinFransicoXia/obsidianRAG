from __future__ import annotations

import unittest
from pathlib import Path

from obsidian_rag_backend.config import ensure_vault_dirs, resolve_vault_paths
from obsidian_rag_backend.document_loader import VaultDocumentLoader
from obsidian_rag_backend.splitter import TextSplitter


class DocumentLoaderAndSplitterTests(unittest.TestCase):
    def test_loader_extracts_doc_type_and_date(self) -> None:
        vault_root = Path(__file__).resolve().parent / "fixtures" / "vault"
        paths = resolve_vault_paths(str(vault_root))
        ensure_vault_dirs(paths)
        loader = VaultDocumentLoader(paths)
        document = loader.load_note("Daily/2026-04-02.md")

        self.assertEqual(document.metadata["note_title"], "Daily Reflection")
        self.assertEqual(document.metadata["doc_type"], "daily_note")
        self.assertEqual(document.metadata["note_date"], "2026-04-02")
        self.assertNotIn("---", document.content)

    def test_splitter_preserves_heading_path_and_chunk_links(self) -> None:
        content = (
            "# Project Alpha\n\n"
            "Intro paragraph.\n\n"
            "## Status\n\n"
            "First update sentence. Second update sentence. Third update sentence.\n\n"
            "## Next Steps\n\n"
            "Plan item one.\n"
            "Plan item two.\n"
        )
        document = loader_document(content)
        splitter = TextSplitter(chunk_size=12, chunk_overlap=2, min_chunk_size=1)
        chunks = splitter.split_document(document)

        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(chunks[0].heading_path, ["Project Alpha"])
        self.assertIn(chunks[-1].section_title, {"Status", "Next Steps"})
        self.assertIsNone(chunks[0].prev_chunk_id)
        self.assertIsNone(chunks[-1].next_chunk_id)
        self.assertEqual(chunks[0].next_chunk_id, chunks[1].chunk_id)
        self.assertTrue(chunks[0].content_with_prefix.startswith("[Note] Notes/project-alpha.md"))


def loader_document(content: str):
    from obsidian_rag_backend.models import Document

    return Document(
        content=content,
        metadata={
            "filename": "project-alpha.md",
            "filepath": "F:/vault/Notes/project-alpha.md",
            "relative_path": "Notes/project-alpha.md",
            "source": "obsidian_vault",
            "note_title": "Project Alpha",
            "note_id": "Notes/project-alpha.md",
            "doc_type": "project",
            "note_date": None,
        },
    )


if __name__ == "__main__":
    unittest.main()
