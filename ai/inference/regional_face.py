from __future__ import annotations

from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import convnext_tiny, efficientnet_b2

from inference.display_score import build_display_scores

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ROI_CONFIG = {
    "forehead": {
        "model_path": MODELS_DIR / "forehead_skin_type_best.pt",
        "backbone": "convnext_tiny",
        "image_size": 224,
        "threshold": 0.5,
    },
    "left_cheek": {
        "model_path": MODELS_DIR / "left_cheek_skin_type_best.pt",
        "backbone": "convnext_tiny",
        "image_size": 224,
        "threshold": 0.45,
    },
    "right_cheek": {
        "model_path": MODELS_DIR / "right_cheek_skin_type_best.pt",
        "backbone": "efficientnet_b2",
        "image_size": 288,
        "threshold": 0.45,
    },
}


def _create_transform(image_size: int) -> transforms.Compose:
    # 체크포인트마다 사용한 backbone이 달라 입력 크기도 함께 맞춰야 합니다.
    resize_size = 256 if image_size == 224 else 330
    return transforms.Compose(
        [
            transforms.Resize(resize_size),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )


def _create_model(backbone: str) -> nn.Module:
    if backbone == "convnext_tiny":
        model = convnext_tiny(weights=None)
        in_features = model.classifier[2].in_features
        model.classifier = nn.Sequential(
            model.classifier[0],
            model.classifier[1],
            nn.Linear(in_features, 2),
        )
        return model

    model = efficientnet_b2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 2),
    )
    return model


def _load_models() -> dict[str, dict]:
    loaded = {}
    for roi_name, config in ROI_CONFIG.items():
        model_path = config["model_path"]
        if not model_path.exists():
            # 부위별 모델이 아직 준비되지 않은 경우 해당 ROI만 비활성화합니다.
            continue

        model = _create_model(config["backbone"])
        model.load_state_dict(torch.load(model_path, map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        loaded[roi_name] = {
            "model": model,
            "transform": _create_transform(config["image_size"]),
            "threshold": config["threshold"],
        }
    return loaded


MODELS = _load_models()


def predict_regional_axis(roi_name: str, image: Image.Image) -> dict:
    bundle = MODELS.get(roi_name)
    if bundle is None:
        raise RuntimeError(f"{roi_name} skin_type 모델을 찾지 못했어요.")

    model = bundle["model"]
    transform = bundle["transform"]
    threshold = bundle["threshold"]

    with torch.no_grad():
        inputs = transform(image).unsqueeze(0).to(DEVICE)
        probs = torch.softmax(model(inputs), dim=-1)[0].detach().cpu().numpy()

    dry_prob = float(probs[0])
    oily_prob = float(probs[1])
    # 백엔드 규칙과 같은 dry/oily 축 이름을 유지해야 후속 조합 로직이 단순해집니다.
    axis = "oily_side" if oily_prob >= threshold else "dry_side"

    return {
        "axis": axis,
        "dry_probability": round(dry_prob, 4),
        "oily_probability": round(oily_prob, 4),
        **build_display_scores(oily_prob, threshold),
    }
