from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b0

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "binary_best.pt"

TRANSFORM = transforms.Compose([
    # 저장된 체크포인트와 같은 전처리를 써야 추론 시 입력 분포가 어긋나지 않습니다.
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def _load_model():
    model = efficientnet_b0()
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(model.classifier[1].in_features, 2),
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()
    return model


print("⏳ 피부타입 모델 로딩 중...")
MODEL = _load_model() if MODEL_PATH.exists() else None
print("✅ 피부타입 모델 로딩 완료" if MODEL else f"❌ {MODEL_PATH} 없음")


def is_model_ready() -> bool:
    return MODEL is not None


def predict_global_face_probabilities(image: Image.Image) -> tuple[float, float]:
    if MODEL is None:
        raise RuntimeError("binary_best.pt 파일을 확인하세요.")

    with torch.no_grad():
        # 출력 순서는 학습 시점부터 [건성, 지성]으로 고정되어 있습니다.
        probs = torch.softmax(MODEL(TRANSFORM(image).unsqueeze(0)), dim=-1)[0].numpy()

    return float(probs[0]), float(probs[1])
