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
  generation/       --- 최종 답변 생성 계층
    service.py      --- 챗봇 응답 전체 오케스트레이션
    llm.py          --- LLM 호출
    templates.py    --- 템플릿 답변 생성
    postprocess.py  --- 답변 후처리
    helpers.py      --- generation 공통 헬퍼

  retrieval/        --- 검색과 랭킹 중심 계층
    service.py      --- retrieval 전체 오케스트레이션
    models.py       --- retrieval 중간 산출물 모델

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
    embedding/      --- 임베딩 생성
      client.py     --- 외부 임베딩 API 호출
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
```

## Chatbot Reading Order

챗봇 흐름을 빠르게 보려면 아래 순서가 좋다.

```text
1. api/routers/chatbot.py
2. services/chatbot/generation/service.py
3. services/chatbot/retrieval/service.py
4. services/chatbot/retrieval/scoring/fusion.py
5. services/chatbot/search/vector/service.py
6. services/chatbot/search/keyword/service.py
```

## Working Guidance

```text
- generation / retrieval / search 경계는 유지하는 편이 좋다.
- 질문 해석, 점수 계산, 응답 문자열 생성은 한 파일에 다시 섞지 않는 편이 좋다.
- retrieval 품질 문제는 generation보다 retrieval/scoring 쪽을 먼저 본다.
- 응답 톤 수정은 prompts, generation/templates.py, generation/postprocess.py를 함께 본다.
- 값 조정이 필요하면 먼저 retrieval/constants 쪽에서 해결 가능한지 본다.
```
