# AI Module Guide

이 문서는 `ai/` 디렉터리의 구성과 각 모듈의 역할을 정리한 가이드다.
폴더 구조와 책임 범위를 이해하기 위한 기준 문서로 사용하며, 세부 동작과 최신 상태는 실제 코드를 기준으로 판단한다.

## Runtime

- 앱 시작점: `main.py`
- 등록 라우터:
  - `/skin`
  - `/ocr`
  - `/chat`
  - `/health`

## Route Overview

```text
api/routers/
  skin_type.py  --- 얼굴 이미지 기반 피부 상태 추출 API
  ocr.py        --- 성분표 OCR 추출 + GMS 정제 API
  chatbot.py    --- 챗봇 질의응답 API
```

## Directory Overview

```text
ai/
  api/              --- FastAPI 라우터와 HTTP 진입점
    routers/        --- 도메인별 API 엔드포인트

  core/             --- 환경설정, 공통 런타임 유틸

  decision/         --- 피부 상태값을 해석하거나 판단하는 로직

  inference/        --- 모델 추론 실행 계층

  models/           --- 모델 파일 또는 모델 리소스

  preprocessing/    --- 이미지/데이터 전처리

  prompts/          --- LLM 프롬프트 정의

  schemas/          --- 요청/응답 스키마

  scripts/          --- 수동 실행용 스크립트와 운영 보조 스크립트

  services/         --- 실제 도메인 서비스 로직
```

## Chatbot Structure

현재 챗봇 코드는 `services/chatbot/` 아래를 기준으로 나뉜다.

```text
services/chatbot/
  domain/           --- API DTO와 분리된 내부 요청/응답 모델 + mapper

  generation/       --- 최종 답변 생성 계층
    service.py      --- 챗봇 응답 전체 오케스트레이션
    llm.py          --- LLM 호출
    templates.py    --- 템플릿 답변 생성
    postprocess.py  --- 답변 후처리
    helpers.py      --- generation 공통 헬퍼

  providers/        --- 외부 LLM/임베딩 provider 어댑터
    base.py         --- chat / embedding protocol
    gms.py          --- GMS provider 구현

  retrieval/        --- 검색과 랭킹 중심 계층
    service.py      --- retrieval 전체 오케스트레이션
    models.py       --- retrieval 중간 산출물 모델
    workflow/       --- planner / executor / assembler 파이프라인

    builders/       --- 검색 입력값/응답 출력값 조립
      request.py    --- search query, excluded ids, applied filters 조립
      response.py   --- product candidate, citation, retrieval context 조립

    parsers/        --- 질문 해석
      category.py   --- 카테고리 의도 추출
      concerns.py   --- 피부 고민/회피 성분 추출
      intent.py     --- clarifying 여부, generic query 여부 판별

    constants/      --- 파싱/랭킹에 쓰는 상수와 패턴
      category.py   --- 카테고리 alias, 문장 marker
      filters.py    --- 회피 성분 alias, strict filter 패턴
      heuristics.py --- 휴리스틱용 키워드 묶음
      intent.py     --- 질문 의도 판별용 키워드 묶음

    scoring/        --- 검색 결과 점수 계산
      category.py   --- 카테고리 우선순위/보정
      filters.py    --- 회피 성분/strict filter 패널티
      fusion.py     --- vector + keyword 결과 최종 융합

      heuristics/   --- 휴리스틱 보정 규칙
        gap.py      --- 루틴 공백/부족 단계 관련 보정
        penalties.py--- 문맥 불일치, 무거운 제형 등 패널티
        query.py    --- 일반 탐색형 질문 관련 보정

  search/           --- 검색 하위 계층
    product_data.py --- MySQL 상품 메타데이터 공통 로더 / keyword·indexing 공용 데이터 소스

    embedding/      --- 임베딩 생성
      client.py     --- embedding provider 래퍼
      function.py   --- 벡터 저장소용 embedding function 어댑터

    vector/         --- 벡터 검색
      service.py    --- 벡터 검색 서비스 진입점
      store.py      --- Chroma client/collection 관리
      mapper.py     --- raw query 결과를 내부 모델로 변환
      models.py     --- 벡터 검색용 데이터 모델

    keyword/        --- 키워드 검색
      service.py    --- 키워드 검색 서비스 진입점
      repository.py --- 후보 상품 조회
      scorer.py     --- 키워드 점수 계산
      tokenizer.py  --- 질의 토큰 추출
      models.py     --- 키워드 검색용 데이터 모델

  session/          --- 세션 저장 계층
    service.py      --- session store 오케스트레이션
    backends.py     --- memory / redis backend
    serialization.py--- snapshot / payload 직렬화
    models.py       --- session snapshot / stored session 모델

  eval/             --- retrieval/citation 수동 평가 유틸
    metrics.py      --- precision/recall/MRR/citation coverage 계산

scripts/
  reindex_chatbot.py  --- MySQL 상품 데이터를 다시 읽어 Chroma 인덱스를 재생성
  evaluate_chatbot.py --- 저장된 수동 케이스 JSON을 deterministic metric으로 평가
```

