from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[2] / ".cache" / "matplotlib"))

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image, ImageDraw, ImageOps


LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
LEFT_EYE_UPPER = 159
RIGHT_EYE_UPPER = 386
NOSE_TIP = 1
MOUTH_LEFT = 61
MOUTH_RIGHT = 291
UPPER_LIP = 13
LOWER_LIP = 14
FOREHEAD_TOP = 10


@dataclass
class Box:
    x1: int
    y1: int
    x2: int
    y2: int

    @property
    def width(self) -> int:
        return max(0, self.x2 - self.x1)

    @property
    def height(self) -> int:
        return max(0, self.y2 - self.y1)

    def clamp(self, width: int, height: int) -> "Box":
        return Box(
            x1=max(0, min(self.x1, width - 1)),
            y1=max(0, min(self.y1, height - 1)),
            x2=max(1, min(self.x2, width)),
            y2=max(1, min(self.y2, height)),
        )


def to_point(landmarks, index: int, width: int, height: int) -> tuple[int, int]:
    lm = landmarks[index]
    return int(lm.x * width), int(lm.y * height)


def compute_rois(landmarks, width: int, height: int) -> dict[str, Box]:
    all_x = [lm.x * width for lm in landmarks]
    all_y = [lm.y * height for lm in landmarks]
    face_left, face_right = int(min(all_x)), int(max(all_x))
    face_top, face_bottom = int(min(all_y)), int(max(all_y))
    face_w = face_right - face_left
    face_h = face_bottom - face_top

    left_eye_x, left_eye_y = to_point(landmarks, LEFT_EYE_OUTER, width, height)
    right_eye_x, right_eye_y = to_point(landmarks, RIGHT_EYE_OUTER, width, height)
    left_eye_upper_y = to_point(landmarks, LEFT_EYE_UPPER, width, height)[1]
    right_eye_upper_y = to_point(landmarks, RIGHT_EYE_UPPER, width, height)[1]
    nose_x, nose_y = to_point(landmarks, NOSE_TIP, width, height)
    mouth_left_x, mouth_left_y = to_point(landmarks, MOUTH_LEFT, width, height)
    mouth_right_x, mouth_right_y = to_point(landmarks, MOUTH_RIGHT, width, height)
    upper_lip_y = to_point(landmarks, UPPER_LIP, width, height)[1]
    lower_lip_y = to_point(landmarks, LOWER_LIP, width, height)[1]
    forehead_x, forehead_top_y = to_point(landmarks, FOREHEAD_TOP, width, height)

    eye_line_y = int((left_eye_upper_y + right_eye_upper_y) / 2)
    mouth_line_y = int((upper_lip_y + lower_lip_y) / 2)
    cheek_top_y = int(eye_line_y + face_h * 0.08)
    cheek_bottom_y = int(mouth_line_y + face_h * 0.03)
    inner_gap = int(face_w * 0.10)
    outer_margin = int(face_w * 0.10)

    forehead_half_w = int(face_w * 0.20)
    forehead_bottom_y = int(eye_line_y - face_h * 0.05)
    forehead_box = Box(
        x1=forehead_x - forehead_half_w,
        y1=forehead_top_y + int(face_h * 0.03),
        x2=forehead_x + forehead_half_w,
        y2=forehead_bottom_y,
    ).clamp(width, height)

    nose_half_w = int(face_w * 0.10)
    nose_box = Box(
        x1=nose_x - nose_half_w,
        y1=int(eye_line_y + face_h * 0.02),
        x2=nose_x + nose_half_w,
        y2=int(mouth_line_y - face_h * 0.02),
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
        "forehead": forehead_box,
        "nose": nose_box,
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
    }


def draw_boxes(image: Image.Image, rois: dict[str, Box]) -> Image.Image:
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    colors = {
        "forehead": (255, 180, 0),
        "nose": (255, 0, 200),
        "left_cheek": (255, 80, 80),
        "right_cheek": (80, 180, 255),
    }
    for name, box in rois.items():
        draw.rectangle((box.x1, box.y1, box.x2, box.y2), outline=colors[name], width=4)
        draw.text((box.x1, max(0, box.y1 - 18)), name, fill=colors[name])
    return annotated


