# Infra 배포 구조

## 개요

인프라 구성은 루트 `docker-compose.yml`과 `nginx/nginx.conf`를 중심으로 관리됩니다. 개발 환경과 운영 환경을 같은 Compose 파일 안에서 분리해 정의하고 있습니다.

> [!NOTE]
> 이 문서는 저장소에 포함된 설정 파일 기준의 구조 설명입니다.
> 실제 구동에는 루트 `.env`, `application-dev.yml`, `application-prod.yml` 같은 외부 설정 파일이 필요하며, 값 자체는 저장소에 포함되어 있지 않습니다.

## Docker Compose 구성

### 공통 인프라

- `mysql-db`: 공용 MySQL 컨테이너
- `nginx`: 개발/운영 트래픽 라우팅용 리버스 프록시
- `jenkins`: Jenkins 관리 UI 및 서버 컨테이너

### Redis

- `develop-redis`
- `back-dev-redis`
- `prod-redis`

비고:
- 환경별 Redis를 분리해 포트 충돌을 피하고 세션성 데이터를 독립적으로 관리합니다.

### Dev 환경

- `dev-frontend`
- `dev-backend`
- `dev-ai`
- `dev-chroma`

### Prod 환경

- `prod-frontend`
- `prod-backend`
- `prod-ai`
- `prod-chroma`

## 라우팅 구조

위치: `nginx/nginx.conf`

### 운영 라우팅

- `80` 포트는 `443`으로 리다이렉트
- `443` 포트에서 `prod-frontend`, `prod-backend`, `prod-ai`로 프록시
- `/api/`, `/oauth2/authorization/`, `/login/`, `/swagger-ui/`, `/v3/api-docs` 경로는 백엔드로 전달
- `/ai/` 경로는 AI 서비스로 전달

### 개발 라우팅

- `3000` 포트에서 `dev-frontend`, `dev-backend`로 프록시
- `/api/`, `/oauth2/authorization/`, `/login/`, `/swagger-ui/`, `/v3/api-docs` 경로를 개발 백엔드로 전달

비고:
- 현재 `dev-ai`는 개발용 Nginx 라우팅에 직접 노출되지 않습니다.
- `dev-ai`와 `dev-chroma`는 주로 Docker 네트워크 내부 서비스 연동을 전제로 합니다.

### Jenkins 라우팅

- `9090` 포트에서 Jenkins 관리 화면 제공

## 직접 노출 포트 메모

- `80`, `443`: 운영 웹/HTTPS
- `3000`: 개발용 HTTPS 진입점
- `9090`: Jenkins 관리 화면
- `8001`: `dev-chroma` 호스트 노출 포트
- `8002`: `prod-chroma` 호스트 노출 포트

## 저장소와 연결된 인프라 요소

- Docker 기반 컨테이너 운영
- Nginx 리버스 프록시
- Jenkins 컨테이너 및 관리 UI 구성
- S3 업로드 연동
- Chroma 별도 컨테이너 운영
- MySQL, Redis 영속 데이터 볼륨 사용
- 호스트의 Let's Encrypt 인증서 마운트 전제
