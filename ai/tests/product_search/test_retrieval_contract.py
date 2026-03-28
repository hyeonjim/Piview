from datetime import datetime, timezone
import unittest

from services.chatbot.search.product_data import ProductSearchDataRow
from services.chatbot.search.vector import ProductSearchResult
from services.product_search.models import ProductSearchDictionarySnapshot
from services.product_search.parser import product_search_query_parser
from services.product_search.planning import build_product_search_execution_plan
from services.product_search.scorer import rerank_results
from services.product_search.service import ProductSearchService


def _build_snapshot() -> ProductSearchDictionarySnapshot:
    return ProductSearchDictionarySnapshot(
        loaded_at=datetime.now(timezone.utc),
        brands=(),
        categories=(),
        product_types=(),
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
        },
        category_lookup={
            "토너": "토너",
            "크림": "크림",
        },
        product_type_lookup={},
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


if __name__ == "__main__":
    unittest.main()