def create_roi_panel(image: Image.Image, rois: dict[str, Box]) -> Image.Image:
    names = ["forehead", "nose", "left_cheek", "right_cheek"]
    crops = [image.crop((rois[name].x1, rois[name].y1, rois[name].x2, rois[name].y2)) for name in names]
    thumb_size = (120, 120)
    margin = 8
    label_h = 18
    canvas = Image.new("RGB", (margin + 2 * (thumb_size[0] + margin), margin + 2 * (thumb_size[1] + label_h + margin)), "white")
    draw = ImageDraw.Draw(canvas)
    for idx, (name, crop) in enumerate(zip(names, crops)):
        thumb = ImageOps.contain(crop, thumb_size)
        col = idx % 2
        row = idx // 2
        x = margin + col * (thumb_size[0] + margin)
        y = margin + row * (thumb_size[1] + label_h + margin)
        bg = Image.new("RGB", thumb_size, "#f2f2f2")
        bg.paste(thumb, ((thumb_size[0] - thumb.width) // 2, (thumb_size[1] - thumb.height) // 2))
        canvas.paste(bg, (x, y))
        draw.text((x, y + thumb_size[1] + 2), name, fill="black")
    return canvas


def read_rgb_image(image_path: Path) -> np.ndarray:
    # Windows에서 한글 경로가 섞여도 안정적으로 읽히도록 imdecode를 사용합니다.
    image_bytes = np.fromfile(str(image_path), dtype=np.uint8)
    image_bgr = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError(f"Failed to load image: {image_path}")
    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)


def save_contact_sheet(input_dir: Path, output_dir: Path) -> None:
    names = sorted(path.name for path in input_dir.glob("*.jpg"))
    thumb_size = (170, 170)
    margin = 10
    label_h = 18
    cols = 3
    rows = len(names)
    sheet = Image.new(
        "RGB",
        (margin + cols * (thumb_size[0] + margin), margin + rows * (thumb_size[1] + label_h + margin)),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    for row, name in enumerate(names):
        base = Path(name).stem
        paths = [
            input_dir / name,
            output_dir / f"{base}_annotated.jpg",
            output_dir / f"{base}_roi_panel.jpg",
        ]
        labels = ["input", "annotated", "roi"]
        for col, path in enumerate(paths):
            img = Image.open(path).convert("RGB")
            thumb = ImageOps.contain(img, thumb_size)
            x = margin + col * (thumb_size[0] + margin)
            y = margin + row * (thumb_size[1] + label_h + margin)
            bg = Image.new("RGB", thumb_size, "#f3f3f3")
            bg.paste(thumb, ((thumb_size[0] - thumb.width) // 2, (thumb_size[1] - thumb.height) // 2))
            sheet.paste(bg, (x, y))
            draw.text((x, y + thumb_size[1] + 2), f"{base} | {labels[col]}", fill="black")
    sheet.save(output_dir / "mediapipe_roi_contact_sheet.jpg", quality=90)


def process_images(input_dir: Path, output_dir: Path, model_path: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=1,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    face_landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
    try:
        for image_path in sorted(input_dir.glob("*.jpg")):
            image_rgb = read_rgb_image(image_path)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
            results = face_landmarker.detect(mp_image)
            if not results.face_landmarks:
                continue

            pil_image = Image.fromarray(image_rgb)
            landmarks = results.face_landmarks[0]
            rois = compute_rois(landmarks, pil_image.width, pil_image.height)

            annotated = draw_boxes(pil_image, rois)
            roi_panel = create_roi_panel(pil_image, rois)
            base = image_path.stem
            annotated.save(output_dir / f"{base}_annotated.jpg", quality=95)
            roi_panel.save(output_dir / f"{base}_roi_panel.jpg", quality=95)
    finally:
        face_landmarker.close()

    save_contact_sheet(input_dir, output_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description="Preview ROI boxes using MediaPipe Face Mesh")
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument(
        "--model-path",
        default=str(Path(__file__).resolve().parent / "models" / "face_landmarker.task"),
    )
    args = parser.parse_args()
    process_images(Path(args.input_dir), Path(args.output_dir), Path(args.model_path))


if __name__ == "__main__":
    main()