## Chatbot Features

현재 챗봇은 "자유 대화형 LLM"보다는 "상품 탐색 보조형 챗봇"에 가깝다.
핵심 기능은 아래와 같다.

- 사용자 질문을 받아 상품 추천형 응답 또는 일반 가이드 응답을 만든다.
- `userContext`가 있으면 피부타입, 피부 고민, 비선호 성분, 보유 상품 정보를 검색과 답변에 반영한다.
- `sessionId`가 있으면 직전 질문/답변/추천 상품을 짧게 이어받아 follow-up 질문 품질을 높인다.
- 질문이 너무 넓으면 바로 추천하지 않고 되묻는 `clarifying_question` 응답으로 보낸다.
- 검색 결과가 있으면 상품 카드용 후보 목록과 간단한 추천 멘트를 같이 만든다.
- 검색 결과가 약하거나 없으면 특정 상품을 지어내지 않고 일반적인 선택 기준만 안내한다.
- 벡터 검색과 키워드 검색을 함께 쓰고, source score를 합친 뒤 도메인 룰을 한 번만 적용해 최종 순위를 다시 조정한다.
- 향료, 알코올, 에센셜오일 같은 회피 조건은 "완전 검증"이 아니라 랭킹 보정 신호로 사용한다.
- citation에는 기존 productId/text 외에 snippet, source, score, metadata가 붙을 수 있다.

## Chatbot End-to-End Flow

챗봇 요청은 대략 아래 순서로 처리된다.

```text
1. router가 요청을 받는다.
2. router가 API DTO를 내부 domain request로 변환한다.
3. generation/service.py가 sessionId를 만들거나 기존 세션을 읽는다.
4. retrieval/workflow/planner.py가 질문을 검색용 query와 filter plan으로 정리한다.
5. retrieval/workflow/executor.py가 vector 검색과 keyword 검색을 병렬로 실행한다.
6. scoring/fusion.py가 설정값 기반 source weight와 휴리스틱을 합쳐 최종 순위를 계산한다.
7. retrieval/workflow/assembler.py가 product candidates, citations, retrieval_context를 조립한다.
8. generation/llm.py가 provider를 통해 LLM에 최종 답변 생성을 요청한다.
9. LLM이 실패하면 generation/templates.py의 템플릿 답변으로 fallback 한다.
10. 최종 answer와 추천 상품 ID를 세션 backend에 저장한다.
11. router가 내부 domain response를 API 응답 스키마로 다시 변환한다.
```

## Chatbot Inputs Used Internally

챗봇은 요청의 모든 값을 동일하게 쓰지 않는다.
실제로 내부 로직에서 의미 있게 보는 값은 아래 정도다.

- 사용자 질문 본문
- `sessionId`
- 화면 문맥 `screen`, `currentProductId`
- `userId`
- 피부타입 힌트
- 피부 고민 목록
- 보유 상품 ID 목록
- 비선호 성분 목록
- 비선호 상품 ID 목록

이 값들은 크게 세 군데에서 쓰인다.

- retrieval query 조립
- 응답 문맥 보강
- 세션 메모리 저장/복원

## Chatbot Response Types

- `product_recommendation`
  - 검색 후보가 있고, 상품 추천형 응답이 가능한 경우
- `clarifying_question`
  - 질문이 너무 넓거나 의도가 모호해서 한 번 더 좁혀야 하는 경우
- `informational`
  - 검색 후보가 약하거나 없어도 일반 가이드는 줄 수 있는 경우
- `fallback`
  - 생성 단계 실패 등으로 템플릿 기반 안전 응답으로 내려간 경우

## Chatbot Session Behavior

현재 세션은 "전체 대화 로그 저장"이 아니라 "짧은 follow-up 보조 메모리"에 가깝다.

- 기본 저장 단위는 `sessionId`
- 저장 내용은 최근 사용자 질문, 최근 답변, 최근 추천 상품 ID, 화면 문맥, `userId`
- 최근 2개 질문/답변과 최근 3턴 기준 상품 ID 정도만 프롬프트에 다시 넣는다
- TTL이 지나면 세션은 만료된다
- 설정이 `redis`면 Redis에 저장하고, 아니면 프로세스 메모리에 저장한다
- Redis를 쓰면 서버 재시작이나 멀티 인스턴스 환경에서도 follow-up 문맥을 유지할 수 있다

세션은 아래 흐름으로 동작한다.

