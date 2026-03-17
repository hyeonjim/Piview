from __future__ import annotations

import argparse
import csv
import json
import logging
import math
import statistics
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from inference.global_face import predict_global_face_probabilities
from inference.moisture import predict_moisture_states
from inference.regional_face import predict_regional_axis
from preprocessing.mediapipe.roi_extractor import extract_face_rois

LOGGER = logging.getLogger("verify_skin_pipeline_full")

LABEL_NAME = {
    "0": "neutral",
    "1": "dry",
    "2": "unknown_2",
    "3": "dry_combo",
    "4": "oily_combo",
    "5": "oily",
}

BINARY_MAP = {
    "1": "dry_side",
    "3": "dry_side",
    "4": "oily_side",
    "5": "oily_side",
}


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


def load_rows(manifest_path: Path, limit: int) -> list[dict[str, str]]:
    # 검증 기준 manifest를 읽고, 필요하면 일부만 잘라 샘플 점검에도 재사용합니다.
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    if limit > 0:
        rows = rows[:limit]
    return rows


def _calculate_cheek_mean_axis(left_axis: dict, right_axis: dict) -> str:
    cheek_dry_votes = int(left_axis["axis"] == "dry_side") + int(right_axis["axis"] == "dry_side")
    cheek_oily_votes = int(left_axis["axis"] == "oily_side") + int(right_axis["axis"] == "oily_side")

    if cheek_oily_votes > cheek_dry_votes:
        return "oily_side"
    if cheek_dry_votes > cheek_oily_votes:
        return "dry_side"

    # 좌우 볼 판정이 갈리면 확률 합으로 대표 축을 정합니다.
    return "oily_side" if (
        left_axis["oily_probability"] + right_axis["oily_probability"]
        >= left_axis["dry_probability"] + right_axis["dry_probability"]
    ) else "dry_side"


def summarize_row(row: dict[str, str]) -> dict[str, object]:
    # 실제 서비스와 같은 경로를 타기 위해 원본 이미지 한 장만 읽고 ROI를 직접 추출합니다.
    with Image.open(row["image_path"]) as image_file:
        image = image_file.convert("RGB")

    rois = extract_face_rois(image)

    # global face는 실제 채택된 학습/평가 조건과 맞추기 위해 원본 이미지를 그대로 넣습니다.
    dry_prob, oily_prob = predict_global_face_probabilities(image)
    global_axis = "dry_side" if dry_prob >= oily_prob else "oily_side"

    forehead_axis = predict_regional_axis("forehead", rois["forehead"])
    left_axis = predict_regional_axis("left_cheek", rois["left_cheek"])
    right_axis = predict_regional_axis("right_cheek", rois["right_cheek"])
    cheek_mean_axis = _calculate_cheek_mean_axis(left_axis, right_axis)

    axes = [forehead_axis["axis"], left_axis["axis"], right_axis["axis"]]
    regional_difference_exists = "dry_side" in axes and "oily_side" in axes
    forehead_oily_cheek_dry = forehead_axis["axis"] == "oily_side" and cheek_mean_axis == "dry_side"

    moisture = predict_moisture_states(rois["left_cheek"], rois["right_cheek"])
    cheek_mean_score = float(moisture["cheek_mean_score"])
    target_cheek_mean = float(row["cheek_mean_moisture"])

    return {
        "image_filename": row["image_filename"],
        "label": row["skin_type"],
        "device_type": row.get("device_type", ""),
        "global_axis": global_axis,
        "global_dry_probability": round(dry_prob, 4),
        "global_oily_probability": round(oily_prob, 4),
        "forehead_axis": forehead_axis["axis"],
        "left_cheek_axis": left_axis["axis"],
        "right_cheek_axis": right_axis["axis"],
        "cheek_mean_axis": cheek_mean_axis,
        "regional_difference_exists": regional_difference_exists,
        "forehead_oily_cheek_dry": forehead_oily_cheek_dry,
        "cheek_mean_score": round(cheek_mean_score, 4),
        "target_cheek_mean_moisture": round(target_cheek_mean, 4),
        "cheek_mean_abs_error": round(abs(cheek_mean_score - target_cheek_mean), 4),
    }


def _safe_rate(numerator: int, denominator: int) -> float | None:
    if denominator == 0:
        return None
    return round(numerator / denominator, 4)


def _safe_average(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 4)


def _safe_rmse(errors: list[float]) -> float | None:
    if not errors:
        return None
    return round(math.sqrt(sum(error * error for error in errors) / len(errors)), 4)


