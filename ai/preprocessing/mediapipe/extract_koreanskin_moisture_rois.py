from __future__ import annotations

import argparse
import csv
import json
import os
from dataclasses import dataclass
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[2] / ".cache" / "matplotlib"))

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image


LEFT_EYE_UPPER = 159
RIGHT_EYE_UPPER = 386
NOSE_TIP = 1
UPPER_LIP = 13
LOWER_LIP = 14
FOREHEAD_TOP = 10
DEVICE_CODE_TO_NAME = {
    0: "digital_camera",
    1: "smart_pad",
    2: "smart_phone",
}


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

    left_eye_upper_y = to_point(landmarks, LEFT_EYE_UPPER, width, height)[1]
    right_eye_upper_y = to_point(landmarks, RIGHT_EYE_UPPER, width, height)[1]
    nose_x, _ = to_point(landmarks, NOSE_TIP, width, height)
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
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
    }


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_rgb_image(image_path: Path) -> np.ndarray:
    # Windows에서 한글 경로가 섞여도 안정적으로 읽히도록 imdecode를 사용합니다.
    image_bytes = np.fromfile(str(image_path), dtype=np.uint8)
    image_bgr = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError(f"Failed to load image: {image_path}")
    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)


def infer_split(path: Path) -> str:
    path_str = str(path)
    if "\\Training\\" in path_str:
        return "train"
    if "\\Validation\\" in path_str:
        return "validation"
    return "unknown"


def infer_device_type(path: Path, device_code: int | None) -> str:
    path_str = str(path)
    if "\\1. 디지털카메라\\" in path_str:
        return "digital_camera"
    if "\\2. 스마트패드\\" in path_str:
        return "smart_pad"
    if "\\3. 스마트폰\\" in path_str:
        return "smart_phone"
    if device_code is not None:
        return DEVICE_CODE_TO_NAME.get(device_code, f"device_{device_code}")
    return "unknown"


def collect_records(dataset_root: Path) -> list[dict]:
    image_files = {}
    for image_path in dataset_root.rglob("*.jpg"):
        image_files[image_path.name] = image_path

    grouped: dict[str, dict] = {}
    for json_path in dataset_root.rglob("*_F_0*.json"):
        data = load_json(json_path)
        filename = data["info"]["filename"]
        record = grouped.setdefault(
            filename,
            {
                "split": infer_split(json_path),
                "subject_id": data["info"]["id"],
                "image_filename": filename,
                "image_path": str(image_files.get(filename, "")),
                "skin_type": data["info"].get("skin_type", ""),
                "device_type": infer_device_type(json_path, data.get("images", {}).get("device")),
                "forehead_json": "",
                "left_json": "",
                "right_json": "",
                "forehead_moisture": "",
                "left_cheek_moisture": "",
                "right_cheek_moisture": "",
            },
        )

        equipment = data.get("equipment") or {}
        if "forehead_moisture" in equipment:
            record["forehead_json"] = str(json_path)
            record["forehead_moisture"] = equipment.get("forehead_moisture", "")
        if "l_cheek_moisture" in equipment:
            record["left_json"] = str(json_path)
            record["left_cheek_moisture"] = equipment.get("l_cheek_moisture", "")
        if "r_cheek_moisture" in equipment:
            record["right_json"] = str(json_path)
            record["right_cheek_moisture"] = equipment.get("r_cheek_moisture", "")

    records = []
    for record in grouped.values():
        has_all_labels = (
            record["image_path"]
            and record["forehead_json"]
            and record["left_json"]
            and record["right_json"]
        )
        if has_all_labels:
            left_value = float(record["left_cheek_moisture"])
            right_value = float(record["right_cheek_moisture"])
            forehead_value = float(record["forehead_moisture"])
            record["cheek_mean_moisture"] = round((left_value + right_value) / 2.0, 4)
            record["forehead_minus_cheek_mean"] = round(forehead_value - record["cheek_mean_moisture"], 4)
            records.append(record)
    return sorted(records, key=lambda item: item["image_filename"])


def process_records(
    records: list[dict],
    output_dir: Path,
    model_path: Path,
) -> tuple[int, int]:
    forehead_dir = output_dir / "forehead"
    left_dir = output_dir / "left_cheek"
    right_dir = output_dir / "right_cheek"
    forehead_dir.mkdir(parents=True, exist_ok=True)
    left_dir.mkdir(parents=True, exist_ok=True)
    right_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = output_dir / "manifest.csv"
    base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=1,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )

    success = 0
    failures = 0
    with manifest_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "split",
                "subject_id",
                "image_filename",
                "image_path",
                "skin_type",
                "device_type",
                "forehead_moisture",
                "left_cheek_moisture",
                "right_cheek_moisture",
                "cheek_mean_moisture",
                "forehead_minus_cheek_mean",
                "forehead_crop_path",
                "left_crop_path",
                "right_crop_path",
                "forehead_json",
                "left_json",
                "right_json",
            ],
        )
        writer.writeheader()

        face_landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
        try:
            for record in records:
                image_path = Path(record["image_path"])
                try:
                    image_rgb = read_rgb_image(image_path)
                except ValueError:
                    failures += 1
                    continue

                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                results = face_landmarker.detect(mp_image)
                if not results.face_landmarks:
                    failures += 1
                    continue

                image = Image.fromarray(image_rgb)
                rois = compute_rois(results.face_landmarks[0], image.width, image.height)
                forehead_crop = image.crop(
                    (rois["forehead"].x1, rois["forehead"].y1, rois["forehead"].x2, rois["forehead"].y2)
                )
                left_crop = image.crop(
                    (rois["left_cheek"].x1, rois["left_cheek"].y1, rois["left_cheek"].x2, rois["left_cheek"].y2)
                )
                right_crop = image.crop(
                    (rois["right_cheek"].x1, rois["right_cheek"].y1, rois["right_cheek"].x2, rois["right_cheek"].y2)
                )

                base = Path(record["image_filename"]).stem
                forehead_crop_path = forehead_dir / f"{base}_forehead.jpg"
                left_crop_path = left_dir / f"{base}_left_cheek.jpg"
                right_crop_path = right_dir / f"{base}_right_cheek.jpg"
                forehead_crop.save(forehead_crop_path, quality=95)
                left_crop.save(left_crop_path, quality=95)
                right_crop.save(right_crop_path, quality=95)

                writer.writerow(
                    {
                        **record,
                        "forehead_crop_path": str(forehead_crop_path),
                        "left_crop_path": str(left_crop_path),
                        "right_crop_path": str(right_crop_path),
                    }
                )
                success += 1
        finally:
            face_landmarker.close()

    return success, failures


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract KoreanSkin ROI crops for moisture supervision")
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument(
        "--model-path",
        default=str(Path(__file__).resolve().parent / "models" / "face_landmarker.task"),
    )
    args = parser.parse_args()

    dataset_root = Path(args.dataset_root)
    output_dir = Path(args.output_dir)
    records = collect_records(dataset_root)
    if args.limit > 0:
        records = records[: args.limit]
    success, failures = process_records(records, output_dir, Path(args.model_path))
    print(f"selected_records={len(records)}")
    print(f"success={success}")
    print(f"failures={failures}")
    print(f"manifest={output_dir / 'manifest.csv'}")


if __name__ == "__main__":
    main()
