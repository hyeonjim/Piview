"""
api/routers/skin_type.py
────────────────────────
POST /skin/predict  ← 얼굴 사진 → 건성 / 지성 판정
"""

from fastapi import APIRouter, File, UploadFile

from services.skin.pipeline import extract_skin_states

router = APIRouter()

# ── 엔드포인트 ────────────────────────────────
@router.post("/extract-state")
@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """얼굴 사진 업로드 → 이미지 기반 상태값 추출"""
    return await extract_skin_states(file)