```text
1. 요청이 들어오면 sessionId 기준으로 기존 세션을 조회한다.
2. 최근 질문/답변/상품 ID와 화면 문맥을 session snapshot으로 만든다.
3. retrieval과 generation이 이 snapshot을 보조 문맥으로 사용한다.
4. 응답이 끝나면 현재 질문, 최종 답변, 추천 상품 ID를 다시 저장한다.
5. TTL이 지나면 세션은 자동 만료된다.
```

현재 구현상 세션의 목적은 아래 두 가지다.

- "이거 말고 다른 거", "방금 추천한 것 중에" 같은 follow-up 질문 해석
- 현재 어떤 화면과 어떤 상품 맥락에서 질문했는지 유지

## Backend Design Requirement

현재 챗봇 세션을 제대로 쓰려면 AI 서버 단독 설계만으로는 부족하고,
백엔드 측 대화방/세션 관리 설계도 함께 필요하다.

- AI 서버는 `sessionId`가 오면 그 값을 기준으로 세션을 이어간다
- `sessionId`가 없으면 새 세션을 만든다
- 따라서 백엔드는 자기 쪽의 채팅방, 대화, 상담 단위와 AI의 `sessionId`를 매핑해서 저장해야 한다
- 같은 채팅방에서 후속 질문을 보낼 때는 이전에 받은 `sessionId`를 다시 보내야 한다
- `userId`만으로 세션을 이어붙이면 여러 채팅방이 섞일 수 있으므로, 세션 키는 별도 conversation 단위로 보는 편이 맞다

즉 현재 구조는 "첫 질문 POST에서 세션 생성 -> 이후 같은 채팅방에서 같은 `sessionId`로 계속 POST"를 전제로 한다.

## Chatbot Ranking Notes

검색 결과는 단순 cosine similarity 순서로 끝나지 않는다.

- vector 검색은 의미 기반 유사도에 강하다
- keyword 검색은 상품명, 브랜드명, 카테고리, 설명의 직접 매칭에 강하다
- `fusion.py`는 vector/keyword source score를 먼저 합치고, 카테고리 의도, 루틴 공백, 회피 성분, 문맥 불일치 같은 규칙을 product별로 한 번만 적용한다
- vector/keyword weight와 RRF base는 `core/settings.py`의 `CHATBOT_HYBRID_RRF_K`, `CHATBOT_VECTOR_WEIGHT`, `CHATBOT_KEYWORD_WEIGHT`를 그대로 사용한다
- 따라서 "답변 품질이 이상하다"는 문제는 LLM보다 retrieval/scoring에서 먼저 보는 편이 맞다

## Chatbot Indexing Notes

- vector 검색 품질을 보려면 Chroma 컬렉션 메타데이터가 현재 코드와 맞아야 한다
- 새 document/evidence 필드를 반영했으면 `scripts/reindex_chatbot.py --reset`으로 재색인하는 편이 맞다
- 재색인과 keyword 검색은 둘 다 `search/product_data.py`의 공통 상품 메타데이터 로더를 사용한다
- 이 로더는 MySQL 접속이 가능해야 동작한다

## Chatbot Limitations

현재 챗봇은 아래를 의도적으로 하지 않는다.

- 성분 완전 검증을 보장하지 않는다
- 상품 ID만 보고 보이지 않은 상세 정보를 추측하지 않는다
- 의료 진단처럼 피부 상태를 단정하지 않는다
- 검색 후보가 없는데 임의로 상품명을 만들어내지 않는다
- 긴 상담형 멀티턴 메모리를 유지하지 않는다

## Chatbot Reading Order

챗봇 흐름을 빠르게 보려면 아래 순서가 좋다.

```text
1. api/routers/chatbot.py
2. services/chatbot/domain/mappers.py
3. services/chatbot/generation/service.py
4. services/chatbot/retrieval/workflow/planner.py
5. services/chatbot/retrieval/workflow/assembler.py
6. services/chatbot/retrieval/scoring/fusion.py
7. services/chatbot/search/vector/service.py
8. services/chatbot/search/keyword/service.py
```

## Working Guidance

```text
- generation / retrieval / search 경계는 유지하는 편이 좋다.
- 질문 해석, 점수 계산, 응답 문자열 생성은 한 파일에 다시 섞지 않는 편이 좋다.
- retrieval 품질 문제는 generation보다 retrieval/scoring 쪽을 먼저 본다.
- 응답 톤 수정은 prompts, generation/templates.py, generation/postprocess.py를 함께 본다.
- 값 조정이 필요하면 먼저 retrieval/constants 쪽에서 해결 가능한지 본다.
- ai 코드 변경으로 구조, 흐름, 실행 방법, 운영 전제가 달라졌다면 AGENTS.md도 함께 업데이트한다.
```
