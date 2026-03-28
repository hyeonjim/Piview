import unittest

from services.product_search.evaluation import build_product_search_evaluation_cases


class ProductSearchEvaluationQuerysetTests(unittest.TestCase):
    def test_queryset_has_large_fixed_coverage(self) -> None:
        cases = build_product_search_evaluation_cases()

        self.assertGreaterEqual(len(cases), 300)
        self.assertLessEqual(len(cases), 400)

    def test_case_ids_are_unique_and_expected_bucket_is_present(self) -> None:
        cases = build_product_search_evaluation_cases()
        case_ids = {case.case_id for case in cases}

        self.assertEqual(len(case_ids), len(cases))
        self.assertTrue(all(case.expected_query_bucket for case in cases))


if __name__ == "__main__":
    unittest.main()
