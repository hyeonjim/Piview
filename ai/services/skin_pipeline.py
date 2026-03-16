import io
import os

from fastapi import HTTPException, UploadFile
from PIL import Image

from decision.skin_type_binary import build_binary_skin_response
from inference.global_face import is_model_ready, predict_global_face_probabilities
from inference.moisture import predict_moisture_states
from inference.regional_face import predict_regional_axis
from preprocessing.mediapipe.roi_extractor import extract_face_rois

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


async def predict_binary_skin_type(file: UploadFile) -> dict:
    if not is_model_ready():
        raise HTTPException(status_code=503, detail="binary_best.pt 파일을 확인하세요.")

    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.") from exc

    dry_prob, oily_prob = predict_global_face_probabilities(image)
    return build_binary_skin_response(dry_prob, oily_prob)


def _build_global_state(dry_prob: float, oily_prob: float) -> dict:
    # 전역 얼굴 모델은 건성/지성 이진 분류이므로 더 큰 확률을 대표 축으로 사용합니다.
    axis = "dry_side" if dry_prob >= oily_prob else "oily_side"
    return {
        "axis": axis,
        "dry_probability": round(dry_prob, 4),
        "oily_probability": round(oily_prob, 4),
        "confidence": round(max(dry_prob, oily_prob), 4),
    }


def _build_regional_summary(forehead: dict, left_cheek: dict, right_cheek: dict) -> dict:
    axes = [forehead["axis"], left_cheek["axis"], right_cheek["axis"]]
    cheek_dry_votes = int(left_cheek["axis"] == "dry_side") + int(right_cheek["axis"] == "dry_side")
    cheek_oily_votes = int(left_cheek["axis"] == "oily_side") + int(right_cheek["axis"] == "oily_side")

    if cheek_oily_votes > cheek_dry_votes:
        cheek_mean_axis = "oily_side"
    elif cheek_dry_votes > cheek_oily_votes:
        cheek_mean_axis = "dry_side"
    else:
        # 양쪽 볼 판정이 엇갈리면 단순 우선순위 대신 확률 합으로 대표 축을 정합니다.
        cheek_mean_axis = "oily_side" if (
            left_cheek["oily_probability"] + right_cheek["oily_probability"]
            >= left_cheek["dry_probability"] + right_cheek["dry_probability"]
        ) else "dry_side"

    # 이 값은 이마와 볼에서 건성/지성 신호가 공존하는지만 빠르게 확인하기 위한 플래그입니다.
    regional_difference_exists = "dry_side" in axes and "oily_side" in axes
    forehead_oily_cheek_dry = forehead["axis"] == "oily_side" and cheek_mean_axis == "dry_side"

    return {
        "forehead": forehead,
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
        "cheek_mean_axis": cheek_mean_axis,
        "regional_difference_exists": regional_difference_exists,
        "forehead_oily_cheek_dry": forehead_oily_cheek_dry,
    }


async def extract_skin_states(file: UploadFile) -> dict:
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.") from exc

    if not is_model_ready():
        raise HTTPException(status_code=503, detail="binary_best.pt 파일을 확인하세요.")

    try:
        rois = extract_face_rois(image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # AI 서버는 이미지에서 얻은 상태값만 계산하고, 최종 4타입 판정은 설문을 가진 백엔드에서 마무리합니다.
    dry_prob, oily_prob = predict_global_face_probabilities(rois["whole_face"])
    global_face = _build_global_state(dry_prob, oily_prob)

    # 부위별 축은 이마/좌볼/우볼 순으로 계산해 응답 구조를 고정합니다.
    forehead_axis = predict_regional_axis("forehead", rois["forehead"])
    left_cheek_axis = predict_regional_axis("left_cheek", rois["left_cheek"])
    right_cheek_axis = predict_regional_axis("right_cheek", rois["right_cheek"])
    regional_skin_type = _build_regional_summary(forehead_axis, left_cheek_axis, right_cheek_axis)
    moisture = predict_moisture_states(rois["left_cheek"], rois["right_cheek"])

    return {
        "global_face": global_face,
        "regional_skin_type": regional_skin_type,
        "moisture": moisture,
    }
