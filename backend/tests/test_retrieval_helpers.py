from __future__ import annotations

from datetime import date
import sys
import types
import unittest

if "chromadb" not in sys.modules:
    class _FakeCollection:
        def count(self):
            return 0

    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def get_or_create_collection(self, *args, **kwargs):
            return _FakeCollection()

    fake_settings_module = types.SimpleNamespace(Settings=lambda **kwargs: kwargs)
    sys.modules["chromadb"] = types.SimpleNamespace(PersistentClient=_FakeClient)
    sys.modules["chromadb.config"] = fake_settings_module

from obsidian_rag_backend.models import ContextGroup, RetrievalConfig, SearchHit
from obsidian_rag_backend.service import ObsidianRAGService, extract_entity_terms


class RetrievalHelperTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = ObsidianRAGService(ollama_host="http://127.0.0.1:11434")
        self.retrieval = RetrievalConfig(
            similarity_threshold=None,
            max_results=8,
            retrieval_limit=30,
            rerank_candidates=15,
            final_note_count=3,
            chunk_target_tokens=420,
            chunk_overlap_tokens=64,
            chunk_max_tokens=520,
            neighbor_window=1,
            same_note_group_merge_gap=1,
            final_group_count_cap=3,
            final_context_token_budget=5000,
            enable_temporal_expansion=True,
            temporal_window_days=2,
            enable_second_pass_entity_expansion=True,
            enable_query_rewrite=False,
        )

    def test_extract_entity_terms_keeps_meaningful_tokens(self) -> None:
        terms = extract_entity_terms("最近我和Alice在ProjectAtlas里讨论北京出差计划")
        self.assertIn("Alice", terms)
        self.assertIn("ProjectAtlas", terms)
        self.assertTrue(any("北京" in term for term in terms))

    def test_query_has_temporal_hint_detects_dates_and_recent_words(self) -> None:
        self.assertTrue(self.service._query_has_temporal_hint("我最近在纠结什么"))
        self.assertTrue(self.service._query_has_temporal_hint("2026-04-02 我做了什么"))
        self.assertFalse(self.service._query_has_temporal_hint("帮我总结 Project Atlas"))

    def test_select_diverse_groups_prefers_different_notes(self) -> None:
        groups = [
            ContextGroup(
                group_id="A1",
                note_id="A",
                relative_path="A.md",
                note_date=date(2026, 4, 1),
                chunk_ids=["A::0"],
                merged_text="alpha",
                token_count=100,
                vector_score=0.92,
                group_score=0.92,
                hit_count=2,
            ),
            ContextGroup(
                group_id="A2",
                note_id="A",
                relative_path="A.md",
                note_date=date(2026, 4, 1),
                chunk_ids=["A::1"],
                merged_text="alpha second",
                token_count=100,
                vector_score=0.90,
                group_score=0.90,
                hit_count=2,
            ),
            ContextGroup(
                group_id="B1",
                note_id="B",
                relative_path="B.md",
                note_date=date(2026, 4, 2),
                chunk_ids=["B::0"],
                merged_text="beta",
                token_count=100,
                vector_score=0.88,
                group_score=0.88,
                hit_count=1,
            ),
        ]

        selected = self.service._select_diverse_groups(groups, self.retrieval)
        self.assertEqual(selected[0].note_id, "A")
        self.assertEqual(selected[1].note_id, "B")

    def test_build_groups_merges_hits_within_gap_and_keeps_token_count(self) -> None:
        hits = [
            SearchHit(
                chunk_id="A::0",
                content="alpha",
                metadata={},
                distance=0.0,
                similarity=0.92,
                note_id="A",
                relative_path="A.md",
                chunk_index=0,
                token_count=90,
            ),
            SearchHit(
                chunk_id="A::2",
                content="beta",
                metadata={},
                distance=0.0,
                similarity=0.90,
                note_id="A",
                relative_path="A.md",
                chunk_index=2,
                token_count=110,
            ),
            SearchHit(
                chunk_id="A::5",
                content="gamma",
                metadata={},
                distance=0.0,
                similarity=0.88,
                note_id="A",
                relative_path="A.md",
                chunk_index=5,
                token_count=120,
            ),
        ]

        groups = self.service._build_groups(hits, self.retrieval)
        self.assertEqual(len(groups), 2)
        self.assertEqual(groups[0].chunk_ids, ["A::0", "A::2"])
        self.assertEqual(groups[0].token_count, 200)
        self.assertEqual(groups[1].chunk_ids, ["A::5"])

    def test_pack_context_groups_respects_budget_but_keeps_one_group(self) -> None:
        groups = [
            ContextGroup(
                group_id="A1",
                note_id="A",
                relative_path="A.md",
                note_date=date(2026, 4, 1),
                chunk_ids=["A::0"],
                merged_text="alpha",
                token_count=6000,
                vector_score=0.95,
                group_score=0.95,
                hit_count=1,
            ),
            ContextGroup(
                group_id="B1",
                note_id="B",
                relative_path="B.md",
                note_date=date(2026, 4, 2),
                chunk_ids=["B::0"],
                merged_text="beta",
                token_count=300,
                vector_score=0.80,
                group_score=0.80,
                hit_count=1,
            ),
        ]
        retrieval = RetrievalConfig(
            similarity_threshold=None,
            max_results=8,
            retrieval_limit=30,
            rerank_candidates=15,
            final_note_count=3,
            chunk_target_tokens=420,
            chunk_overlap_tokens=64,
            chunk_max_tokens=520,
            neighbor_window=1,
            same_note_group_merge_gap=1,
            final_group_count_cap=3,
            final_context_token_budget=1000,
            enable_temporal_expansion=True,
            temporal_window_days=2,
            enable_second_pass_entity_expansion=True,
            enable_query_rewrite=False,
        )

        packed = self.service._pack_context_groups(groups, retrieval)
        self.assertEqual(len(packed), 1)
        self.assertEqual(packed[0].group_id, "A1")
        self.assertEqual(packed[0].source_diversity_rank, 1)


if __name__ == "__main__":
    unittest.main()
