from __future__ import annotations

import argparse
import asyncio
import importlib
import json
import statistics
import sys
import time
from pathlib import Path

import httpx


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REQUESTS_FILE = ROOT / "tmp" / "chatbot_realistic_requests_50.json"
DEFAULT_OUTPUT_JSON = ROOT / "tmp" / "chatbot_request_suite_results.json"
DEFAULT_OUTPUT_MD = ROOT / "tmp" / "chatbot_request_suite_results.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the chatbot request suite and save a report")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Chatbot API base URL")
    parser.add_argument(
        "--transport",
        choices=("http", "asgi"),
        default="http",
        help="Use a live HTTP server or call the local ASGI app directly",
    )
    parser.add_argument("--requests-file", default=str(DEFAULT_REQUESTS_FILE), help="UTF-8 JSON array of chatbot requests")
    parser.add_argument("--output-json", default=str(DEFAULT_OUTPUT_JSON), help="Where to save the raw JSON results")
    parser.add_argument("--output-md", default=str(DEFAULT_OUTPUT_MD), help="Where to save the Markdown report")
    parser.add_argument("--timeout-sec", type=int, default=60, help="Per-request timeout in seconds")
    parser.add_argument(
        "--group-mode",
        choices=("auto", "edge-only"),
        default="auto",
        help="How to assign question groups for the report",
    )
    return parser.parse_args()


def question_group(index: int, group_mode: str) -> str:
    if group_mode == "edge-only":
        return "edge"
    if 1 <= index <= 17:
        return "ambiguous"
    if 18 <= index <= 30:
        return "conditions"
    if 31 <= index <= 50:
        return "category"
    return "edge"


def resolved_group(index: int, group_mode: str, meta: dict) -> str:
    if meta.get("group"):
        return str(meta["group"])
    return question_group(index, group_mode)


def summarize_latencies(latencies: list[int]) -> dict[str, float | int]:
    if not latencies:
        return {"count": 0, "avg_ms": 0, "min_ms": 0, "max_ms": 0, "p95_ms": 0}

    sorted_latencies = sorted(latencies)
    p95_index = max(0, min(len(sorted_latencies) - 1, int(len(sorted_latencies) * 0.95) - 1))
    return {
        "count": len(sorted_latencies),
        "avg_ms": round(statistics.mean(sorted_latencies), 1),
        "min_ms": sorted_latencies[0],
        "max_ms": sorted_latencies[-1],
        "p95_ms": sorted_latencies[p95_index],
    }


def _load_local_app():
    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    module = importlib.import_module("main")
    return module.app


async def _run_requests_async(args: argparse.Namespace, requests: list[dict]) -> list[dict]:
    results: list[dict] = []

    if args.transport == "asgi":
        app = _load_local_app()
        transport = httpx.ASGITransport(app=app)
        client = httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=args.timeout_sec)
    else:
        client = httpx.AsyncClient(base_url=args.base_url, timeout=args.timeout_sec)

    async with client:
        for index, payload in enumerate(requests, start=1):
            meta = payload.get("_meta", {}) if isinstance(payload, dict) else {}
            request_payload = {
                key: value for key, value in payload.items() if key != "_meta"
            }
            started_at = time.perf_counter()
            try:
                response = await client.post("/chat/query", json=request_payload)
                elapsed_ms = round((time.perf_counter() - started_at) * 1000)
                response.raise_for_status()
                body = response.json()
                top1 = body["products"][0] if body.get("products") else None
                results.append(
                    {
                        "index": index,
                        "group": resolved_group(index, args.group_mode, meta),
                        "persona": meta.get("persona"),
                        "personaLabel": meta.get("personaLabel"),
                        "message": payload["message"],
                        "status": response.status_code,
                        "ok": True,
                        "latency_ms": elapsed_ms,
                        "responseType": body.get("responseType"),
                        "product_count": len(body.get("products", [])),
                        "top1": top1,
                        "answer_preview": (body.get("answer") or "")[:200],
                    }
                )
            except Exception as exc:
                elapsed_ms = round((time.perf_counter() - started_at) * 1000)
                results.append(
                    {
                        "index": index,
                        "group": resolved_group(index, args.group_mode, meta),
                        "persona": meta.get("persona"),
                        "personaLabel": meta.get("personaLabel"),
                        "message": payload["message"],
                        "status": getattr(getattr(exc, "response", None), "status_code", None),
                        "ok": False,
                        "latency_ms": elapsed_ms,
                        "responseType": None,
                        "product_count": 0,
                        "top1": None,
                        "answer_preview": "",
                        "error": str(exc),
                    }
                )

    return results


