from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_REQUESTS = ROOT / "tmp" / "chatbot_realistic_requests_50.json"
DEFAULT_PERSONAS = ROOT / "tmp" / "chatbot_personas_6.json"
DEFAULT_OUTPUT = ROOT / "tmp" / "chatbot_persona_requests_360.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Expand base chatbot requests with persona contexts")
    parser.add_argument("--base-requests", default=str(DEFAULT_BASE_REQUESTS))
    parser.add_argument("--personas", default=str(DEFAULT_PERSONAS))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    base_requests = json.loads(Path(args.base_requests).read_text(encoding="utf-8"))
    personas = json.loads(Path(args.personas).read_text(encoding="utf-8"))

    expanded_requests: list[dict] = []
    for persona in personas:
        user_context = copy.deepcopy(persona["userContext"])
        for index, request in enumerate(base_requests, start=1):
            item = copy.deepcopy(request)
            item["userContext"] = copy.deepcopy(user_context)
            item["_meta"] = {
                "baseIndex": index,
                "persona": persona["id"],
                "personaLabel": persona["label"],
            }
            expanded_requests.append(item)

    Path(args.output).write_text(
        json.dumps(expanded_requests, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(expanded_requests)} requests to {args.output}")


if __name__ == "__main__":
    main()
