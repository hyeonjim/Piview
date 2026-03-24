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

## Integration Notes

- 로컬에서 AI 서버 기본 주소는 `http://localhost:8000`입니다.
- 백엔드는 `fastapi.base-url` 설정을 기준으로 AI 서버를 호출합니다.
