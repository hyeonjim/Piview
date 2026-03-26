"""Keyword search orchestration.

현재는 요청마다 전체 후보를 읽고 Python에서 점수화하는 방식을 유지합니다.
전수 스캔 여부는 성능/품질 실험에 따라 바뀔 수 있으므로, 여기서는 흐름만 단순하게 둡니다.
"""

import asyncio

from services.chatbot.search.keyword.repository import product_keyword_repository
from services.chatbot.search.keyword.scorer import score_row, to_search_result
from services.chatbot.search.keyword.tokenizer import extract_terms
from services.chatbot.search.vector import ProductSearchResult


class ProductKeywordService:
    async def search_async(
        self,
        query_text: str,
        limit: int,
        candidate_limit: int | None = None,
        preferred_categories: set[str] | None = None,
    ) -> list[ProductSearchResult]:
        return await asyncio.to_thread(
            self.search,
            query_text,
            limit,
            candidate_limit,
            preferred_categories,
        )

    def search(
        self,
        query_text: str,
        limit: int,
        candidate_limit: int | None = None,
        preferred_categories: set[str] | None = None,
    ) -> list[ProductSearchResult]:
        """질문 문자열을 키워드 후보 리스트로 바꿉니다.

        1. 질의에서 의미 있는 토큰을 추출한다.
        2. 저장소에서 후보 행을 읽는다.
        3. 각 행에 점수를 매긴다.
        4. 점수 0 초과만 남기고 정렬해 반환한다.
        """
        terms = extract_terms(query_text)
        if not terms:
            return []

        # DB prefilter + TTL cache로 요청마다 전체 상품을 다시 읽는 비용을 줄입니다.
        scored_rows = [
            score_row(row, terms)
            for row in product_keyword_repository.get_candidates(
                terms,
                candidate_limit=candidate_limit,
                preferred_categories=preferred_categories,
            )
        ]
        filtered_rows = [row for row in scored_rows if row.keyword_score > 0]
        filtered_rows.sort(key=lambda row: (-row.keyword_score, row.product_id))
        return [to_search_result(row) for row in filtered_rows[:limit]]


product_keyword_service = ProductKeywordService()
