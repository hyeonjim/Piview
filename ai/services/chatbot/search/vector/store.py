"""Chroma collection access layer.

vector 서비스에서 Chroma client 초기화와 collection 재사용을 직접 들고 있지 않도록
얇은 저장소 객체로 분리했습니다.
"""

from pathlib import Path

from core.settings import get_settings
from services.chatbot.search.embedding import GmsOpenAIEmbeddingFunction


class VectorCollectionStore:
    def __init__(self) -> None:
        """client와 collection은 lazy-init으로 열고 이후 재사용합니다."""
        self._client = None
        self._collection = None
        self._embedding_function = GmsOpenAIEmbeddingFunction()

    def get_collection(self):
        """검색/적재에 공통으로 쓰는 컬렉션 핸들을 돌려줍니다."""
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
        """컬렉션을 삭제 후 재생성해 인덱스를 초기화합니다."""
        settings = get_settings()
        client = self._get_client()

        try:
            client.delete_collection(name=settings.chatbot_vector_collection)
        except Exception:
            pass

        self._collection = None
        self.get_collection()

    def _get_client(self):
        """Chroma PersistentClient를 한 번만 열어 재사용합니다."""
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
        # 디렉터리가 없으면 로컬/컨테이너 어디서든 바로 컬렉션을 만들 수 있게 합니다.
        vector_dir.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(vector_dir))
        return self._client
