from __future__ import annotations

from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b0

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _create_b0_regressor() -> nn.Module:
    model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, 1),
    )
    return model


def _create_transform(image_size: int) -> transforms.Compose:
    resize_size = 256 if image_size == 224 else 330
    return transforms.Compose(
        [
            transforms.Resize(resize_size),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )


def _load_model(model_path: Path, factory, image_size: int):
    if not model_path.exists():
        return None

    # 수분 모델은 회귀값 하나를 내는 구조라 분류기와 헤드 구성이 다릅니다.
    model = factory()
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return {
        "model": model,
        "transform": _create_transform(image_size),
    }


CHEEK_MEAN_MODEL = _load_model(MODELS_DIR / "cheek_mean_moisture_best.pt", _create_b0_regressor, 224)


def _predict_single(bundle: dict | None, image: Image.Image, error_message: str) -> float:
    if bundle is None:
        raise RuntimeError(error_message)

    model = bundle["model"]
    transform = bundle["transform"]
    with torch.no_grad():
        inputs = transform(image).unsqueeze(0).to(DEVICE)
        value = model(inputs).squeeze().detach().cpu().item()
    return round(float(value), 4)


def _build_cheek_pair_image(left_cheek: Image.Image, right_cheek: Image.Image) -> Image.Image:
    left = left_cheek.convert("RGB")
    right = right_cheek.convert("RGB")
    target_height = max(left.height, right.height)

    # 현재 선택한 cheek_mean 모델은 좌우 볼을 한 장으로 이어 붙인 입력을 기대합니다.
    if left.height != target_height:
        left = left.resize((int(left.width * target_height / left.height), target_height))
    if right.height != target_height:
        right = right.resize((int(right.width * target_height / right.height), target_height))

    canvas = Image.new("RGB", (left.width + right.width, target_height))
    canvas.paste(left, (0, 0))
    canvas.paste(right, (left.width, 0))
    return canvas


def predict_moisture_states(left_cheek: Image.Image, right_cheek: Image.Image) -> dict:
    cheek_pair = _build_cheek_pair_image(left_cheek, right_cheek)
    # 수분 점수는 회귀 출력이라 현재는 저/중/고 같은 등급으로 자르지 않고 원점수를 반환합니다.
    cheek_mean_score = _predict_single(CHEEK_MEAN_MODEL, cheek_pair, "cheek_mean moisture 모델을 찾지 못했어요.")
    return {
        "cheek_mean_score": cheek_mean_score,
    }
