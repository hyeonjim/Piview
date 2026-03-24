from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings(BaseModel):
    gms_key: str | None = os.getenv("GMS_KEY")
    embedding_api_base_url: str = os.getenv(
        "EMBEDDING_API_BASE_URL",
        "https://gms.ssafy.io/gmsapi/api.openai.com",
    ).rstrip("/")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    embedding_batch_size: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "64"))
    # 운영/개발 환경에서 GMS_* 이름으로 옮겨도 기존 값은 계속 읽을 수 있게 fallback을 둡니다.
    gms_api_base_url: str = os.getenv(
        "GMS_API_BASE_URL",
        os.getenv(
            "GEMINI_API_BASE_URL",
            "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com",
        ),
    ).rstrip("/")
    gms_model: str = os.getenv(
        "GMS_MODEL",
        os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    )
    chatbot_model: str = os.getenv(
        "CHATBOT_MODEL",
        os.getenv("GMS_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-flash")),
    )
    chatbot_temperature: float = float(os.getenv("CHATBOT_TEMPERATURE", "0.3"))
    chatbot_llm_max_retries: int = int(os.getenv("CHATBOT_LLM_MAX_RETRIES", "3"))
    chatbot_llm_retry_backoff_sec: float = float(
        os.getenv("CHATBOT_LLM_RETRY_BACKOFF_SEC", "1.0")
    )
    chatbot_top_k: int = int(os.getenv("CHATBOT_TOP_K", "5"))
    chatbot_vector_dir: str = os.getenv("CHATBOT_VECTOR_DIR", "/app/data/chroma")
    chatbot_vector_collection: str = os.getenv("CHATBOT_VECTOR_COLLECTION", "products")
    chatbot_candidate_pool: int = int(os.getenv("CHATBOT_CANDIDATE_POOL", "15"))
    chatbot_keyword_top_k: int = int(os.getenv("CHATBOT_KEYWORD_TOP_K", "15"))
    chatbot_hybrid_rrf_k: int = int(os.getenv("CHATBOT_HYBRID_RRF_K", "60"))
    chatbot_vector_weight: float = float(os.getenv("CHATBOT_VECTOR_WEIGHT", "0.7"))
    chatbot_keyword_weight: float = float(os.getenv("CHATBOT_KEYWORD_WEIGHT", "0.3"))
    chatbot_index_batch_size: int = int(os.getenv("CHATBOT_INDEX_BATCH_SIZE", "200"))
    chatbot_description_max_chars: int = int(os.getenv("CHATBOT_DESCRIPTION_MAX_CHARS", "280"))
    chatbot_ingredient_limit: int = int(os.getenv("CHATBOT_INGREDIENT_LIMIT", "20"))
    chatbot_concern_limit: int = int(os.getenv("CHATBOT_CONCERN_LIMIT", "5"))
    chatbot_db_host: str = os.getenv("CHATBOT_DB_HOST", os.getenv("MYSQL_HOST", "127.0.0.1"))
    chatbot_db_port: int = int(os.getenv("CHATBOT_DB_PORT", os.getenv("MYSQL_PORT", "3306")))
    chatbot_db_user: str = os.getenv("CHATBOT_DB_USER", os.getenv("MYSQL_USER", ""))
    chatbot_db_password: str = os.getenv("CHATBOT_DB_PASSWORD", os.getenv("MYSQL_PASSWORD", ""))
    chatbot_db_name: str = os.getenv("CHATBOT_DB_NAME", os.getenv("MYSQL_DATABASE", ""))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # 설정은 프로세스 내에서 반복 생성할 이유가 없으므로 캐시합니다.
    return Settings()
