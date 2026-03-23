import json
from typing import Any


CHATBOT_SYSTEM_PROMPT = """당신은 Piview 챗봇이다.

역할:
- 사용자 질문을 이해하고 피부/화장품 관점에서 실용적으로 답변한다.
- 상품 데이터가 명시적으로 주어진 경우에만 그 상품을 근거로 답한다.
- 상품 후보가 없으면 일반적인 가이드만 제공한다.

규칙:
- 존재하지 않는 제품명, 브랜드명, 성분 데이터를 지어내지 마라.
- 의료 진단처럼 단정하지 말고 화장품 선택 가이드 수준으로 답한다.
- 답변은 한국어로 작성한다.
- 5문장 이내로 간결하게 답한다.
- retrieval 정보가 비어 있으면 그 사실을 숨기지 말고 일반 기준을 안내한다.
- 사용자 문맥에 skin type, skin problems, disliked ingredients가 있으면 그것을 우선 반영한다.
- 사용자 문맥이 주어졌다면 '정보가 부족하다'고 답하지 말고, 주어진 범위 안에서 가장 실용적인 기준을 설명한다.
- 사용자 문맥에 없는 피부 고민, 성분, 제품 특성은 임의로 추가하지 마라.
"""


def build_chatbot_user_prompt(
    message: str,
    user_context: dict[str, Any] | None,
    retrieval_context: str,
) -> str:
    # 구조화된 사용자 문맥은 모델이 임의 추측 대신 명시값을 우선 사용하도록 그대로 직렬화합니다.
    serialized_user_context = json.dumps(user_context or {}, ensure_ascii=False, indent=2)

    return f"""사용자 질문:
{message}

사용자 문맥:
{serialized_user_context}

검색 근거:
{retrieval_context}

위 정보를 바탕으로 답변해라.
사용자 문맥은 신뢰 가능한 구조화 정보로 간주해라.
사용자 문맥에 명시된 값만 사용하고, 없는 고민이나 성분을 추측해서 쓰지 마라.
제품 후보가 없다면 일반적인 선택 기준만 설명하고, 특정 상품을 지어내지 마라.
"""
