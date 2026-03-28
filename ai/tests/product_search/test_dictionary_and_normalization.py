import unittest

from services.chatbot.search.product_data import ProductSearchDataRow, normalize_concern_name
from services.product_search.negative_rules import build_negative_safe_patterns, has_negative_safe_pattern
from services.product_search.sync import ProductSearchDictionarySyncer


class ProductSearchDictionarySyncTests(unittest.TestCase):
    def test_build_ingredient_entries_uses_db_ingredient_text(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="테스트 크림",
                brand_name="브랜드",
                category_name="크림",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 판테놀, 나이아신아마이드",
                ingredient_text_en="water, panthenol, niacinamide",
            ),
            ProductSearchDataRow(
                product_id=2,
                name="테스트 세럼",
                brand_name="브랜드",
                category_name="세럼",
                category_id=2,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 판테놀",
                ingredient_text_en=None,
            ),
        ]

        entries = ProductSearchDictionarySyncer()._build_ingredient_entries(
            rows=rows,
            stopwords=set(),
            blocked_terms=set(),
        )
        by_canonical = {entry.canonical: entry.frequency for entry in entries}

        self.assertGreaterEqual(by_canonical["판테놀"], 2)
        self.assertIn("나이아신아마이드", by_canonical)
        self.assertIn("panthenol", by_canonical)


class ProductSearchNegativeRuleTests(unittest.TestCase):
    def test_negative_safe_patterns_are_product_search_specific(self) -> None:
        patterns = build_negative_safe_patterns("향료")

        self.assertIn("무향료", patterns)
        self.assertIn("향료 프리", patterns)
        self.assertTrue(has_negative_safe_pattern("무향료 토너", "향료"))
        self.assertFalse(has_negative_safe_pattern("향료가 포함된 토너", "향료"))


class ConcernNormalizationTests(unittest.TestCase):
    def test_concern_normalization_does_not_depend_on_numeric_ids(self) -> None:
        self.assertEqual(normalize_concern_name("주름/탄력"), "안티에이징")
        self.assertEqual(normalize_concern_name("기미/주근깨/잡티"), "색소침착")
        self.assertEqual(normalize_concern_name("속건조"), "수분")
        self.assertEqual(normalize_concern_name("모공"), "모공")


if __name__ == "__main__":
    unittest.main()
