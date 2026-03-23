import argparse
import json

import httpx


def main():
    parser = argparse.ArgumentParser(description="Local smoke test for chatbot API")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--message", default="민감성 피부인데 토너를 고를 때 뭘 보면 좋을까?")
    args = parser.parse_args()

    payload = {
        "message": args.message,
        "userContext": {
            "mySkinType": "subuji",
            "skinProblems": ["수분", "진정"],
            "dislikedIngredientNames": ["향료"],
        },
        "context": {
            "screen": "search",
        },
    }

    # smoke test는 retrieval 없이도 HTTP 계약과 모델 호출 경로가 살아 있는지 빠르게 확인하기 위한 용도입니다.
    response = httpx.post(f"{args.base_url.rstrip('/')}/chat/query", json=payload, timeout=30.0)
    response.raise_for_status()
    print(json.dumps(response.json(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