def main() -> None:
    args = parse_args()
    requests_path = Path(args.requests_file)
    output_json_path = Path(args.output_json)
    output_md_path = Path(args.output_md)

    requests = json.loads(requests_path.read_text(encoding="utf-8-sig"))
    results = asyncio.run(_run_requests_async(args, requests))

    successful = [item for item in results if item["ok"]]
    latencies = [item["latency_ms"] for item in successful]

    observed_groups = []
    for item in results:
        if item["group"] not in observed_groups:
            observed_groups.append(item["group"])

    summary = {
        "total": len(results),
        "success": len(successful),
        "failures": len(results) - len(successful),
        "latency": summarize_latencies(latencies),
        "by_group": {},
    }

    for group in observed_groups:
        group_items = [item for item in results if item["group"] == group and item["ok"]]
        summary["by_group"][group] = {
            "success": len(group_items),
            "failures": len([item for item in results if item["group"] == group and not item["ok"]]),
            "latency": summarize_latencies([item["latency_ms"] for item in group_items]),
        }

    output_json_path.write_text(
        json.dumps({"summary": summary, "results": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    lines: list[str] = []
    lines.append("# Chatbot Request Suite Results")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Total: {summary['total']}")
    lines.append(f"- Success: {summary['success']}")
    lines.append(f"- Failures: {summary['failures']}")
    lines.append(f"- Avg latency: {summary['latency']['avg_ms']} ms")
    lines.append(f"- P95 latency: {summary['latency']['p95_ms']} ms")
    lines.append(f"- Min latency: {summary['latency']['min_ms']} ms")
    lines.append(f"- Max latency: {summary['latency']['max_ms']} ms")
    lines.append("")
    lines.append("## By Group")
    lines.append("")
    for group, group_summary in summary["by_group"].items():
        lines.append(f"### {group}")
        lines.append(f"- Success: {group_summary['success']}")
        lines.append(f"- Failures: {group_summary['failures']}")
        latency = group_summary["latency"]
        lines.append(f"- Avg latency: {latency['avg_ms']} ms")
        lines.append(f"- P95 latency: {latency['p95_ms']} ms")
        lines.append("")

    lines.append("## Detailed Results")
    lines.append("")
    lines.append("| No | Group | ResponseType | Persona | OK | Latency(ms) | Question | Top1 | Top1 Reason |")
    lines.append("| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |")
    for item in results:
        top1_name = item["top1"]["name"] if item["top1"] else "-"
        top1_reason = item["top1"]["reason"] if item["top1"] else item.get("error", "-")
        question = item["message"].replace("|", "/")
        top1_name = str(top1_name).replace("|", "/")
        top1_reason = str(top1_reason).replace("|", "/")
        persona_label = str(item.get("personaLabel") or "-").replace("|", "/")
        response_type = str(item.get("responseType") or "-").replace("|", "/")
        lines.append(
            f"| {item['index']} | {item['group']} | {response_type} | {persona_label} | {'Y' if item['ok'] else 'N'} | "
            f"{item['latency_ms']} | {question} | {top1_name} | {top1_reason} |"
        )

    output_md_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"Saved JSON report to {output_json_path}")
    print(f"Saved Markdown report to {output_md_path}")


if __name__ == "__main__":
    main()
