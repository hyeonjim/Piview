"""Chroma collection access layer.

vector 서비스에서 Chroma client 초기화와 collection 재사용을 직접 들고 있지 않도록
얇은 저장소 객체로 분리했습니다.
"""

from core.settings import get_settings
from services.chatbot.search.embedding import ChatbotEmbeddingFunction


class VectorCollectionStore:
    def __init__(self) -> None:
        """client와 collection은 lazy-init으로 열고 이후 재사용합니다."""
        self._client = None
        self._collection = None
        self._embedding_function = ChatbotEmbeddingFunction()

    def get_collection(self):
        """검색/적재에 공통으로 쓰는 컬렉션 핸들을 돌려줍니다."""
        if self._collection is not None:
            return self._collection

        client = self._get_client()
        settings = get_settings()
        # get_or_create_collection을 쓰므로, 인덱스 빌드 단계와 질의 단계가 같은 이름만 맞추면 같은 저장소를 공유합니다.
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
        """설정된 Chroma 서버 주소로 HttpClient를 한 번만 열어 재사용합니다."""
        if self._client is not None:
            return self._client

        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError(
                "chromadb is not installed. Run 'pip install -r requirements.txt' in ai/.venv."
            ) from exc

        settings = get_settings()
        if not settings.chroma_host:
            raise RuntimeError("CHROMA_HOST is not configured.")

        self._client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
        )
        return self._client
