from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings(BaseModel):
    # LLM / Embedding 제공자 설정
    # - GMS/Gemini/OpenAI 호환 임베딩 API 주소와 모델 이름을 관리합니다.
    # - generation, embedding 두 경로가 모두 여기 값을 참조합니다.
    gms_key: str | None = None
    embedding_api_base_url: str
    embedding_model: str
    embedding_batch_size: int
    gms_api_base_url: str
    gms_model: str
    chatbot_model: str
    chatbot_temperature: float
    chatbot_llm_max_retries: int
    chatbot_llm_retry_backoff_sec: float

    # 검색 / 랭킹 설정
    # - retrieval 단계에서 top-k, fusion 비율, 후보 풀 크기 등을 제어합니다.
    # - 현재 Chroma는 경로 기반이 아니라 별도 서버(dev-chroma/prod-chroma)에 붙습니다.
    # - 따라서 vector 저장소 접근은 CHROMA_HOST/CHROMA_PORT를 기준으로 합니다.
    chatbot_top_k: int
    chroma_host: str
    chroma_port: int
    chatbot_vector_collection: str
    chatbot_candidate_pool: int
    chatbot_keyword_top_k: int
    chatbot_keyword_prefilter_limit: int
    chatbot_keyword_cache_ttl_sec: int
    chatbot_hybrid_rrf_k: int
    chatbot_vector_weight: float
    chatbot_keyword_weight: float
    chatbot_index_batch_size: int
    chatbot_description_max_chars: int
    chatbot_ingredient_limit: int
    chatbot_concern_limit: int

    # 세션 저장 설정
    # - follow-up 질문 품질을 위해 최근 대화 문맥을 잠깐 저장할 때 사용합니다.
    # - memory / redis 백엔드 전환도 여기서 결정합니다.
    chatbot_session_ttl_sec: int
    chatbot_session_max_turns: int
    chatbot_session_backend: str
    chatbot_redis_url: str | None = None
    chatbot_redis_host: str | None = None
    chatbot_redis_port: int
    chatbot_redis_password: str | None = None
    chatbot_redis_db: int

    # 상품 메타데이터 조회용 DB 설정
    # - keyword search, 상품명/브랜드/카테고리 prefilter에서 사용합니다.
    # - vector search만으로 끝나지 않고 MySQL 기반 검색과 함께 섞이는 구조입니다.
    chatbot_db_host: str
    chatbot_db_port: int
    chatbot_db_user: str
    chatbot_db_password: str
    chatbot_db_name: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # 설정은 호출 시점의 환경변수를 기준으로 1회 생성합니다.
    # 같은 프로세스 안에서는 lru_cache로 재사용하므로,
    # 실행 중 환경변수를 바꿔도 자동 반영되지는 않습니다.
    return Settings(
        # LLM / Embedding 제공자 설정
        # - 텍스트 생성과 임베딩 생성에 필요한 외부 API 주소/모델 이름입니다.
        gms_key=os.getenv("GMS_KEY"),
        embedding_api_base_url=os.getenv(
            "EMBEDDING_API_BASE_URL",
            "https://gms.ssafy.io/gmsapi/api.openai.com",
        ).rstrip("/"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        embedding_batch_size=int(os.getenv("EMBEDDING_BATCH_SIZE", "64")),
        gms_api_base_url=os.getenv(
            "GMS_API_BASE_URL",
            os.getenv(
                "GEMINI_API_BASE_URL",
                "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com",
            ),
        ).rstrip("/"),
        gms_model=os.getenv(
            "GMS_MODEL",
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        ),
        chatbot_model=os.getenv(
            "CHATBOT_MODEL",
            os.getenv("GMS_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-flash")),
        ),
        chatbot_temperature=float(os.getenv("CHATBOT_TEMPERATURE", "0.3")),
        chatbot_llm_max_retries=int(os.getenv("CHATBOT_LLM_MAX_RETRIES", "3")),
        chatbot_llm_retry_backoff_sec=float(
            os.getenv("CHATBOT_LLM_RETRY_BACKOFF_SEC", "1.0")
        ),

        # 검색 / 랭킹 설정
        # - Chroma 서버 주소는 compose 네트워크 안 서비스명(dev-chroma/prod-chroma) 기준입니다.
        # - collection 이름만 같으면 같은 저장소를 공유합니다.
        chatbot_top_k=int(os.getenv("CHATBOT_TOP_K", "5")),
        chroma_host=os.getenv("CHROMA_HOST", "dev-chroma"),
        chroma_port=int(os.getenv("CHROMA_PORT", "8000")),
        chatbot_vector_collection=os.getenv("CHATBOT_VECTOR_COLLECTION", "products"),
        chatbot_candidate_pool=int(os.getenv("CHATBOT_CANDIDATE_POOL", "15")),
        chatbot_keyword_top_k=int(os.getenv("CHATBOT_KEYWORD_TOP_K", "15")),
        chatbot_keyword_prefilter_limit=int(os.getenv("CHATBOT_KEYWORD_PREFILTER_LIMIT", "250")),
        chatbot_keyword_cache_ttl_sec=int(os.getenv("CHATBOT_KEYWORD_CACHE_TTL_SEC", "300")),
        chatbot_hybrid_rrf_k=int(os.getenv("CHATBOT_HYBRID_RRF_K", "60")),
        chatbot_vector_weight=float(os.getenv("CHATBOT_VECTOR_WEIGHT", "0.7")),
        chatbot_keyword_weight=float(os.getenv("CHATBOT_KEYWORD_WEIGHT", "0.3")),
        chatbot_index_batch_size=int(os.getenv("CHATBOT_INDEX_BATCH_SIZE", "200")),
        chatbot_description_max_chars=int(os.getenv("CHATBOT_DESCRIPTION_MAX_CHARS", "280")),
        chatbot_ingredient_limit=int(os.getenv("CHATBOT_INGREDIENT_LIMIT", "20")),
        chatbot_concern_limit=int(os.getenv("CHATBOT_CONCERN_LIMIT", "5")),

        # 세션 저장 설정
        # - backend가 redis이면 Redis를, 아니면 프로세스 메모리를 사용합니다.
        chatbot_session_ttl_sec=int(os.getenv("CHATBOT_SESSION_TTL_SEC", "1800")),
        chatbot_session_max_turns=int(os.getenv("CHATBOT_SESSION_MAX_TURNS", "6")),
        chatbot_session_backend=os.getenv("CHATBOT_SESSION_BACKEND", "memory").lower(),
        chatbot_redis_url=os.getenv("CHATBOT_REDIS_URL") or None,
        chatbot_redis_host=os.getenv("CHATBOT_REDIS_HOST") or None,
        chatbot_redis_port=int(os.getenv("CHATBOT_REDIS_PORT", "6379")),
        chatbot_redis_password=os.getenv("CHATBOT_REDIS_PASSWORD") or None,
        chatbot_redis_db=int(os.getenv("CHATBOT_REDIS_DB", "0")),

        # 상품 메타데이터 조회용 DB 설정
        # - compose 내부에서는 보통 mysql-db 같은 서비스명으로 접근합니다.
        # - 로컬 터널 테스트 시에는 127.0.0.1:3306 같은 값으로 덮어쓸 수 있습니다.
        chatbot_db_host=os.getenv("CHATBOT_DB_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        chatbot_db_port=int(os.getenv("CHATBOT_DB_PORT", os.getenv("MYSQL_PORT", "3306"))),
        chatbot_db_user=os.getenv("CHATBOT_DB_USER", os.getenv("MYSQL_USER", "")),
        chatbot_db_password=os.getenv("CHATBOT_DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "")),
        chatbot_db_name=os.getenv("CHATBOT_DB_NAME", os.getenv("MYSQL_DATABASE", "")),
    )
