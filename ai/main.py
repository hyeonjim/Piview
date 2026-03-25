"""
main.py
───────
SkinLens FastAPI 서버

엔드포인트:
  POST /skin/predict       ← 피부타입 판정 (건성 / 지성)
  POST /ocr/extract-text   ← 성분표 OCR + GMS 모델 정제
  GET  /health             ← 서버 상태 확인

실행:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import chatbot, ocr, skin_type

app = FastAPI(
    title="SkinLens API",
    description="피부타입 분석 / 성분표 OCR AI API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skin_type.router, prefix="/skin", tags=["피부타입 분석"])
app.include_router(ocr.router,       prefix="/ocr",  tags=["성분표 OCR"])
app.include_router(chatbot.router,   prefix="/chat", tags=["챗봇"])


@app.get("/health", tags=["서버 상태"])
def health():
    return {"status": "ok"}
