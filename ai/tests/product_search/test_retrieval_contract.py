from datetime import datetime, timezone
import unittest

from services.chatbot.search.product_data import ProductSearchDataRow
from services.chatbot.search.vector import ProductSearchResult
from services.product_search.models import ProductSearchDictionarySnapshot
from services.product_search.parser import product_search_query_parser
from services.product_search.planning import (
    build_product_search_execution_plan,
    build_product_search_query_signals,
)
from services.product_search.scorer import rerank_results
from services.product_search.service import ProductSearchService


def _build_snapshot() -> ProductSearchDictionarySnapshot:
    return ProductSearchDictionarySnapshot(
        loaded_at=datetime.now(timezone.utc),
        brands=(),
        categories=(),
        product_types=(),
        ingredients=(),
        line_terms=(),
        attributes=(),
        attribute_groups={
            "barrier": ("판테놀",),
            "brightening": ("나이아신아마이드",),
            "soothing": ("진정", "시카"),
            "pore_care": ("모공",),
        },
        stopwords=frozenset(),
        brand_lookup={
            "성분에디터": "성분에디터",
            "라운드랩": "라운드랩",
            "아이소이": "아이소이",
        },
        category_lookup={
            "토너": "토너",
            "크림": "크림",
        },
        product_type_lookup={},
        ingredient_lookup={
            "판테놀": "판테놀",
            "향료": "향료",
            "세라마이드": "세라마이드엔피",
        },
        ingredient_expansion_lookup={
            "판테놀": ("판테놀",),
            "향료": ("향료",),
            "세라마이드": ("세라마이드엔피", "세라마이드에이피"),
        },
        line_lookup={
            "판테놀": "판테놀",
            "그린토마토": "그린토마토",
        },
        attribute_lookup={},
        attribute_group_lookup={
            "판테놀": "barrier",
            "진정": "soothing",
            "시카": "soothing",
            "모공": "pore_care",
        },
    )


class ProductSearchRetrievalContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.snapshot = _build_snapshot()
        self.service = ProductSearchService()

    def test_long_query_uses_strong_and_weak_keyword_split(self) -> None:
        parsed = product_search_query_parser.parse(
            "성분에디터 그린토마토 모공 진정 토너",
            self.snapshot,
        )

        strong_terms = self.service._resolve_strong_keyword_terms(parsed, self.snapshot)
        weak_terms = self.service._resolve_weak_keyword_terms(parsed, self.snapshot)

        self.assertEqual(strong_terms, ("그린토마토",))
        self.assertEqual(weak_terms, ("모공", "진정"))

    def test_ingredient_seed_requires_ingredient_field_match(self) -> None:
        parsed = product_search_query_parser.parse("판테놀 크림", self.snapshot)
        plan = build_product_search_execution_plan(parsed)
        self.assertEqual(self.service._resolve_weak_keyword_terms(parsed, self.snapshot), ())
        row_without_ingredient = ProductSearchDataRow(
            product_id=1,
            name="판테놀 크림",
            brand_name="테스트",
            category_name="크림",
            category_id=1,
            big_category_id=1,
            description="판테놀 컨셉을 강조한 설명",
            top_skin_type=None,
            top2_skin_type=None,
            concern_names=[],
            ingredient_text_ko=None,
            ingredient_text_en=None,
        )
        row_with_ingredient = ProductSearchDataRow(
            product_id=2,
            name="배리어 크림",
            brand_name="테스트",
            category_name="크림",
            category_id=1,
            big_category_id=1,
            description=None,
            top_skin_type=None,
            top2_skin_type=None,
            concern_names=[],
            ingredient_text_ko="정제수, 판테놀, 글리세린",
            ingredient_text_en=None,
        )

        attribute_group_terms = tuple(self.service._expand_attribute_group_terms(parsed, self.snapshot))
        strong_terms = self.service._resolve_strong_keyword_terms(parsed, self.snapshot)

        missing_score = self.service._score_structured_seed_row(
            row_without_ingredient,
            parsed,
            self.snapshot,
            attribute_group_terms,
            strong_terms,
            plan.query_bucket,
        )
        matched_score = self.service._score_structured_seed_row(
            row_with_ingredient,
            parsed,
            self.snapshot,
            attribute_group_terms,
            strong_terms,
            plan.query_bucket,
        )

        self.assertEqual(missing_score, 0.0)
        self.assertGreater(matched_score, 0.0)

    def test_generic_ingredient_family_matches_specific_ingredient_variants(self) -> None:
        parsed = product_search_query_parser.parse("세라마이드 크림", self.snapshot)
        row_with_variant = ProductSearchDataRow(
            product_id=3,
            name="배리어 크림",
            brand_name="테스트",
            category_name="크림",
            category_id=1,
            big_category_id=1,
            description=None,
            top_skin_type=None,
            top2_skin_type=None,
            concern_names=[],
            ingredient_text_ko="정제수, 세라마이드엔피, 글리세린",
            ingredient_text_en=None,
        )

        score = self.service._score_structured_seed_row(
            row_with_variant,
            parsed,
            self.snapshot,
            tuple(self.service._expand_attribute_group_terms(parsed, self.snapshot)),
            self.service._resolve_strong_keyword_terms(parsed, self.snapshot),
            "ingredient_category",
        )

        self.assertGreater(score, 0.0)

    def test_negative_ingredient_rerank_protects_free_pattern(self) -> None:
        parsed = product_search_query_parser.parse("향료 없는 토너", self.snapshot)
        safe_result = ProductSearchResult(
            product_id=1,
            name="무향료 진정 토너",
            brand_name="테스트",
            category_name="토너",
            concern_names=[],
            top_skin_type=None,
            top2_skin_type=None,
            document="무향료 진정 토너",
            description="향료 무첨가 토너",
            ingredient_preview=None,
            evidence_snippets=[],
            matched_sources=["keyword"],
            raw_score=10.0,
        )
        unsafe_result = ProductSearchResult(
            product_id=2,
            name="프레그런스 토너",
            brand_name="테스트",
            category_name="토너",
            concern_names=[],
            top_skin_type=None,
            top2_skin_type=None,
            document="향료가 포함된 토너",
            description="향료가 포함된 토너",
            ingredient_preview="정제수, 향료",
            evidence_snippets=[],
            matched_sources=["keyword"],
            raw_score=10.0,
        )

        reranked = rerank_results([unsafe_result, safe_result], parsed, self.snapshot.attribute_groups)

        self.assertEqual(reranked[0].product_id, 1)

    def test_long_query_rerank_prioritizes_strong_keyword_match(self) -> None:
        parsed = product_search_query_parser.parse(
            "성분에디터 그린토마토 모공 진정 토너",
            self.snapshot,
        )
        strong_match = ProductSearchResult(
            product_id=1,
            name="그린토마토 포어 토너",
            brand_name="성분에디터",
            category_name="토너",
            concern_names=["모공", "진정"],
            top_skin_type=None,
            top2_skin_type=None,
            document="그린토마토 포어 토너",
            description="모공 진정 토너",
            ingredient_preview=None,
            evidence_snippets=[],
            matched_sources=["keyword"],
            raw_score=10.0,
        )
        weak_only = ProductSearchResult(
            product_id=2,
            name="진정 포어 토너",
            brand_name="성분에디터",
            category_name="토너",
            concern_names=["모공", "진정"],
            top_skin_type=None,
            top2_skin_type=None,
            document="진정 포어 토너",
            description="모공 진정 토너",
            ingredient_preview=None,
            evidence_snippets=[],
            matched_sources=["keyword"],
            raw_score=10.0,
        )

        reranked = rerank_results([weak_only, strong_match], parsed, self.snapshot.attribute_groups)

        self.assertEqual(reranked[0].product_id, 1)

    def test_broad_scope_suppresses_name_matching_for_long_query_like(self) -> None:
        parsed = product_search_query_parser.parse("성분에디터 그린토마토", self.snapshot)
        plan = build_product_search_execution_plan(parsed)
        signals = build_product_search_query_signals(parsed)

        policy = self.service._resolve_name_matching_policy(
            parsed,
            plan,
            signals,
            category_ids=None,
            big_category_id=1,
            candidate_limit=180,
        )

        self.assertFalse(policy.run_exact)
        self.assertFalse(policy.run_fuzzy)
        self.assertTrue(policy.fallback_exact)
        self.assertTrue(policy.fallback_fuzzy)
        self.assertIn("suppressed.broad_scope", policy.reason or "")

    def test_strong_keyword_requirement_uses_shared_long_query_signal(self) -> None:
        parsed = product_search_query_parser.parse("성분에디터 그린 토마토", self.snapshot)

        self.assertTrue(self.service._requires_strong_keyword_match(parsed, self.snapshot))

    def test_multi_brand_diversity_keeps_top1_and_covers_requested_brands_early(self) -> None:
        results = [
            ProductSearchResult(
                product_id=1,
                name="라운드랩 토너 A",
                brand_name="라운드랩",
                category_name="토너",
                concern_names=[],
                top_skin_type=None,
                top2_skin_type=None,
                document="라운드랩 토너 A",
                description=None,
                ingredient_preview=None,
                evidence_snippets=[],
                matched_sources=["structured"],
                raw_score=100.0,
            ),
            ProductSearchResult(
                product_id=2,
                name="라운드랩 토너 B",
                brand_name="라운드랩",
                category_name="토너",
                concern_names=[],
                top_skin_type=None,
                top2_skin_type=None,
                document="라운드랩 토너 B",
                description=None,
                ingredient_preview=None,
                evidence_snippets=[],
                matched_sources=["structured"],
                raw_score=90.0,
            ),
            ProductSearchResult(
                product_id=3,
                name="아이소이 토너",
                brand_name="아이소이",
                category_name="토너",
                concern_names=[],
                top_skin_type=None,
                top2_skin_type=None,
                document="아이소이 토너",
                description=None,
                ingredient_preview=None,
                evidence_snippets=[],
                matched_sources=["structured"],
                raw_score=80.0,
            ),
        ]

        reranked = self.service._apply_multi_brand_diversity(
            results,
            ("라운드랩", "아이소이"),
            window_size=4,
        )

        self.assertEqual(reranked[0].product_id, 1)
        self.assertEqual(reranked[1].product_id, 3)


if __name__ == "__main__":
    unittest.main()
