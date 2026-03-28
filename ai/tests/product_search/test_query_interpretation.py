from datetime import datetime, timezone
import unittest

from services.product_search.models import ParsedSearchQuery, ProductSearchDictionarySnapshot
from services.product_search.parser import product_search_query_parser
from services.product_search.planning import build_product_search_execution_plan


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
            "라운드랩": "라운드랩",
            "아이소이": "아이소이",
            "성분에디터": "성분에디터",
        },
        category_lookup={
            "토너": "토너",
            "크림": "크림",
            "로션": "로션/에멀젼",
        },
        product_type_lookup={},
        ingredient_lookup={
            "판테놀": "판테놀",
            "나이아신아마이드": "나이아신아마이드",
            "향료": "향료",
        },
        line_lookup={
            "판테놀": "판테놀",
            "나이아신아마이드": "나이아신아마이드",
            "그린토마토": "그린토마토",
        },
        attribute_lookup={},
        attribute_group_lookup={
            "판테놀": "barrier",
            "나이아신아마이드": "brightening",
            "진정": "soothing",
            "시카": "soothing",
            "모공": "pore_care",
        },
    )


class ParsedSearchQueryModelTests(unittest.TestCase):
    def test_line_only_query_is_not_structured_and_not_in_search_terms(self) -> None:
        parsed = ParsedSearchQuery(
            original="그린토마토",
            normalized="그린토마토",
            line_terms=("그린토마토",),
        )

        self.assertFalse(parsed.is_structured)
        self.assertEqual(parsed.search_terms(), [])


class ProductSearchQueryParserTests(unittest.TestCase):
    def setUp(self) -> None:
        self.snapshot = _build_snapshot()

    def test_parses_ingredient_category_without_promoting_line(self) -> None:
        parsed = product_search_query_parser.parse("판테놀 크림", self.snapshot)

        self.assertEqual(parsed.category_terms, ("크림",))
        self.assertEqual(parsed.ingredient_terms, ("판테놀",))
        self.assertEqual(parsed.keyword_terms, ("판테놀",))
        self.assertEqual(parsed.line_terms, ("판테놀",))

    def test_parses_negative_ingredient_expression(self) -> None:
        parsed = product_search_query_parser.parse("향료 없는 토너", self.snapshot)

        self.assertEqual(parsed.category_terms, ("토너",))
        self.assertEqual(parsed.negative_ingredient_terms, ("향료",))
        self.assertEqual(parsed.keyword_terms, ())

    def test_keeps_ambiguous_and_concern_tokens_as_keywords(self) -> None:
        parsed = product_search_query_parser.parse(
            "성분에디터 그린토마토 모공 진정 토너",
            self.snapshot,
        )

        self.assertEqual(parsed.brand_terms, ("성분에디터",))
        self.assertEqual(parsed.category_terms, ("토너",))
        self.assertEqual(parsed.keyword_terms, ("그린토마토", "모공", "진정"))
        self.assertEqual(parsed.attribute_group_terms, ("pore_care", "soothing"))


class ProductSearchExecutionPlanTests(unittest.TestCase):
    def setUp(self) -> None:
        self.snapshot = _build_snapshot()

    def _plan(self, query: str):
        parsed = product_search_query_parser.parse(query, self.snapshot)
        return build_product_search_execution_plan(parsed)

    def test_query_buckets_follow_documented_shapes(self) -> None:
        cases = {
            "라운드랩": "brand_only",
            "토너": "category_only",
            "라운드랩 토너": "brand_category",
            "라운드랩 아이소이 토너": "multi_brand_category",
            "판테놀": "ingredient_only",
            "판테놀 크림": "ingredient_category",
            "향료 없는 토너": "negative_ingredient",
            "그린토마토": "ambiguous_keyword",
            "성분에디터 그린토마토 모공 진정 토너": "long_query",
        }

        for query, expected_bucket in cases.items():
            with self.subTest(query=query):
                plan = self._plan(query)
                self.assertEqual(plan.query_bucket, expected_bucket)
                self.assertEqual(plan.query_shape, expected_bucket)

    def test_ingredient_paths_enable_ingredient_prefilter(self) -> None:
        ingredient_only_plan = self._plan("판테놀")
        ingredient_category_plan = self._plan("판테놀 크림")

        self.assertTrue(ingredient_only_plan.include_ingredient_text_in_prefilter)
        self.assertTrue(ingredient_category_plan.include_ingredient_text_in_prefilter)


if __name__ == "__main__":
    unittest.main()
