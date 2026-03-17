import asyncio
import io
import os

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps

from decision.skin_type_binary import build_binary_skin_response
from inference.display_score import build_display_scores
from inference.global_face import is_model_ready, predict_global_face_probabilities
from inference.moisture import predict_moisture_states
from inference.regional_face import predict_regional_axis
from preprocessing.mediapipe.roi_extractor import extract_face_rois

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _predict_global_face_with_context(image: Image.Image) -> tuple[float, float]:
    # global face는 원본 얼굴 분포를 그대로 보는 모델이라, ROI crop 없이 바로 호출합니다.
    try:
        return predict_global_face_probabilities(image)
    except RuntimeError as exc:
        raise RuntimeError(f"global_face 추론 실패: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"global_face 추론 중 예기치 못한 오류가 발생했어요: {exc}") from exc


def _extract_face_rois_with_context(image: Image.Image) -> dict[str, Image.Image]:
    # MediaPipe 단계는 이후 regional/moisture 추론에 필요한 공통 ROI를 한 번만 준비합니다.
    try:
        return extract_face_rois(image)
    except ValueError as exc:
        raise ValueError(f"MediaPipe ROI 추출 실패: {exc}") from exc
    except RuntimeError as exc:
        raise RuntimeError(f"MediaPipe ROI 추출 실패: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"MediaPipe ROI 추출 중 예기치 못한 오류가 발생했어요: {exc}") from exc


def _predict_regional_axis_with_context(roi_name: str, image: Image.Image) -> dict:
    # 부위별 모델은 실패 위치가 바로 드러나야 운영 로그와 사용자 응답을 빠르게 해석할 수 있습니다.
    try:
        return predict_regional_axis(roi_name, image)
    except RuntimeError as exc:
        raise RuntimeError(f"{roi_name} skin_type 추론 실패: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"{roi_name} skin_type 추론 중 예기치 못한 오류가 발생했어요: {exc}") from exc


def _predict_moisture_with_context(left_cheek: Image.Image, right_cheek: Image.Image) -> dict:
    # 수분 추론은 좌우 볼 쌍을 함께 쓰므로 별도 함수로 감싸 단계명을 고정합니다.
    try:
        return predict_moisture_states(left_cheek, right_cheek)
    except RuntimeError as exc:
        raise RuntimeError(f"cheek_mean moisture 추론 실패: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"cheek_mean moisture 추론 중 예기치 못한 오류가 발생했어요: {exc}") from exc


async def predict_binary_skin_type(file: UploadFile) -> dict:
    # 이 엔드포인트는 global face만 바로 확인하는 경량 경로입니다.
    if not is_model_ready():
        raise HTTPException(status_code=503, detail="binary_best.pt 파일을 확인하세요.")

    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(await file.read()))).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.") from exc

    try:
        dry_prob, oily_prob = _predict_global_face_with_context(image)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return build_binary_skin_response(dry_prob, oily_prob)


def _build_global_state(dry_prob: float, oily_prob: float) -> dict:
    # 전역 얼굴 모델은 건성/지성 이진 분류이므로 더 큰 확률을 대표 축으로 사용합니다.
    axis = "dry_side" if dry_prob >= oily_prob else "oily_side"
    return {
        "axis": axis,
        "dry_probability": round(dry_prob, 4),
        "oily_probability": round(oily_prob, 4),
        **build_display_scores(oily_prob, 0.5),
    }


def _build_regional_summary(forehead: dict, left_cheek: dict, right_cheek: dict) -> dict:
    # 최종 응답에서는 좌우 볼을 하나의 대표 축으로도 보여줘야 하므로 먼저 볼 합성 축을 계산합니다.
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
    cheek_mean_dry_probability = (left_cheek["dry_probability"] + right_cheek["dry_probability"]) / 2
    cheek_mean_oily_probability = (left_cheek["oily_probability"] + right_cheek["oily_probability"]) / 2

    return {
        "forehead": forehead,
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
        "cheek_mean_axis": cheek_mean_axis,
        "cheek_mean_dry_probability": round(cheek_mean_dry_probability, 4),
        "cheek_mean_oily_probability": round(cheek_mean_oily_probability, 4),
        **build_display_scores(cheek_mean_oily_probability, 0.45),
        "regional_difference_exists": regional_difference_exists,
        "forehead_oily_cheek_dry": forehead_oily_cheek_dry,
    }


async def _run_global_face_and_extract_rois(image: Image.Image) -> tuple[object, object]:
    # 1단계 병렬 구간:
    # - global face는 원본 이미지만 있으면 바로 실행 가능
    # - MediaPipe는 이후 모든 ROI 기반 추론의 선행 작업
    # 둘은 서로 입력 의존성이 없어서 같은 요청 안에서 동시에 시작합니다.
    global_task = asyncio.to_thread(_predict_global_face_with_context, image.copy())
    roi_task = asyncio.to_thread(_extract_face_rois_with_context, image.copy())
    return await asyncio.gather(global_task, roi_task, return_exceptions=True)


async def _run_regional_and_moisture(rois: dict[str, Image.Image]) -> tuple[dict, dict, dict, dict]:
    # 2단계 병렬 구간:
    # forehead / left / right skin_type 과 cheek_mean moisture 는 같은 ROI 집합만 공유하고,
    # 추론 자체는 서로 결과를 기다릴 필요가 없으므로 함께 실행합니다.
    forehead_task = asyncio.to_thread(_predict_regional_axis_with_context, "forehead", rois["forehead"].copy())
    left_cheek_task = asyncio.to_thread(_predict_regional_axis_with_context, "left_cheek", rois["left_cheek"].copy())
    right_cheek_task = asyncio.to_thread(_predict_regional_axis_with_context, "right_cheek", rois["right_cheek"].copy())
    moisture_task = asyncio.to_thread(
        _predict_moisture_with_context,
        rois["left_cheek"].copy(),
        rois["right_cheek"].copy(),
    )
    return await asyncio.gather(forehead_task, left_cheek_task, right_cheek_task, moisture_task)


async def extract_skin_states(file: UploadFile) -> dict:
    # 메인 파이프라인 엔드포인트:
    # 1) 요청 파일 검증
    # 2) 원본 이미지 로드
    # 3) global face + MediaPipe 병렬 실행
    # 4) ROI 준비 후 regional/moisture 병렬 실행
    # 5) 백엔드가 바로 쓸 수 있는 상태값 구조로 응답
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(await file.read()))).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.") from exc

    if not is_model_ready():
        raise HTTPException(status_code=503, detail="binary_best.pt 파일을 확인하세요.")

    try:
        # 여기서 원본 기반 global 추론과 ROI 준비를 동시에 시작해 불필요한 대기 구간을 줄입니다.
        global_result, roi_result = await _run_global_face_and_extract_rois(image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="AI 추론 중 오류가 발생했어요.") from exc

    if isinstance(global_result, Exception):
        if isinstance(global_result, RuntimeError):
            raise HTTPException(status_code=503, detail=str(global_result)) from global_result
        raise HTTPException(status_code=500, detail="AI 추론 중 오류가 발생했어요.") from global_result

    dry_prob, oily_prob = global_result

    # global face는 학습 기준과 맞추기 위해 MediaPipe crop 이전의 원본 이미지를 그대로 사용합니다.
    global_face = _build_global_state(dry_prob, oily_prob)

    if isinstance(roi_result, Exception):
        return {
            "global_face": global_face,
            "regional_skin_type": None,
            "moisture": None,
            "warnings": [
                {
                    "stage": "mediapipe_roi",
                    "detail": str(roi_result),
                }
            ],
        }

    rois = roi_result

    # ROI 기반 모델들은 서로 독립이라 두 번째 병렬 구간으로 묶습니다.
    try:
        forehead_axis, left_cheek_axis, right_cheek_axis, moisture = await _run_regional_and_moisture(rois)
    except RuntimeError as exc:
        return {
            "global_face": global_face,
            "regional_skin_type": None,
            "moisture": None,
            "warnings": [
                {
                    "stage": "regional_or_moisture",
                    "detail": str(exc),
                }
            ],
        }
    except Exception as exc:
        return {
            "global_face": global_face,
            "regional_skin_type": None,
            "moisture": None,
            "warnings": [
                {
                    "stage": "regional_or_moisture",
                    "detail": "AI 추론 중 오류가 발생했어요.",
                }
            ],
        }

    # regional 응답은 원시 부위 결과 그대로와, 서비스 규칙에 바로 쓸 대표 플래그를 함께 반환합니다.
    regional_skin_type = _build_regional_summary(forehead_axis, left_cheek_axis, right_cheek_axis)

    return {
        "global_face": global_face,
        "regional_skin_type": regional_skin_type,
        "moisture": moisture,
        "warnings": [],
    }
