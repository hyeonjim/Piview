from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings(BaseModel):
    gms_key: str | None = os.getenv("GMS_KEY")
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
    chatbot_top_k: int = int(os.getenv("CHATBOT_TOP_K", "5"))
    # 벡터 저장소는 아직 미연결이지만, 이후 Chroma 기본 경로로 바로 쓸 수 있게 남겨둡니다.
    chatbot_vector_dir: str = os.getenv("CHATBOT_VECTOR_DIR", "/app/data/chroma")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # 설정은 프로세스 내에서 반복 생성할 이유가 없으므로 캐시합니다.
    return Settings()