def _safe_correlation(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 2 or len(ys) < 2:
        return None

    mean_x = statistics.fmean(xs)
    mean_y = statistics.fmean(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    denominator_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    denominator = denominator_x * denominator_y
    if denominator == 0:
        return None
    return round(numerator / denominator, 4)


def build_summary(results: list[dict[str, object]]) -> dict[str, object]:
    # 설문 없이도 볼 수 있는 핵심 값만 집계합니다.
    summary = {
        "processed": len(results),
        "global_axis": Counter(),
        "cheek_mean_axis": Counter(),
        "regional_diff_true": 0,
        "forehead_oily_cheek_dry_true": 0,
        "global_vs_binary_correct": 0,
        "global_vs_binary_total": 0,
        "moisture_predictions": [],
        "moisture_targets": [],
        "moisture_abs_errors": [],
    }
    by_label = defaultdict(
        lambda: {
            "count": 0,
            "global_axis": Counter(),
            "cheek_mean_axis": Counter(),
            "regional_diff_true": 0,
            "forehead_oily_cheek_dry": 0,
            "global_vs_binary_correct": 0,
            "global_vs_binary_total": 0,
            "moisture_predictions": [],
            "moisture_targets": [],
            "moisture_abs_errors": [],
        }
    )
    by_device = defaultdict(
        lambda: {
            "count": 0,
            "global_axis": Counter(),
            "regional_diff_true": 0,
            "moisture_abs_errors": [],
        }
    )

    for result in results:
        label = str(result["label"])
        device_type = str(result["device_type"])
        global_axis = str(result["global_axis"])
        cheek_mean_axis = str(result["cheek_mean_axis"])
        regional_diff = bool(result["regional_difference_exists"])
        forehead_oily_cheek_dry = bool(result["forehead_oily_cheek_dry"])
        moisture_prediction = float(result["cheek_mean_score"])
        moisture_target = float(result["target_cheek_mean_moisture"])
        moisture_abs_error = float(result["cheek_mean_abs_error"])

        summary["global_axis"][global_axis] += 1
        summary["cheek_mean_axis"][cheek_mean_axis] += 1
        summary["moisture_predictions"].append(moisture_prediction)
        summary["moisture_targets"].append(moisture_target)
        summary["moisture_abs_errors"].append(moisture_abs_error)
        if regional_diff:
            summary["regional_diff_true"] += 1
        if forehead_oily_cheek_dry:
            summary["forehead_oily_cheek_dry_true"] += 1

        label_item = by_label[label]
        label_item["count"] += 1
        label_item["global_axis"][global_axis] += 1
        label_item["cheek_mean_axis"][cheek_mean_axis] += 1
        label_item["moisture_predictions"].append(moisture_prediction)
        label_item["moisture_targets"].append(moisture_target)
        label_item["moisture_abs_errors"].append(moisture_abs_error)
        if regional_diff:
            label_item["regional_diff_true"] += 1
        if forehead_oily_cheek_dry:
            label_item["forehead_oily_cheek_dry"] += 1

        device_item = by_device[device_type]
        device_item["count"] += 1
        device_item["global_axis"][global_axis] += 1
        device_item["moisture_abs_errors"].append(moisture_abs_error)
        if regional_diff:
            device_item["regional_diff_true"] += 1

        target_axis = BINARY_MAP.get(label)
        if target_axis is not None:
            summary["global_vs_binary_total"] += 1
            label_item["global_vs_binary_total"] += 1
            if global_axis == target_axis:
                summary["global_vs_binary_correct"] += 1
                label_item["global_vs_binary_correct"] += 1

    output = {
        "processed": summary["processed"],
        "global_axis": dict(summary["global_axis"]),
        "cheek_mean_axis": dict(summary["cheek_mean_axis"]),
        "regional_diff_rate": _safe_rate(summary["regional_diff_true"], summary["processed"]),
        "forehead_oily_cheek_dry_rate": _safe_rate(summary["forehead_oily_cheek_dry_true"], summary["processed"]),
        "global_binary_acc": _safe_rate(summary["global_vs_binary_correct"], summary["global_vs_binary_total"]),
        "moisture_mae": _safe_average(summary["moisture_abs_errors"]),
        "moisture_rmse": _safe_rmse(summary["moisture_abs_errors"]),
        "moisture_prediction_mean": _safe_average(summary["moisture_predictions"]),
        "moisture_target_mean": _safe_average(summary["moisture_targets"]),
        "moisture_correlation": _safe_correlation(summary["moisture_predictions"], summary["moisture_targets"]),
        "by_label": {},
        "by_device": {},
    }

    for label in sorted(by_label.keys()):
        item = by_label[label]
        count = item["count"]
        output["by_label"][label] = {
            "name": LABEL_NAME.get(label, label),
            "count": count,
            "global_axis_rate": {k: round(v / count, 4) for k, v in item["global_axis"].items()},
            "cheek_mean_axis_rate": {k: round(v / count, 4) for k, v in item["cheek_mean_axis"].items()},
            "regional_diff_rate": _safe_rate(item["regional_diff_true"], count),
            "forehead_oily_cheek_dry_rate": _safe_rate(item["forehead_oily_cheek_dry"], count),
            "global_binary_acc": _safe_rate(item["global_vs_binary_correct"], item["global_vs_binary_total"]),
            "moisture_mae": _safe_average(item["moisture_abs_errors"]),
            "moisture_rmse": _safe_rmse(item["moisture_abs_errors"]),
            "moisture_prediction_mean": _safe_average(item["moisture_predictions"]),
            "moisture_target_mean": _safe_average(item["moisture_targets"]),
            "moisture_correlation": _safe_correlation(item["moisture_predictions"], item["moisture_targets"]),
        }

    for device_type in sorted(by_device.keys()):
        item = by_device[device_type]
        count = item["count"]
        output["by_device"][device_type] = {
            "count": count,
            "global_axis_rate": {k: round(v / count, 4) for k, v in item["global_axis"].items()},
            "regional_diff_rate": _safe_rate(item["regional_diff_true"], count),
            "moisture_mae": _safe_average(item["moisture_abs_errors"]),
            "moisture_rmse": _safe_rmse(item["moisture_abs_errors"]),
        }

    return output


def main() -> None:
    configure_logging()

    parser = argparse.ArgumentParser(
        description="설문 이전 AI 피부 분석 파이프라인을 원본 이미지 기준으로 전체 검증합니다."
    )
    parser.add_argument(
        "--manifest-path",
        required=True,
        help="검증할 manifest.csv 경로를 명시합니다.",
    )
    parser.add_argument("--limit", type=int, default=0, help="앞에서부터 일부 행만 검증할 때 사용합니다. 0이면 전체를 검증합니다.")
    parser.add_argument("--output-path", default="", help="검증 결과 JSON을 저장할 경로를 명시합니다.")
    parser.add_argument("--log-every", type=int, default=100, help="진행 로그를 몇 건마다 찍을지 설정합니다.")
    args = parser.parse_args()

    manifest_path = Path(args.manifest_path)
    if not manifest_path.exists():
        raise FileNotFoundError(f"manifest 파일을 찾을 수 없습니다: {manifest_path}")

    LOGGER.info("설문 전 AI 파이프라인 검증 시작")
    LOGGER.info("manifest=%s", manifest_path)
    LOGGER.info("limit=%s", args.limit if args.limit > 0 else "ALL")
    LOGGER.info("output=%s", args.output_path if args.output_path else "(저장 안 함)")
    LOGGER.info("검증 범위=원본 이미지 -> ROI 추출 -> global/regional/moisture")

    rows = load_rows(manifest_path, args.limit)
    total_rows = len(rows)
    LOGGER.info("검증 대상 행 수=%s", total_rows)

    results = []
    failures = []
    started_at = time.perf_counter()
    for idx, row in enumerate(rows, start=1):
        try:
            results.append(summarize_row(row))
        except Exception as exc:
            failures.append(
                {
                    "index": idx,
                    "image_filename": row.get("image_filename", ""),
                    "error": str(exc),
                }
            )
            LOGGER.warning(
                "검증 실패 index=%s image=%s error=%s",
                idx,
                row.get("image_filename", ""),
                exc,
            )
            continue

        if idx % args.log_every == 0 or idx == total_rows:
            elapsed = time.perf_counter() - started_at
            LOGGER.info(
                "processed=%s/%s success=%s failures=%s elapsed=%.2fs last_image=%s",
                idx,
                total_rows,
                len(results),
                len(failures),
                elapsed,
                row.get("image_filename", ""),
            )

    summary = build_summary(results)
    summary["requested"] = total_rows
    summary["success"] = len(results)
    summary["failures"] = len(failures)
    summary["notes"] = [
        "이 결과는 설문 전 단계 기준으로 ROI 추출과 AI 추론 경향을 검증합니다.",
        "수분 값은 low/high 등급이 아니라 cheek_mean_score 회귀값과 정답 점수의 오차로 확인합니다.",
    ]
    if failures:
        # 로그를 못 보는 환경에서도 실패 원인을 빠르게 확인할 수 있게 일부만 남깁니다.
        summary["failure_examples"] = failures[:20]

    LOGGER.info(
        "검증 완료 requested=%s success=%s failures=%s elapsed=%.2fs",
        total_rows,
        len(results),
        len(failures),
        time.perf_counter() - started_at,
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.output_path:
        output_path = Path(args.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        LOGGER.info("결과 저장 완료 path=%s", output_path)


if __name__ == "__main__":
    main()
