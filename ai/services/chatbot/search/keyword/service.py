from services.chatbot.search.keyword.repository import product_keyword_repository
from services.chatbot.search.keyword.scorer import score_row, to_search_result
from services.chatbot.search.keyword.tokenizer import extract_terms
from services.chatbot.search.vector import ProductSearchResult


class ProductKeywordService:
    def search(self, query_text: str, limit: int) -> list[ProductSearchResult]:
        terms = extract_terms(query_text)
        if not terms:
            return []

        scored_rows = [score_row(row, terms) for row in product_keyword_repository.get_candidates()]
        filtered_rows = [row for row in scored_rows if row.keyword_score > 0]
        filtered_rows.sort(key=lambda row: (-row.keyword_score, row.product_id))
        return [to_search_result(row) for row in filtered_rows[:limit]]


product_keyword_service = ProductKeywordService()
