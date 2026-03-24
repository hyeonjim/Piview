from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings(BaseModel):
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
    chatbot_top_k: int
    chatbot_vector_dir: str
    chatbot_vector_collection: str
    chatbot_candidate_pool: int
    chatbot_keyword_top_k: int
    chatbot_hybrid_rrf_k: int
    chatbot_vector_weight: float
    chatbot_keyword_weight: float
    chatbot_index_batch_size: int
    chatbot_description_max_chars: int
    chatbot_ingredient_limit: int
    chatbot_concern_limit: int
    chatbot_db_host: str
    chatbot_db_port: int
    chatbot_db_user: str
    chatbot_db_password: str
    chatbot_db_name: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # 설정은 호출 시점의 환경변수를 기준으로 만들고, 같은 실행 내 반복 사용만 캐시합니다.
    return Settings(
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
        chatbot_top_k=int(os.getenv("CHATBOT_TOP_K", "5")),
        chatbot_vector_dir=os.getenv("CHATBOT_VECTOR_DIR", "/app/data/chroma"),
        chatbot_vector_collection=os.getenv("CHATBOT_VECTOR_COLLECTION", "products"),
        chatbot_candidate_pool=int(os.getenv("CHATBOT_CANDIDATE_POOL", "15")),
        chatbot_keyword_top_k=int(os.getenv("CHATBOT_KEYWORD_TOP_K", "15")),
        chatbot_hybrid_rrf_k=int(os.getenv("CHATBOT_HYBRID_RRF_K", "60")),
        chatbot_vector_weight=float(os.getenv("CHATBOT_VECTOR_WEIGHT", "0.7")),
        chatbot_keyword_weight=float(os.getenv("CHATBOT_KEYWORD_WEIGHT", "0.3")),
        chatbot_index_batch_size=int(os.getenv("CHATBOT_INDEX_BATCH_SIZE", "200")),
        chatbot_description_max_chars=int(os.getenv("CHATBOT_DESCRIPTION_MAX_CHARS", "280")),
        chatbot_ingredient_limit=int(os.getenv("CHATBOT_INGREDIENT_LIMIT", "20")),
        chatbot_concern_limit=int(os.getenv("CHATBOT_CONCERN_LIMIT", "5")),
        chatbot_db_host=os.getenv("CHATBOT_DB_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        chatbot_db_port=int(os.getenv("CHATBOT_DB_PORT", os.getenv("MYSQL_PORT", "3306"))),
        chatbot_db_user=os.getenv("CHATBOT_DB_USER", os.getenv("MYSQL_USER", "")),
        chatbot_db_password=os.getenv("CHATBOT_DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "")),
        chatbot_db_name=os.getenv("CHATBOT_DB_NAME", os.getenv("MYSQL_DATABASE", "")),
    )
