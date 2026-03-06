"""
routers/skin_type.py
────────────────────
POST /skin/predict  ← 얼굴 사진 → 건성 / 지성 판정

판정 로직:
  건성 확률 > 지성 확률  → 건성
  지성 확률 > 건성 확률  → 지성
  (중성 판정 없음 - 무조건 둘 중 하나)
"""

import os
import io
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b0
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

# ── 설정 ──────────────────────────────────────
MODEL_PATH  = "binary_best.pt"
CLASSES     = ["건성", "지성"]
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

SKIN_INFO = {
    "건성": {
        "emoji": "💧",
        "desc": "수분이 부족하고 세안 후 당김이 느껴지는 편이에요",
        "tips": [
            "세라마이드·히알루론산 등 고보습 성분을 챙기세요",
            "크림 제형으로 수분 장벽을 강화하세요",
            "알코올 함유 제품은 피하는 게 좋아요",
            "세안 후 3분 이내에 보습을 마무리하세요",
        ],
        "ingredients_good": ["세라마이드", "히알루론산", "글리세린", "스쿠알란"],
        "ingredients_bad":  ["알코올", "살리실산", "레티놀 고함량"],
    },
    "지성": {
        "emoji": "🌿",
        "desc": "피지 분비가 많고 번들거림이 생기기 쉬운 편이에요",
        "tips": [
            "약산성 클렌저로 하루 2회 세안을 권장해요",
            "젤·세럼 위주의 가벼운 보습을 선택하세요",
            "나이아신아마이드·BHA 성분이 피지 조절에 효과적이에요",
            "과도한 세안은 오히려 피지 분비를 늘릴 수 있어요",
        ],
        "ingredients_good": ["나이아신아마이드", "BHA(살리실산)", "징크", "티트리"],
        "ingredients_bad":  ["미네랄오일", "라놀린", "고함량 오일류"],
    },
}

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ── 모델 로드 (서버 시작 시 한 번만) ──────────
def _load_model():
    model = efficientnet_b0()
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(model.classifier[1].in_features, 2)
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()
    return model


print("⏳ 피부타입 모델 로딩 중...")
_model = _load_model() if os.path.exists(MODEL_PATH) else None
print("✅ 피부타입 모델 로딩 완료" if _model else f"❌ {MODEL_PATH} 없음")


# ── 신뢰도 메시지 ─────────────────────────────
def _conf_msg(prob: float, skin_type: str) -> str:
    if prob >= 0.75: return f"높은 확률로 {skin_type}이에요"
    if prob >= 0.60: return f"{skin_type}일 가능성이 높아요"
    return "경계선에 있어 판단이 다소 불확실해요"


# ── 엔드포인트 ────────────────────────────────
@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """얼굴 사진 업로드 → 피부타입 판정 (건성 / 지성)"""

    if _model is None:
        raise HTTPException(status_code=503, detail="binary_best.pt 파일을 확인하세요.")

    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.")

    with torch.no_grad():
        probs = torch.softmax(_model(TRANSFORM(img).unsqueeze(0)), dim=-1)[0].numpy()

    dry_prob  = float(probs[0])
    oily_prob = float(probs[1])

    # 무조건 둘 중 확률 높은 쪽으로 판정 (중성 없음)
    skin_type = "건성" if dry_prob >= oily_prob else "지성"
    main_prob = dry_prob if skin_type == "건성" else oily_prob
    info      = SKIN_INFO[skin_type]

    return {
        "skin_type":          skin_type,
        "emoji":              info["emoji"],
        "description":        info["desc"],
        "confidence":         round(main_prob, 4),
        "confidence_message": _conf_msg(main_prob, skin_type),
        "dry_probability":    round(dry_prob, 4),
        "oily_probability":   round(oily_prob, 4),
        "tips":               info["tips"],
        "ingredients_good":   info["ingredients_good"],
        "ingredients_bad":    info["ingredients_bad"],
        "disclaimer":         "AI 참고용 결과입니다. 정확한 진단은 전문의 상담을 권장해요.",
    }
