from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image

LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
LEFT_EYE_UPPER = 159
RIGHT_EYE_UPPER = 386
LEFT_EYE_LOWER = 145
RIGHT_EYE_LOWER = 374
NOSE_TIP = 1
UPPER_LIP = 13
LOWER_LIP = 14
LEFT_MOUTH = 61
RIGHT_MOUTH = 291
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

    def normalize(self, width: int, height: int, min_size: int = 8) -> "Box":
        # 랜드마크가 비정상적으로 튀어도 crop 좌표가 뒤집히지 않도록 최소 크기를 보장합니다.
        box = self.clamp(width, height)
        x1, y1, x2, y2 = box.x1, box.y1, box.x2, box.y2

        if x2 <= x1:
            center_x = max(0, min(int((x1 + x2) / 2), width - 1))
            half = max(1, min_size // 2)
            x1 = max(0, center_x - half)
            x2 = min(width, x1 + min_size)
            if x2 <= x1:
                x2 = min(width, x1 + 1)

        if y2 <= y1:
            center_y = max(0, min(int((y1 + y2) / 2), height - 1))
            half = max(1, min_size // 2)
            y1 = max(0, center_y - half)
            y2 = min(height, y1 + min_size)
            if y2 <= y1:
                y2 = min(height, y1 + 1)

        return Box(x1=x1, y1=y1, x2=x2, y2=y2).clamp(width, height)


@dataclass
class NormalizedLandmark:
    x: float
    y: float


@dataclass
class RoiExtractionResult:
    crops: dict[str, Image.Image]
    roi_metadata: dict[str, object]


def _to_point(landmarks, index: int, width: int, height: int) -> tuple[int, int]:
    landmark = landmarks[index]
    return int(landmark.x * width), int(landmark.y * height)


def _rotate_point(x: float, y: float, center_x: float, center_y: float, angle_rad: float) -> tuple[float, float]:
    shifted_x = x - center_x
    shifted_y = y - center_y
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    rotated_x = shifted_x * cos_a - shifted_y * sin_a
    rotated_y = shifted_x * sin_a + shifted_y * cos_a
    return rotated_x + center_x, rotated_y + center_y


def _clamp_point(x: float, y: float, width: int, height: int) -> tuple[float, float]:
    max_x = max(0.0, float(width - 1))
    max_y = max(0.0, float(height - 1))
    return min(max(x, 0.0), max_x), min(max(y, 0.0), max_y)


def _normalize_box(box: Box, width: int, height: int) -> dict[str, float]:
    return {
        "x1": round(box.x1 / width, 6),
        "y1": round(box.y1 / height, 6),
        "x2": round(box.x2 / width, 6),
        "y2": round(box.y2 / height, 6),
    }


def _to_original_vertices(
    box: Box,
    width: int,
    height: int,
    rotate_deg: float,
    rotate_center: tuple[float, float],
    flipped_180: bool,
) -> list[tuple[float, float]]:
    vertices = [
        (float(box.x1), float(box.y1)),
        (float(box.x2), float(box.y1)),
        (float(box.x2), float(box.y2)),
        (float(box.x1), float(box.y2)),
    ]
    image_center = (width / 2.0, height / 2.0)
    original_vertices: list[tuple[float, float]] = []

    for point_x, point_y in vertices:
        if flipped_180:
            point_x, point_y = _rotate_point(
                point_x,
                point_y,
                image_center[0],
                image_center[1],
                math.radians(180.0),
            )

        point_x, point_y = _rotate_point(
            point_x,
            point_y,
            rotate_center[0],
            rotate_center[1],
            math.radians(-rotate_deg),
        )
        original_vertices.append(_clamp_point(point_x, point_y, width, height))

    return original_vertices


def _build_roi_overlay_metadata(
    rois: dict[str, Box],
    width: int,
    height: int,
    rotate_deg: float,
    rotate_center: tuple[float, float],
    flipped_180: bool,
) -> dict[str, object]:
    overlay_names = ("forehead", "left_cheek", "right_cheek")
    roi_entries: dict[str, object] = {}

    for roi_name in overlay_names:
        box = rois[roi_name]
        original_vertices = _to_original_vertices(
            box,
            width,
            height,
            rotate_deg,
            rotate_center,
            flipped_180,
        )
        min_x = min(point[0] for point in original_vertices)
        max_x = max(point[0] for point in original_vertices)
        min_y = min(point[1] for point in original_vertices)
        max_y = max(point[1] for point in original_vertices)
        original_bbox = Box(
            x1=int(math.floor(min_x)),
            y1=int(math.floor(min_y)),
            x2=int(math.ceil(max_x)),
            y2=int(math.ceil(max_y)),
        ).normalize(width, height, min_size=1)

        roi_entries[roi_name] = {
            "bbox": _normalize_box(original_bbox, width, height),
        }

    return {
        "coordinate_space": "original_normalized",
        "image_size": {
            "width": width,
            "height": height,
        },
        "alignment": {
            "rotate_deg": round(rotate_deg, 4),
            "flipped_180": flipped_180,
        },
        "rois": roi_entries,
    }


def _align_face_landmarks(landmarks, width: int, height: int) -> tuple[list[NormalizedLandmark], float, tuple[float, float]]:
    left_eye_x, left_eye_y = _to_point(landmarks, LEFT_EYE_OUTER, width, height)
    right_eye_x, right_eye_y = _to_point(landmarks, RIGHT_EYE_OUTER, width, height)
    roll_deg = math.degrees(math.atan2(right_eye_y - left_eye_y, right_eye_x - left_eye_x))

    all_x = [landmark.x * width for landmark in landmarks]
    all_y = [landmark.y * height for landmark in landmarks]
    face_center = ((min(all_x) + max(all_x)) / 2.0, (min(all_y) + max(all_y)) / 2.0)

    rotate_deg = -roll_deg
    rotate_rad = math.radians(rotate_deg)
    aligned_landmarks = []
    for landmark in landmarks:
        point_x = landmark.x * width
        point_y = landmark.y * height
        rotated_x, rotated_y = _rotate_point(point_x, point_y, face_center[0], face_center[1], rotate_rad)
        aligned_landmarks.append(
            NormalizedLandmark(
                x=rotated_x / width,
                y=rotated_y / height,
            )
        )

    return aligned_landmarks, rotate_deg, face_center


def _rotate_landmarks_180(landmarks: list[NormalizedLandmark]) -> list[NormalizedLandmark]:
    return [
        NormalizedLandmark(x=1.0 - landmark.x, y=1.0 - landmark.y)
        for landmark in landmarks
    ]


def _compute_rois(landmarks, width: int, height: int) -> dict[str, Box]:
    all_x = [landmark.x * width for landmark in landmarks]
    all_y = [landmark.y * height for landmark in landmarks]
    face_left, face_right = int(min(all_x)), int(max(all_x))
    face_top, face_bottom = int(min(all_y)), int(max(all_y))
    face_w = face_right - face_left
    face_h = face_bottom - face_top

    face_margin_x = int(face_w * 0.05)
    face_margin_top_y = int(face_h * 0.05)
    face_margin_bottom_y = int(face_h * 0.12)
    # 전역 얼굴 분류기는 너무 타이트한 박스보다 얼굴 윤곽이 조금 포함된 입력이 더 안정적입니다.
    whole_face = Box(
        x1=face_left - face_margin_x,
        y1=face_top - face_margin_top_y,
        x2=face_right + face_margin_x,
        y2=face_bottom + face_margin_bottom_y,
    ).normalize(width, height, min_size=32)

    left_eye_upper_y = _to_point(landmarks, LEFT_EYE_UPPER, width, height)[1]
    right_eye_upper_y = _to_point(landmarks, RIGHT_EYE_UPPER, width, height)[1]
    left_eye_lower_y = _to_point(landmarks, LEFT_EYE_LOWER, width, height)[1]
    right_eye_lower_y = _to_point(landmarks, RIGHT_EYE_LOWER, width, height)[1]
    nose_x, nose_y = _to_point(landmarks, NOSE_TIP, width, height)
    upper_lip_y = _to_point(landmarks, UPPER_LIP, width, height)[1]
    lower_lip_y = _to_point(landmarks, LOWER_LIP, width, height)[1]
    forehead_x, forehead_top_y = _to_point(landmarks, FOREHEAD_TOP, width, height)

    eye_line_y = int((left_eye_upper_y + right_eye_upper_y) / 2)
    eye_lower_line_y = int((left_eye_lower_y + right_eye_lower_y) / 2)
    mouth_line_y = int((upper_lip_y + lower_lip_y) / 2)
    # old moisture crop과 가장 비슷한 분포는 코 기준 좌우 대칭 박스였습니다.
    # eye line 영향은 최소화하고, 코 옆 광대 영역을 중심으로 잡습니다.
    cheek_top_y = int(max(eye_lower_line_y + face_h * 0.02, nose_y - face_h * 0.12))
    cheek_bottom_y = int(mouth_line_y + face_h * 0.02)
    inner_gap = int(face_w * 0.12)
    outer_width = int(face_w * 0.38)

    forehead_half_w = int(face_w * 0.20)
    forehead_bottom_y = int(eye_line_y - face_h * 0.05)
    forehead = Box(
        x1=forehead_x - forehead_half_w,
        y1=forehead_top_y + int(face_h * 0.03),
        x2=forehead_x + forehead_half_w,
        y2=forehead_bottom_y,
    ).normalize(width, height, min_size=24)

    left_cheek = Box(
        x1=nose_x - outer_width,
        y1=cheek_top_y,
        x2=nose_x - inner_gap,
        y2=cheek_bottom_y,
    ).normalize(width, height, min_size=24)

    right_cheek = Box(
        x1=nose_x + inner_gap,
        y1=cheek_top_y,
        x2=nose_x + outer_width,
        y2=cheek_bottom_y,
    ).normalize(width, height, min_size=24)

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


def extract_face_roi_result(image: Image.Image) -> RoiExtractionResult:
    if LANDMARKER is None:
        raise RuntimeError("face_landmarker.task 파일을 확인하세요.")

    image_rgb = np.array(image.convert("RGB"))
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    results = LANDMARKER.detect(mp_image)
    if not results.face_landmarks:
        raise ValueError("얼굴을 찾지 못했어요.")

    aligned_landmarks, rotate_deg, rotate_center = _align_face_landmarks(results.face_landmarks[0], image.width, image.height)
    aligned_image = image.rotate(
        rotate_deg,
        resample=Image.Resampling.BICUBIC,
        center=rotate_center,
        expand=False,
    )
    forehead_y = _to_point(aligned_landmarks, FOREHEAD_TOP, aligned_image.width, aligned_image.height)[1]
    upper_lip_y = _to_point(aligned_landmarks, UPPER_LIP, aligned_image.width, aligned_image.height)[1]
    # roll 보정만으로는 180도 뒤집힌 셀카가 남을 수 있어, 이마가 입보다 아래에 있으면 한 번 더 뒤집습니다.
    flipped_180 = False
    if forehead_y > upper_lip_y:
        aligned_image = aligned_image.rotate(180, resample=Image.Resampling.BICUBIC, expand=False)
        aligned_landmarks = _rotate_landmarks_180(aligned_landmarks)
        flipped_180 = True

    rois = _compute_rois(aligned_landmarks, aligned_image.width, aligned_image.height)
    crops = {
        name: aligned_image.crop((box.x1, box.y1, box.x2, box.y2))
        for name, box in rois.items()
    }
    return RoiExtractionResult(
        crops=crops,
        roi_metadata=_build_roi_overlay_metadata(
            rois=rois,
            width=image.width,
            height=image.height,
            rotate_deg=rotate_deg,
            rotate_center=rotate_center,
            flipped_180=flipped_180,
        ),
    )


def extract_face_rois(image: Image.Image) -> dict[str, Image.Image]:
    # 기존 호출부 호환성을 위해 crop 이미지 dict 인터페이스는 유지합니다.
    return extract_face_roi_result(image).crops
