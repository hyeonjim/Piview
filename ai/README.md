# AI Service

## Overview

- FastAPI 기반 AI 서버입니다.
- 기본 포트는 `8000`입니다.
- OCR, 피부 분석, 챗봇 엔드포인트를 제공합니다.

## Run

- 아래 명령은 프로젝트의 `ai/` 디렉터리에서 실행합니다.

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

- 환경변수는 `ai/.env` 파일로 관리합니다.

예시:

```env
GMS_KEY=your-key
```

선택 환경변수:

```env
GMS_MODEL=gemini-2.5-flash
GMS_API_BASE_URL=https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com
CHATBOT_MODEL=gemini-2.5-flash
```

## API Endpoints

- `GET /health`
  - 서버 상태 확인
- `POST /ocr/extract-text`
  - 화장품 이미지 OCR
  - `multipart/form-data`
  - file field: `file`
- `POST /skin/predict`
  - 피부 상태 분석
  - `multipart/form-data`
  - file field: `file`
- `POST /chat/query`
  - 챗봇 질의응답
  - `application/json`
- `POST /chat/retrieve`
  - 상품 retrieval 전용 검색
  - `application/json`
  - intent 분기나 답변 생성 없이, 자연어 질의를 바로 검색용으로 해석해 랭킹된 상품 후보를 반환합니다.
  - 최대 `100`개까지 상품을 반환할 수 있으며, 실제 개수는 검색 결과와 필터 조건에 따라 달라질 수 있습니다.

## Integration Notes

- 로컬에서 AI 서버 기본 주소는 `http://localhost:8000`입니다.
- 백엔드는 `fastapi.base-url` 설정을 기준으로 AI 서버를 호출합니다.

## Swagger 주소

### 로컬(local)
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
- `/chat/retrieve` 요청/응답 예시는 Swagger UI에서 바로 확인할 수 있습니다.

### 개발(dev)
- Docker 네트워크 내부 주소: `http://dev-ai:8000/docs`
- Docker 네트워크 내부 OpenAPI JSON: `http://dev-ai:8000/openapi.json`
- 참고: 현재 `nginx/nginx.conf`에는 AI의 `/docs`와 `/openapi.json`을 외부로 프록시하는 설정이 없어, 브라우저에서 바로 여는 공개 dev URL은 없습니다.

## Chatbot Notes

- 챗봇 내부는 API 스키마와 별도로 `services/chatbot/domain/`의 내부 모델을 사용합니다.
- 외부 LLM/임베딩 호출은 `services/chatbot/providers/` 아래 provider 어댑터로 분리돼 있습니다.
- retrieval은 planner, executor, assembler 단계로 나뉘고, fusion 가중치는 `ai/.env`의 `CHATBOT_*` 설정을 그대로 반영합니다.
