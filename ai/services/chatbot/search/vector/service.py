"""Vector search orchestration.

컬렉션 저장소 접근과 쿼리 결과 매핑은 하위 모듈에 두고,
이 서비스는 상위 retrieval 계층이 쓰는 공개 메서드만 제공합니다.
"""

from core.settings import get_settings
from services.chatbot.search.vector.mapper import map_query_results
from services.chatbot.search.vector.models import IndexedProductDocument, ProductSearchResult
from services.chatbot.search.vector.store import VectorCollectionStore


class ProductVectorService:
    def __init__(self) -> None:
        """서비스 생명주기 동안 재사용할 컬렉션 저장소를 붙입니다."""
        self._store = VectorCollectionStore()

    def reset_collection(self) -> None:
        """인덱스를 완전히 비우고 다시 생성합니다."""
        self._store.reset_collection()

    def count(self) -> int:
        """컬렉션 접근이 가능할 때만 현재 문서 수를 반환합니다."""
        try:
            return self._store.get_collection().count()
        except RuntimeError:
            return 0

    def upsert_documents(self, documents: list[IndexedProductDocument]) -> int:
        """상품 문서를 배치 단위로 Chroma 컬렉션에 적재합니다."""
        if not documents:
            return 0

        settings = get_settings()
        collection = self._store.get_collection()
        batch_size = max(1, settings.chatbot_index_batch_size)

        for start in range(0, len(documents), batch_size):
            batch = documents[start : start + batch_size]
            collection.upsert(
                ids=[str(doc.product_id) for doc in batch],
                documents=[doc.document for doc in batch],
                metadatas=[doc.metadata for doc in batch],
            )
        return len(documents)

    def query(
        self,
        query_text: str,
        limit: int,
        exclude_product_ids: set[int] | None = None,
    ) -> list[ProductSearchResult]:
        """질의 임베딩 검색 후, 상위 계층이 바로 쓸 수 있는 ProductSearchResult로 돌려줍니다."""
        exclude_product_ids = exclude_product_ids or set()
        collection = self._store.get_collection()
        if collection.count() == 0:
            return []

        settings = get_settings()
        candidate_pool = max(limit, settings.chatbot_candidate_pool)
        # 제외 상품 때문에 실제 반환 수가 limit보다 줄 수 있어서, 후보 풀은 조금 더 넉넉히 잡습니다.
        raw = collection.query(
            query_texts=[query_text],
            n_results=min(candidate_pool + len(exclude_product_ids), collection.count()),
            include=["documents", "metadatas", "distances"],
        )
        return map_query_results(raw, limit, exclude_product_ids)


product_vector_service = ProductVectorService()
