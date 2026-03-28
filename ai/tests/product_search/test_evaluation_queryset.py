import unittest

from scripts.run_product_search_evaluation import _brand_coverage_at_k
from services.chatbot.search.product_data import ProductSearchDataRow
from services.product_search.evaluation import build_product_search_evaluation_cases


class ProductSearchEvaluationQuerysetTests(unittest.TestCase):
    def test_queryset_has_large_fixed_coverage(self) -> None:
        cases = build_product_search_evaluation_cases()

        self.assertGreaterEqual(len(cases), 500)
        self.assertLessEqual(len(cases), 650)

    def test_case_ids_are_unique_and_expected_bucket_is_present(self) -> None:
        cases = build_product_search_evaluation_cases()
        case_ids = {case.case_id for case in cases}

        self.assertEqual(len(case_ids), len(cases))
        self.assertTrue(all(case.expected_query_bucket for case in cases))

    def test_brand_coverage_metric_counts_requested_brands_in_top_k(self) -> None:
        case = next(
            item
            for item in build_product_search_evaluation_cases()
            if item.expected_query_bucket == "multi_brand_category"
        )
        rows = [
            ProductSearchDataRow(
                product_id=1,
                name="브랜드 A 토너",
                brand_name=case.expected_brands[0],
                category_name="토너",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=None,
            ),
            ProductSearchDataRow(
                product_id=2,
                name="브랜드 B 토너",
                brand_name=case.expected_brands[1],
                category_name="토너",
                category_id=1,
                big_category_id=1,
                description=None,
                top_skin_type=None,
                top2_skin_type=None,
                concern_names=[],
                ingredient_text_ko=None,
                ingredient_text_en=None,
            ),
        ]

        self.assertEqual(_brand_coverage_at_k(rows, case, 6), 1.0)


if __name__ == "__main__":
    unittest.main()
