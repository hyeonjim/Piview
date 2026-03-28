import unittest

from services.chatbot.search.product_data import ProductSearchDataRow, normalize_concern_name
from services.product_search.negative_rules import build_negative_safe_patterns, has_negative_safe_pattern
from services.product_search.sync import ProductSearchDictionarySyncer


class ProductSearchDictionarySyncTests(unittest.TestCase):
    def test_product_type_entries_exclude_manual_ingredient_and_attribute_terms(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="시카",
                brand_name="브랜드",
                category_name="시카 토너",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 병풀추출물",
                ingredient_text_en=None,
            ),
            ProductSearchDataRow(
                product_id=2,
                name="히알루론산",
                brand_name="브랜드",
                category_name="히알루론산 세럼",
                category_id=2,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko="정제수, 히알루론산",
                ingredient_text_en=None,
            ),
            ProductSearchDataRow(
                product_id=3,
                name="브라이트닝",
                brand_name="브랜드",
                category_name="브라이트닝 크림",
                category_id=3,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=None,
            ),
            ProductSearchDataRow(
                product_id=4,
                name="토너",
                brand_name="브랜드",
                category_name="토너",
                category_id=4,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=None,
            ),
        ]
        syncer = ProductSearchDictionarySyncer()

        entries = syncer._build_product_type_entries(
            rows=rows,
            stopwords=set(),
            brand_terms=set(),
            category_terms=set(),
            excluded_terms=syncer._load_attribute_group_terms()
            | syncer._build_ingredient_family_alias_terms(syncer._load_ingredient_family_rules()),
        )
        canonicals = {entry.canonical for entry in entries}

        self.assertIn("토너", canonicals)
        self.assertNotIn("시카", canonicals)
        self.assertNotIn("히알루론산", canonicals)
        self.assertNotIn("브라이트닝", canonicals)

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

    def test_build_ingredient_entries_adds_family_aliases_for_db_english_canonicals(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="테스트 세럼",
                brand_name="브랜드",
                category_name="세럼",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=(
                    "hyaluronic acid, glycolic acid, betaine salicylate, gluconolactone, "
                    "solanum lycopersicum (tomato) fruit extract, glycine soja (soybean) seed extract, "
                    "oryza sativa (rice) extract"
                ),
            ),
        ]

        entries = ProductSearchDictionarySyncer()._build_ingredient_entries(
            rows=rows,
            stopwords=set(),
            blocked_terms=set(),
            ingredient_family_rules=ProductSearchDictionarySyncer()._load_ingredient_family_rules(),
        )
        by_canonical = {entry.canonical: set(entry.aliases) for entry in entries}

        self.assertIn("히알루로닉애씨드", by_canonical["hyaluronic acid"])
        self.assertIn("아하", by_canonical["glycolic acid"])
        self.assertIn("바하", by_canonical["betaine salicylate"])
        self.assertIn("pha", by_canonical["gluconolactone"])
        self.assertIn("그린토마토", by_canonical["solanum lycopersicum (tomato) fruit extract"])
        self.assertIn("약콩", by_canonical["glycine soja (soybean) seed extract"])
        self.assertIn("쌀", by_canonical["oryza sativa (rice) extract"])

    def test_build_ingredient_entries_adds_manual_aliases_for_common_active_derivatives(self) -> None:
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="테스트 액티브 세럼",
                brand_name="브랜드",
                category_name="세럼",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=(
                    "retinyl palmitate, bifida ferment lysate, tranexamic acid, "
                    "alpha-arbutin, aloe barbadensis leaf juice, sodium ascorbyl phosphate, "
                    "ceramide ap, panax ginseng root extract"
                ),
            ),
        ]

        entries = ProductSearchDictionarySyncer()._build_ingredient_entries(
            rows=rows,
            stopwords=set(),
            blocked_terms=set(),
            ingredient_family_rules=ProductSearchDictionarySyncer()._load_ingredient_family_rules(),
        )
        by_canonical = {entry.canonical: set(entry.aliases) for entry in entries}

        self.assertIn("레티놀", by_canonical["retinyl palmitate"])
        self.assertIn("비피다", by_canonical["bifida ferment lysate"])
        self.assertIn("트라넥삼산", by_canonical["tranexamic acid"])
        self.assertIn("알부틴", by_canonical["alpha-arbutin"])
        self.assertIn("알로에", by_canonical["aloe barbadensis leaf juice"])
        self.assertIn("비타민c", by_canonical["sodium ascorbyl phosphate"])
        self.assertIn("세라마이드", by_canonical["ceramide ap"])
        self.assertIn("인삼", by_canonical["panax ginseng root extract"])


class ProductSearchNegativeRuleTests(unittest.TestCase):
    def test_negative_safe_patterns_are_product_search_specific(self) -> None:
        patterns = build_negative_safe_patterns("향료")

        self.assertIn("무향료", patterns)
        self.assertIn("향료 프리", patterns)
        self.assertTrue(has_negative_safe_pattern("무향료 토너", "향료"))
        self.assertFalse(has_negative_safe_pattern("향료가 포함된 토너", "향료"))

    def test_negative_safe_patterns_cover_compound_forms(self) -> None:
        self.assertTrue(has_negative_safe_pattern("향료 무첨가 토너", "향료"))


class ConcernNormalizationTests(unittest.TestCase):
    def test_concern_normalization_does_not_depend_on_numeric_ids(self) -> None:
        self.assertEqual(normalize_concern_name("주름/탄력"), "안티에이징")
        self.assertEqual(normalize_concern_name("기미/주근깨/잡티"), "색소침착")
        self.assertEqual(normalize_concern_name("속건조"), "수분")
        self.assertEqual(normalize_concern_name("모공"), "모공")


if __name__ == "__main__":
    unittest.main()
