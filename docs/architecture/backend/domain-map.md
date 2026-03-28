# Backend 도메인 맵

## 개요

백엔드는 `backend/src/main/java/com/piview/backend/domain` 아래를 기준으로 도메인을 분리합니다.

> [!NOTE]
> 아래 엔드포인트는 프론트엔드 연동 기준의 공개 경로 예시입니다.
> 현재 프론트엔드는 `NEXT_PUBLIC_API_URL + /api/v1`를 기준으로 백엔드를 호출합니다.
> 컨트롤러의 `@RequestMapping` 값은 이 문서에서 표기한 공개 prefix 없이 정의되어 있을 수 있습니다.

## 도메인 구성

### user

역할:
- 로그인 및 인증
- 사용자 프로필 관리
- 기피 성분 및 비선호 제품 관리

대표 엔드포인트:
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/disliked/products`
- `POST /api/v1/users/me/disliked/products`
- `DELETE /api/v1/users/me/disliked/products/{dislikedProductId}`
- `GET /api/v1/users/me/disliked/ingredients`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/dev/login`  # 개발/테스트 전용

### skin

역할:
- 피부 분석 요청 및 결과 조회
- 설문 기반 피부 타입 보정

대표 엔드포인트:
- `POST /api/v1/skin/analysis/capture`
- `GET /api/v1/skin/analysis/{analysisId}`
- `POST /api/v1/skin/surveys/{analysisId}`

### product

역할:
- 제품 검색과 상세 조회
- 제품 비교와 좋아요
- 추천, 동적 점수, AI 요약

대표 엔드포인트:
- `GET /api/v1/products`
- `GET /api/v1/products/{productId}`
- `GET /api/v1/products/filters`
- `POST /api/v1/products/compare`
- `POST /api/v1/products/{productId}/likes/toggle`
- `GET /api/v1/products/likes`
- `GET /api/v1/products/{productId}/summary`
- `GET /api/v1/products/compare/ai-summary`
- `POST /api/v1/recommendations/products`
- `GET /api/v1/dynamic/recommendations`

### routine

역할:
- 사용자 보유 제품 관리
- 루틴 초안과 루틴 저장 관리

대표 엔드포인트:
- `GET /api/v1/my-cos`
- `POST /api/v1/my-cos/{productId}`
- `DELETE /api/v1/my-cos/{myCosId}`
- `POST /api/v1/routines/draft`
- `PUT /api/v1/routines/draft`
- `GET /api/v1/routines/draft`
- `DELETE /api/v1/routines/draft/{productId}`
- `DELETE /api/v1/routines/draft`
- `POST /api/v1/routines`
- `GET /api/v1/routines`
- `GET /api/v1/routines/main`
- `GET /api/v1/routines/{routineId}`
- `PATCH /api/v1/routines/{routineId}/order`
- `PATCH /api/v1/routines/{routineId}/main`
- `POST /api/v1/routines/{routineId}/edit-start`
- `PUT /api/v1/routines/{routineId}`
- `DELETE /api/v1/routines/{routineId}`

### ocr

역할:
- OCR 인식 요청 중계
- 제품 데이터 매핑

대표 엔드포인트:
- `POST /api/v1/ocr/recognize`

비고:
- 실제 OCR 추론은 AI 서비스가 담당하고, 백엔드는 사용자 요청/응답과 내부 제품 매핑 흐름을 중계합니다.

### chatbot

역할:
- 챗봇 질의 처리
- AI 서비스 응답 포맷 연결

대표 엔드포인트:
- `POST /api/v1/chatbot/query`

### support

역할:
- 사용자 행동 이벤트 수집
- 파일 업로드와 외부 저장소 연동
- 운영/개발 보조성 API 제공

대표 엔드포인트:
- `POST /api/v1/logs/events`
- `GET /api/v1/logs/run-duckdb`  # 서버 점검용, 일반 사용자 플로우 연동 대상 아님
- `POST /api/v1/s3/upload`

## 공통 계층

- `global/config`: 보안, Swagger, JPA, Querydsl 설정
- `global/security`: JWT 필터, OAuth2, 사용자 인증 처리
- `global/exception`: 공통 예외와 응답 포맷
- `global/redis`: Redis 연동 공통 처리
- `global/util`: 쿠키, 공통 엔티티 등 공통 유틸리티
