from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from core.settings import get_settings
from services.chatbot.embedding_service import GmsOpenAIEmbeddingFunction


@dataclass
class IndexedProductDocument:
    product_id: int
    name: str
    document: str
    metadata: dict[str, Any]


@dataclass
class ProductSearchResult:
    product_id: int
    name: str
    brand_name: str | None
    category_name: str | None
    concern_names: list[str]
    top_skin_type: str | None
    top2_skin_type: str | None
    document: str
    distance: float | None = None


class ProductVectorService:
    def __init__(self) -> None:
        self._client = None
        self._collection = None
        self._embedding_function = GmsOpenAIEmbeddingFunction()

    def _get_collection(self):
        if self._collection is not None:
            return self._collection

        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError("chromadb is not installed. Run 'pip install -r requirements.txt' in ai/.venv.") from exc

        settings = get_settings()
        vector_dir = Path(settings.chatbot_vector_dir)
        vector_dir.mkdir(parents=True, exist_ok=True)

        if self._client is None:
            self._client = chromadb.PersistentClient(path=str(vector_dir))

        self._collection = self._client.get_or_create_collection(
            name=settings.chatbot_vector_collection,
            embedding_function=self._embedding_function,
            metadata={"hnsw:space": "cosine"},
        )
        return self._collection

    def reset_collection(self) -> None:
        settings = get_settings()
        if self._client is None:
            try:
                import chromadb
            except ImportError as exc:
                raise RuntimeError("chromadb is not installed. Run 'pip install -r requirements.txt' in ai/.venv.") from exc

            vector_dir = Path(settings.chatbot_vector_dir)
            vector_dir.mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(path=str(vector_dir))

        try:
            self._client.delete_collection(name=settings.chatbot_vector_collection)
        except Exception:
            pass
        self._collection = None
        self._get_collection()

    def count(self) -> int:
        try:
            return self._get_collection().count()
        except RuntimeError:
            return 0

    def upsert_documents(self, documents: list[IndexedProductDocument]) -> int:
        if not documents:
            return 0

        settings = get_settings()
        collection = self._get_collection()
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
        collection = self._get_collection()
        if collection.count() == 0:
            return []

        settings = get_settings()
        candidate_pool = max(limit, settings.chatbot_candidate_pool)
        raw = collection.query(
            query_texts=[query_text],
            n_results=min(candidate_pool + len(exclude_product_ids), collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        results: list[ProductSearchResult] = []
        seen_product_ids: set[int] = set()
        for document, metadata, distance in zip(documents, metadatas, distances):
            if not metadata:
                continue

            product_id = int(metadata["productId"])
            if product_id in exclude_product_ids or product_id in seen_product_ids:
                continue
            seen_product_ids.add(product_id)

            concern_names_raw = metadata.get("concernNames") or ""
            concern_names = [item.strip() for item in concern_names_raw.split(",") if item.strip()]

            results.append(
                ProductSearchResult(
                    product_id=product_id,
                    name=str(metadata.get("name") or ""),
                    brand_name=metadata.get("brandName"),
                    category_name=metadata.get("categoryName"),
                    concern_names=concern_names,
                    top_skin_type=metadata.get("topSkinType"),
                    top2_skin_type=metadata.get("top2SkinType"),
                    document=document,
                    distance=float(distance) if distance is not None else None,
                )
            )
            if len(results) >= limit:
                break

        return results


product_vector_service = ProductVectorService()
