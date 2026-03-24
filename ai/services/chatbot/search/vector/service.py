from core.settings import get_settings
from services.chatbot.search.vector.mapper import map_query_results
from services.chatbot.search.vector.models import IndexedProductDocument, ProductSearchResult
from services.chatbot.search.vector.store import VectorCollectionStore


class ProductVectorService:
    def __init__(self) -> None:
        self._store = VectorCollectionStore()

    def reset_collection(self) -> None:
        self._store.reset_collection()

    def count(self) -> int:
        try:
            return self._store.get_collection().count()
        except RuntimeError:
            return 0

    def upsert_documents(self, documents: list[IndexedProductDocument]) -> int:
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
        exclude_product_ids = exclude_product_ids or set()
        collection = self._store.get_collection()
        if collection.count() == 0:
            return []

        settings = get_settings()
        candidate_pool = max(limit, settings.chatbot_candidate_pool)
        raw = collection.query(
            query_texts=[query_text],
            n_results=min(candidate_pool + len(exclude_product_ids), collection.count()),
            include=["documents", "metadatas", "distances"],
        )
        return map_query_results(raw, limit, exclude_product_ids)


product_vector_service = ProductVectorService()
