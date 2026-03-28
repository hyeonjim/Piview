# AI 서비스 맵

## 개요

AI 서비스는 FastAPI 기반으로 구성되어 있으며, 피부 분석, OCR, 상품 검색 보조, 챗봇 보조 기능을 제공합니다.

## 엔트리 포인트

위치: `ai/main.py`

주요 prefix:
- `/skin`
- `/ocr`
- `/chat`
- `/products`

상태 확인 엔드포인트:
- `/health`

초기화 동작:
- 서버 시작 시 상품 검색 사전과 관련 서비스 초기화를 수행합니다.

## API 구성

### skin

역할:
- 피부 상태 추출
- 피부 타입 예측

엔드포인트:
- `POST /skin/extract-state`
- `POST /skin/predict`

비고:
- 현재 두 경로는 같은 핸들러를 공유하며, 동일한 피부 상태 추출 파이프라인을 호출합니다.

관련 코드:
- `ai/api/routers/skin_type.py`
- `ai/services/skin/`
- `ai/inference/`

### ocr

역할:
- 제품 이미지 텍스트 추출

엔드포인트:
- `POST /ocr/extract-text`

관련 코드:
- `ai/api/routers/ocr.py`

### chat

역할:
- 챗봇 질의 처리
- 검색/생성 결합 응답

엔드포인트:
- `POST /chat/query`
- `POST /chat/retrieve`

관련 코드:
- `ai/api/routers/chatbot.py`
- `ai/services/chatbot/`

### products

역할:
- 상품 검색 질의 해석
- 사전 상태 조회 및 갱신

엔드포인트:
- `GET /products/search`
- `GET /products/dictionaries`
- `POST /products/dictionaries/refresh`

관련 코드:
- `ai/api/routers/product_search.py`
- `ai/services/product_search/`

## 내부 모듈 구조

### inference

- 모델 추론 로직
- 피부 부위별 분석 계산

### services/skin

- 피부 분석 파이프라인 조합

### services/product_search

- 질의 해석
- 필터 구성
- 랭킹 점수 계산
- 사전 생성과 평가

### services/chatbot

- 세션 관리
- 의도 해석
- 검색
- 검색 결과 조합 흐름
- generation 후처리
- provider 연동

## 저장소 의존성 기준 기술 요소

- FastAPI
- PyTorch
- EasyOCR
- MediaPipe
- ChromaDB
- Redis
- Google GenAI 연동 코드

## 노출 방식 메모

- 운영 환경에서는 `nginx`를 통해 `/ai/` 경로로 AI 서비스에 접근할 수 있습니다.
- 개발 환경에서는 현재 `dev-ai`가 Nginx에 직접 프록시되지 않아, 주로 Docker 네트워크 내부 연동을 전제로 합니다.
