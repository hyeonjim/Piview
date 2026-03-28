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
            ingredient_family_rules=ProductSearchDictionarySyncer()._load_ingredient_family_rules(),
        )
        by_canonical = {entry.canonical: entry.frequency for entry in entries}

        self.assertGreaterEqual(by_canonical["판테놀"], 2)
        self.assertIn("나이아신아마이드", by_canonical)
        self.assertIn("panthenol", by_canonical)

    def test_build_ingredient_entries_adds_generated_family_aliases(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="세라마이드 크림",
                brand_name="브랜드",
                category_name="크림",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 세라마이드엔피, 병풀추출물, 티트리잎오일",
                ingredient_text_en="water, ceramide np, centella asiatica extract, tea tree leaf oil",
            ),
        ]

        entries = ProductSearchDictionarySyncer()._build_ingredient_entries(
            rows=rows,
            stopwords=set(),
            blocked_terms=set(),
            ingredient_family_rules=ProductSearchDictionarySyncer()._load_ingredient_family_rules(),
        )
        by_canonical = {entry.canonical: set(entry.aliases) for entry in entries}

        self.assertIn("세라마이드", by_canonical["세라마이드엔피"])
        self.assertIn("병풀", by_canonical["병풀추출물"])
        self.assertIn("티트리", by_canonical["티트리잎오일"])

    def test_build_ingredient_entries_adds_negative_family_aliases(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="테스트 토너",
                brand_name="브랜드",
                category_name="토너",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 향료, 변성알코올",
                ingredient_text_en="water, fragrance, alcohol denat.",
            ),
        ]

        entries = ProductSearchDictionarySyncer()._build_ingredient_entries(
            rows=rows,
            stopwords=set(),
            blocked_terms=set(),
            ingredient_family_rules=ProductSearchDictionarySyncer()._load_ingredient_family_rules(),
        )
        by_canonical = {entry.canonical: set(entry.aliases) for entry in entries}

        self.assertIn("향료", by_canonical["fragrance"])
        self.assertIn("알코올", by_canonical["변성알코올"])


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
