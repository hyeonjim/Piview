from pathlib import Path

from core.settings import get_settings
from services.chatbot.search.embedding import GmsOpenAIEmbeddingFunction


class VectorCollectionStore:
    def __init__(self) -> None:
        self._client = None
        self._collection = None
        self._embedding_function = GmsOpenAIEmbeddingFunction()

    def get_collection(self):
        if self._collection is not None:
            return self._collection

        client = self._get_client()
        settings = get_settings()
        self._collection = client.get_or_create_collection(
            name=settings.chatbot_vector_collection,
            embedding_function=self._embedding_function,
            metadata={"hnsw:space": "cosine"},
        )
        return self._collection

    def reset_collection(self) -> None:
        settings = get_settings()
        client = self._get_client()

        try:
            client.delete_collection(name=settings.chatbot_vector_collection)
        except Exception:
            pass

        self._collection = None
        self.get_collection()

    def _get_client(self):
        if self._client is not None:
            return self._client

        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError(
                "chromadb is not installed. Run 'pip install -r requirements.txt' in ai/.venv."
            ) from exc

        settings = get_settings()
        vector_dir = Path(settings.chatbot_vector_dir)
        vector_dir.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(vector_dir))
        return self._client
