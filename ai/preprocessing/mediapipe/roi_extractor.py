from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image

LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
LEFT_EYE_UPPER = 159
RIGHT_EYE_UPPER = 386
NOSE_TIP = 1
UPPER_LIP = 13
LOWER_LIP = 14
FOREHEAD_TOP = 10

BASE_DIR = Path(__file__).resolve().parents[2]
LANDMARKER_MODEL_PATH = BASE_DIR / "preprocessing" / "mediapipe" / "models" / "face_landmarker.task"


@dataclass
class Box:
    x1: int
    y1: int
    x2: int
    y2: int

    def clamp(self, width: int, height: int) -> "Box":
        return Box(
            x1=max(0, min(self.x1, width - 1)),
            y1=max(0, min(self.y1, height - 1)),
            x2=max(1, min(self.x2, width)),
            y2=max(1, min(self.y2, height)),
        )


def _to_point(landmarks, index: int, width: int, height: int) -> tuple[int, int]:
    landmark = landmarks[index]
    return int(landmark.x * width), int(landmark.y * height)


def _compute_rois(landmarks, width: int, height: int) -> dict[str, Box]:
    all_x = [landmark.x * width for landmark in landmarks]
    all_y = [landmark.y * height for landmark in landmarks]
    face_left, face_right = int(min(all_x)), int(max(all_x))
    face_top, face_bottom = int(min(all_y)), int(max(all_y))
    face_w = face_right - face_left
    face_h = face_bottom - face_top

    face_margin_x = int(face_w * 0.05)
    face_margin_y = int(face_h * 0.05)
    # 전역 얼굴 분류기는 너무 타이트한 박스보다 얼굴 윤곽이 조금 포함된 입력이 더 안정적입니다.
    whole_face = Box(
        x1=face_left - face_margin_x,
        y1=face_top - face_margin_y,
        x2=face_right + face_margin_x,
        y2=face_bottom + face_margin_y,
    ).clamp(width, height)

    left_eye_upper_y = _to_point(landmarks, LEFT_EYE_UPPER, width, height)[1]
    right_eye_upper_y = _to_point(landmarks, RIGHT_EYE_UPPER, width, height)[1]
    nose_x, _ = _to_point(landmarks, NOSE_TIP, width, height)
    upper_lip_y = _to_point(landmarks, UPPER_LIP, width, height)[1]
    lower_lip_y = _to_point(landmarks, LOWER_LIP, width, height)[1]
    forehead_x, forehead_top_y = _to_point(landmarks, FOREHEAD_TOP, width, height)

    eye_line_y = int((left_eye_upper_y + right_eye_upper_y) / 2)
    mouth_line_y = int((upper_lip_y + lower_lip_y) / 2)
    # 볼 영역은 눈선과 입선 사이에 두어 머리카락, 턱 배경이 덜 섞이게 합니다.
    cheek_top_y = int(eye_line_y + face_h * 0.08)
    cheek_bottom_y = int(mouth_line_y + face_h * 0.03)
    inner_gap = int(face_w * 0.10)
    outer_margin = int(face_w * 0.10)

    forehead_half_w = int(face_w * 0.20)
    forehead_bottom_y = int(eye_line_y - face_h * 0.05)
    forehead = Box(
        x1=forehead_x - forehead_half_w,
        y1=forehead_top_y + int(face_h * 0.03),
        x2=forehead_x + forehead_half_w,
        y2=forehead_bottom_y,
    ).clamp(width, height)

    left_cheek = Box(
        x1=face_left + outer_margin,
        y1=cheek_top_y,
        x2=nose_x - inner_gap,
        y2=cheek_bottom_y,
    ).clamp(width, height)

    right_cheek = Box(
        x1=nose_x + inner_gap,
        y1=cheek_top_y,
        x2=face_right - outer_margin,
        y2=cheek_bottom_y,
    ).clamp(width, height)

    return {
        "whole_face": whole_face,
        "forehead": forehead,
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
    }


def _load_landmarker():
    if not LANDMARKER_MODEL_PATH.exists():
        return None

    # 현재 API 계약상 한 요청에 한 얼굴만 처리하면 충분합니다.
    base_options = mp.tasks.BaseOptions(model_asset_path=str(LANDMARKER_MODEL_PATH))
    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=1,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    return mp.tasks.vision.FaceLandmarker.create_from_options(options)


LANDMARKER = _load_landmarker()


def extract_face_rois(image: Image.Image) -> dict[str, Image.Image]:
    if LANDMARKER is None:
        raise RuntimeError("face_landmarker.task 파일을 확인하세요.")

    image_rgb = np.array(image.convert("RGB"))
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    results = LANDMARKER.detect(mp_image)
    if not results.face_landmarks:
        raise ValueError("얼굴을 찾지 못했어요.")

    rois = _compute_rois(results.face_landmarks[0], image.width, image.height)
    # 이후 추론 모듈은 랜드마크 좌표를 몰라도 되도록, 잘린 이미지 조각만 반환합니다.
    return {
        name: image.crop((box.x1, box.y1, box.x2, box.y2))
        for name, box in rois.items()
    }
