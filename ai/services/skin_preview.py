from __future__ import annotations

from io import BytesIO
from pathlib import Path

import mediapipe as mp
from PIL import Image, ImageColor, ImageDraw

from preprocessing.mediapipe.face_mesh_roi_preview import compute_rois, read_rgb_image
from preprocessing.mediapipe.roi_extractor import LANDMARKER

PART_ORDER = ["forehead", "left_cheek", "right_cheek"]
PART_COLORS = {
    "forehead": "#FFB547",
    "left_cheek": "#FF6B7A",
    "right_cheek": "#55B7FF",
}


def load_face_image(image_path: str | Path) -> Image.Image:
    path = Path(image_path)
    image = Image.open(path).convert("RGB")
    image.filename = str(path)
    return image


def detect_preview_boxes(image: Image.Image) -> dict[str, object]:
    if LANDMARKER is None:
        raise RuntimeError("face_landmarker.task 파일을 확인하세요.")

    image_path = Path(getattr(image, "filename", ""))
    if not image_path:
        raise RuntimeError("원본 이미지 경로가 필요합니다.")

    image_rgb = read_rgb_image(image_path)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    results = LANDMARKER.detect(mp_image)
    if not results.face_landmarks:
        raise ValueError("얼굴을 찾지 못했어요.")

    rois = compute_rois(results.face_landmarks[0], image.width, image.height)
    return {part_name: rois[part_name] for part_name in PART_ORDER}


def render_box_preview(
    image: Image.Image,
    boxes: dict[str, object] | None = None,
    box_width: int = 10,
    fill_alpha: int = 64,
    corner_radius: int = 22,
) -> Image.Image:
    if boxes is None:
        boxes = detect_preview_boxes(image)

    canvas = image.convert("RGBA")
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for part_name in PART_ORDER:
        box = boxes[part_name]
        accent = ImageColor.getrgb(PART_COLORS[part_name])
        fill = (*accent, fill_alpha)
        draw.rounded_rectangle(
            (box.x1, box.y1, box.x2, box.y2),
            radius=corner_radius,
            outline=(*accent, 255),
            width=box_width,
            fill=fill,
        )

    canvas.alpha_composite(overlay)
    return canvas.convert("RGB")


def render_box_preview_from_path(
    image_path: str | Path,
    box_width: int = 10,
    fill_alpha: int = 64,
    corner_radius: int = 22,
) -> Image.Image:
    image = load_face_image(image_path)
    return render_box_preview(
        image=image,
        box_width=box_width,
        fill_alpha=fill_alpha,
        corner_radius=corner_radius,
    )


def render_box_preview_bytes(
    image_path: str | Path,
    box_width: int = 10,
    fill_alpha: int = 64,
    corner_radius: int = 22,
    quality: int = 95,
) -> bytes:
    preview = render_box_preview_from_path(
        image_path=image_path,
        box_width=box_width,
        fill_alpha=fill_alpha,
        corner_radius=corner_radius,
    )
    buffer = BytesIO()
    preview.save(buffer, format="JPEG", quality=quality)
    return buffer.getvalue()
