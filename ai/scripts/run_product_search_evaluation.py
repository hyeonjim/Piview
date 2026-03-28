"""상품 검색 대규모 질의셋 평가 스크립트."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
import json
import os
from pathlib import Path
import statistics
import subprocess
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.chatbot.search.product_data import ProductSearchDataRow, product_search_data_repository
from services.chatbot.search.query_normalizer import normalize_text
from services.product_search.evaluation import (
    ProductSearchEvaluationCase,
    build_product_search_evaluation_cases,
)
from services.product_search.evaluation.queryset import write_product_search_evaluation_dataset


ROOT_DIR = Path(__file__).resolve().parents[2]
AI_DIR = ROOT_DIR / "ai"
DATASET_PATH = ROOT_DIR / "docs" / "search" / "PRODUCT_SEARCH_EVAL_DATASET.jsonl"
REPORT_PATH = ROOT_DIR / "docs" / "search" / "PRODUCT_SEARCH_EVAL_REPORT.md"
REPORT_JSON_PATH = ROOT_DIR / "docs" / "search" / "PRODUCT_SEARCH_EVAL_REPORT.json"
DEFAULT_BASE_URL = "http://127.0.0.1:8000"


@dataclass
class QueryRunResult:
    case: ProductSearchEvaluationCase
    status_code: int
    latency_ms: float
    query_bucket: str | None
    result_ids: list[int]
    error: str | None = None


def main() -> int:
    server_process: subprocess.Popen[str] | None = None
    dataset_count = write_product_search_evaluation_dataset(DATASET_PATH)

    try:
        server_process = _start_server()
        _wait_for_server(DEFAULT_BASE_URL)
        cases = build_product_search_evaluation_cases()
        results = [_run_case(DEFAULT_BASE_URL, case) for case in cases]
        rows_by_id = _fetch_rows_by_id(results)
        report = _build_report(results, rows_by_id, dataset_count)
        REPORT_JSON_PATH.write_text(
            json.dumps(report, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        REPORT_PATH.write_text(_render_markdown_report(report), encoding="utf-8")
        print(
            json.dumps(
                {
                    "datasetPath": str(DATASET_PATH),
                    "reportPath": str(REPORT_PATH),
                    "reportJsonPath": str(REPORT_JSON_PATH),
                    "caseCount": report["summary"]["caseCount"],
                    "bucketAccuracy": report["summary"]["bucketAccuracy"],
                    "weakTop1Accuracy": report["summary"]["weakTop1Accuracy"],
                    "weakTop10Accuracy": report["summary"]["weakTop10Accuracy"],
                    "overallPassRate": report["summary"]["overallPassRate"],
                    "zeroResultRate": report["summary"]["zeroResultRate"],
                    "negativePrecisionAt10": report["summary"]["negativePrecisionAt10"],
                    "meanLatencyMs": report["summary"]["meanLatencyMs"],
                    "p95LatencyMs": report["summary"]["p95LatencyMs"],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0
    finally:
        if server_process is not None:
            server_process.terminate()
            try:
                server_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server_process.kill()


def _start_server() -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    python_path = AI_DIR / ".venv" / "Scripts" / "python.exe"
    return subprocess.Popen(
        [
            str(python_path),
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ],
        cwd=str(AI_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        text=True,
    )


def _wait_for_server(base_url: str, timeout_seconds: int = 30) -> None:
    started_at = time.perf_counter()
    last_error: str | None = None
    while time.perf_counter() - started_at < timeout_seconds:
        try:
            with urlopen(f"{base_url}/products/dictionaries", timeout=3) as response:
                if response.status == 200:
                    return
        except (URLError, HTTPError) as exc:
            last_error = str(exc)
            time.sleep(0.5)
    raise RuntimeError(f"상품 검색 서버 준비 실패: {last_error or 'unknown error'}")


def _run_case(base_url: str, case: ProductSearchEvaluationCase) -> QueryRunResult:
    query_string = urlencode({"q": case.query, "candidateLimit": 10})
    started_at = time.perf_counter()
    try:
        with urlopen(f"{base_url}/products/search?{query_string}", timeout=30) as response:
            payload = json.load(response)
        latency_ms = (time.perf_counter() - started_at) * 1000.0
        result_ids = [
            int(item["productId"])
            for item in payload.get("results", [])
            if item.get("productId") is not None
        ]
        return QueryRunResult(
            case=case,
            status_code=200,
            latency_ms=latency_ms,
            query_bucket=payload.get("queryBucket"),
            result_ids=result_ids,
        )
    except (URLError, HTTPError) as exc:
        latency_ms = (time.perf_counter() - started_at) * 1000.0
        status_code = getattr(exc, "code", 599)
        return QueryRunResult(
            case=case,
            status_code=int(status_code),
            latency_ms=latency_ms,
            query_bucket=None,
            result_ids=[],
            error=str(exc),
        )


def _fetch_rows_by_id(results: list[QueryRunResult]) -> dict[int, ProductSearchDataRow]:
    product_ids = sorted(
        {
            product_id
            for result in results
            for product_id in result.result_ids
        }
    )
    rows = product_search_data_repository.fetch_products_for_indexing(product_ids=product_ids)
    return {row.product_id: row for row in rows}


def _build_report(
    results: list[QueryRunResult],
    rows_by_id: dict[int, ProductSearchDataRow],
    dataset_count: int,
) -> dict[str, Any]:
    evaluated_cases: list[dict[str, Any]] = []
    bucket_stats: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for result in results:
        rows = [rows_by_id[product_id] for product_id in result.result_ids if product_id in rows_by_id]
        evaluated = _evaluate_case(result, rows)
        evaluated_cases.append(evaluated)
        bucket_stats[result.case.dataset_bucket].append(evaluated)

    latencies = [item["latencyMs"] for item in evaluated_cases]
    negative_precisions = [
        item["negativePrecisionAt10"]
        for item in evaluated_cases
        if item["negativePrecisionAt10"] is not None
    ]
    report = {
        "generatedAt": datetime.now(UTC).isoformat(),
        "datasetPath": str(DATASET_PATH),
        "datasetCount": dataset_count,
        "summary": {
            "caseCount": len(evaluated_cases),
            "bucketAccuracy": round(_ratio(sum(1 for item in evaluated_cases if item["bucketMatch"]), len(evaluated_cases)), 4),
            "weakTop1Accuracy": round(_ratio(sum(1 for item in evaluated_cases if item["weakTop1Pass"]), len(evaluated_cases)), 4),
            "weakTop10Accuracy": round(_ratio(sum(1 for item in evaluated_cases if item["weakTop10Pass"]), len(evaluated_cases)), 4),
            "overallPassRate": round(_ratio(sum(1 for item in evaluated_cases if item["overallPass"]), len(evaluated_cases)), 4),
            "zeroResultRate": round(_ratio(sum(1 for item in evaluated_cases if item["resultCount"] == 0), len(evaluated_cases)), 4),
            "negativePrecisionAt10": round(statistics.mean(negative_precisions), 4) if negative_precisions else None,
            "meanLatencyMs": round(statistics.mean(latencies), 2),
            "p50LatencyMs": round(statistics.median(latencies), 2),
            "p95LatencyMs": round(_percentile(latencies, 95), 2),
            "maxLatencyMs": round(max(latencies), 2),
        },
        "bucketSummary": {
            bucket: _summarize_bucket(items)
            for bucket, items in sorted(bucket_stats.items())
        },
        "slowestCases": sorted(evaluated_cases, key=lambda item: item["latencyMs"], reverse=True)[:20],
        "failedCases": [item for item in evaluated_cases if not item["overallPass"]][:80],
    }
    return report


def _evaluate_case(result: QueryRunResult, rows: list[ProductSearchDataRow]) -> dict[str, Any]:
    top1 = rows[0] if rows else None
    return {
        "caseId": result.case.case_id,
        "datasetBucket": result.case.dataset_bucket,
        "expectedQueryBucket": result.case.expected_query_bucket,
        "responseQueryBucket": result.query_bucket,
        "query": result.case.query,
        "statusCode": result.status_code,
        "latencyMs": round(result.latency_ms, 2),
        "resultCount": len(result.result_ids),
        "bucketMatch": result.query_bucket == result.case.expected_query_bucket,
        "weakTop1Pass": _row_matches_case(top1, result.case) if top1 else False,
        "weakTop10Pass": any(_row_matches_case(row, result.case) for row in rows),
        "negativePrecisionAt10": _negative_precision_at_10(rows, result.case),
        "overallPass": result.status_code == 200 and result.query_bucket == result.case.expected_query_bucket and any(_row_matches_case(row, result.case) for row in rows),
        "top1": _serialize_row(top1),
        "error": result.error,
    }


def _row_matches_case(row: ProductSearchDataRow | None, case: ProductSearchEvaluationCase) -> bool:
    if row is None:
        return False

    searchable_text = _searchable_text(row)
    brand_match = not case.expected_brands or normalize_text(row.brand_name) in {normalize_text(brand) for brand in case.expected_brands}
    category_match = not case.expected_category_terms or _matches_terms(searchable_text, case.expected_category_terms)
    ingredient_match = not case.expected_ingredient_terms or _matches_ingredient_terms(row, case.expected_ingredient_terms)
    negative_match = not case.negative_ingredient_terms or _lacks_ingredient_terms(row, case.negative_ingredient_terms)
    name_match = not case.expected_name_terms or _matches_terms(normalize_text(row.name), case.expected_name_terms)
    detail_match = not case.detail_terms or _matches_terms(searchable_text, case.detail_terms)

    if case.expected_query_bucket == "brand_only":
        return brand_match
    if case.expected_query_bucket == "category_only":
        return category_match
    if case.expected_query_bucket == "brand_category":
        return brand_match and category_match
    if case.expected_query_bucket == "multi_brand_category":
        return brand_match and category_match
    if case.expected_query_bucket == "ingredient_only":
        return ingredient_match or name_match
    if case.expected_query_bucket == "ingredient_category":
        return ingredient_match and category_match
    if case.expected_query_bucket == "negative_ingredient":
        return category_match and negative_match and (ingredient_match if case.expected_ingredient_terms else True)
    if case.expected_query_bucket == "ambiguous_keyword":
        return name_match or detail_match
    if case.expected_query_bucket == "long_query":
        return brand_match and category_match and (detail_match or ingredient_match or name_match)
    if case.expected_query_bucket == "mixed_structured":
        return (brand_match or ingredient_match) and (category_match or detail_match or name_match)
    return False


def _matches_terms(text: str, terms: tuple[str, ...]) -> bool:
    normalized_text = normalize_text(text)
    return any(normalize_text(term) in normalized_text for term in terms if normalize_text(term))


def _matches_ingredient_terms(row: ProductSearchDataRow, terms: tuple[str, ...]) -> bool:
    ingredient_text = normalize_text(" ".join(part for part in (row.ingredient_text_ko, row.ingredient_text_en, row.name) if part))
    return any(normalize_text(term) in ingredient_text for term in terms if normalize_text(term))


def _lacks_ingredient_terms(row: ProductSearchDataRow, terms: tuple[str, ...]) -> bool:
    ingredient_text = normalize_text(" ".join(part for part in (row.ingredient_text_ko, row.ingredient_text_en) if part))
    return not any(normalize_text(term) in ingredient_text for term in terms if normalize_text(term))


def _negative_precision_at_10(rows: list[ProductSearchDataRow], case: ProductSearchEvaluationCase) -> float | None:
    if not case.negative_ingredient_terms or not rows:
        return None
    safe_count = sum(1 for row in rows[:10] if _lacks_ingredient_terms(row, case.negative_ingredient_terms))
    return round(safe_count / max(1, len(rows[:10])), 4)


def _searchable_text(row: ProductSearchDataRow) -> str:
    return normalize_text(
        " ".join(
            part
            for part in (
                row.name,
                row.brand_name,
                row.category_name,
                row.description,
                " ".join(row.concern_names),
                row.ingredient_text_ko,
                row.ingredient_text_en,
            )
            if part
        )
    )


def _serialize_row(row: ProductSearchDataRow | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "productId": row.product_id,
        "name": row.name,
        "brandName": row.brand_name,
        "categoryName": row.category_name,
    }


def _summarize_bucket(items: list[dict[str, Any]]) -> dict[str, Any]:
    latencies = [item["latencyMs"] for item in items]
    negative_precisions = [item["negativePrecisionAt10"] for item in items if item["negativePrecisionAt10"] is not None]
    return {
        "caseCount": len(items),
        "bucketAccuracy": round(_ratio(sum(1 for item in items if item["bucketMatch"]), len(items)), 4),
        "weakTop1Accuracy": round(_ratio(sum(1 for item in items if item["weakTop1Pass"]), len(items)), 4),
        "weakTop10Accuracy": round(_ratio(sum(1 for item in items if item["weakTop10Pass"]), len(items)), 4),
        "overallPassRate": round(_ratio(sum(1 for item in items if item["overallPass"]), len(items)), 4),
        "zeroResultRate": round(_ratio(sum(1 for item in items if item["resultCount"] == 0), len(items)), 4),
        "meanLatencyMs": round(statistics.mean(latencies), 2),
        "p95LatencyMs": round(_percentile(latencies, 95), 2),
        "negativePrecisionAt10": round(statistics.mean(negative_precisions), 4) if negative_precisions else None,
    }


def _ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return numerator / denominator


def _percentile(values: list[float], percentile: int) -> float:
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round((percentile / 100) * (len(ordered) - 1)))))
    return ordered[index]


def _render_markdown_report(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# 상품 검색 평가 리포트",
        "",
        f"- 생성 시각: `{report['generatedAt']}`",
        f"- 질의 수: `{summary['caseCount']}`",
        f"- 버킷 정확도: `{summary['bucketAccuracy']}`",
        f"- Top-1 약한 정확도: `{summary['weakTop1Accuracy']}`",
        f"- Top-10 약한 정확도: `{summary['weakTop10Accuracy']}`",
        f"- overall pass: `{summary['overallPassRate']}`",
        f"- zero-result rate: `{summary['zeroResultRate']}`",
        f"- negative precision@10: `{summary['negativePrecisionAt10']}`",
        f"- mean latency(ms): `{summary['meanLatencyMs']}`",
        f"- p50 latency(ms): `{summary['p50LatencyMs']}`",
        f"- p95 latency(ms): `{summary['p95LatencyMs']}`",
        f"- max latency(ms): `{summary['maxLatencyMs']}`",
        "",
        "## 버킷별 요약",
        "",
        "| bucket | caseCount | bucketAcc | top1Acc | top10Acc | overallPass | zeroResult | meanMs | p95Ms | negPrecision |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for bucket, item in report["bucketSummary"].items():
        lines.append(
            f"| {bucket} | {item['caseCount']} | {item['bucketAccuracy']} | {item['weakTop1Accuracy']} | "
            f"{item['weakTop10Accuracy']} | {item['overallPassRate']} | {item['zeroResultRate']} | "
            f"{item['meanLatencyMs']} | {item['p95LatencyMs']} | {item['negativePrecisionAt10']} |"
        )
    lines.extend(["", "## 실패 사례 일부", ""])
    for item in report["failedCases"][:25]:
        top1 = item["top1"]["name"] if item["top1"] else "-"
        lines.append(
            f"- [{item['datasetBucket']}] `{item['query']}` "
            f"(expected=`{item['expectedQueryBucket']}`, actual=`{item['responseQueryBucket']}`, top1=`{top1}`)"
        )
    lines.extend(
        [
            "",
            "## 주의",
            "",
            "- 이 리포트의 정확도는 정답 상품 ID 라벨이 아니라 브랜드/카테고리/성분/부정 조건 기반의 약한 정답입니다.",
            "- 최종 relevance 평가는 별도 라벨셋과 수동 검수가 필요합니다.",
            "",
        ]
    )
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
