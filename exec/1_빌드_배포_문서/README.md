# 1. 빌드 및 배포 문서

## 1. 사용 기술 및 버전

### 1-1. Frontend

- Framework: Next.js `16.1.6`
- Runtime: React `19.2.3`
- Package manager: `pnpm@10.0.0`
- 주요 라이브러리: `@tanstack/react-query`, `axios`, `zustand`, `framer-motion`

### 1-2. Backend

- Language: Java `21`
- Framework: Spring Boot `3.5.11`
- Build tool: Gradle
- 주요 구성: Spring Web, Spring Security, Spring Data JPA, Spring Data Redis, OAuth2 Client, SpringDoc
- DB 드라이버: MySQL Connector/J

### 1-3. AI

- Language: Python
- Framework: FastAPI, Uvicorn
- 주요 라이브러리:
  - `google-genai`
  - `chromadb`
  - `pymysql`
  - `redis`
  - `mediapipe`
  - `torch`, `torchvision`
  - `easyocr`
  - `kiwipiepy`, `rapidfuzz`

### 1-4. Infra

- Reverse proxy: `nginx:alpine`
- DB: `mysql:8.0`
- Cache/Session: `redis:alpine`
- Vector DB: `chromadb/chroma:latest`
- CI/CD: `jenkins/jenkins:lts`
- Container orchestration: Docker Compose

## 2. 서버 및 컨테이너 구성

실제 배포는 루트 `docker-compose.yml` 기준으로 구성한다.

공통 인프라:

- `mysql-db`
- `develop-redis`
- `back-dev-redis`
- `prod-redis`
- `nginx`
- `jenkins`

Dev 환경:

- `dev-frontend`
- `dev-backend`
- `dev-ai`
- `dev-chroma`

Prod 환경:

- `prod-frontend`
- `prod-backend`
- `prod-ai`
- `prod-chroma`

## 3. 핵심 주소

- Dev 프론트: `https://j14e101.p.ssafy.io:3000`
- Dev Swagger: `https://j14e101.p.ssafy.io:3000/swagger-ui/index.html`
- Dev API Docs: `https://j14e101.p.ssafy.io:3000/v3/api-docs`
- Prod 메인: `https://j14e101.p.ssafy.io`
- Jenkins: `https://j14e101.p.ssafy.io:9090`

## 4. 빌드/배포에 필요한 설정 파일

실제 구동에는 아래 외부 설정 파일이 필요하다.

- 루트 `.env`
- 루트 `application-dev.yml`
- 루트 `application-prod.yml`

현재 확인 가능한 dev 기준 실제 값은 아래와 같다.

### 4-1. 루트 `.env`

루트 `.env`는 아래 내용으로 구성한다.

```env
GMS_KEY=S14P22E101-4d285ebc-b69e-4308-92ff-fffead97a785
CHATBOT_MODEL=gemini-2.5-flash-lite
EMBEDDING_API_BASE_URL=https://gms.ssafy.io/gmsapi/api.openai.com
EMBEDDING_MODEL=text-embedding-3-small
CHATBOT_DB_HOST=mysql-db
CHATBOT_DB_PORT=3306
CHATBOT_DB_USER=root
CHATBOT_DB_PASSWORD=viewview4503
CHATBOT_DB_NAME=piview_dev
CHROMA_HOST=dev-chroma
CHROMA_PORT=8000
CHATBOT_VECTOR_COLLECTION=products
CHATBOT_SESSION_BACKEND=redis
CHATBOT_REDIS_HOST=develop-redis
CHATBOT_REDIS_PORT=6379
CHATBOT_REDIS_PASSWORD=Redevelop-devpi1453
DEV_REDIS_PASSWORD=Redevelop-devpi1453
BACK_DEV_REDIS_PASSWORD=Redevelop-devpi1453
PROD_REDIS_PASSWORD=Redevelop-devpi1453
```

### 4-2. `application-dev.yml`

```yaml
spring:
  application:
    name: backend
  data:
    redis:
      host: develop-redis
      port: 6379
      password: "Redevelop-devpi1453"
      database: 0
  datasource:
    url: jdbc:mysql://mysql-db:3306/piview_dev?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: root
    password: "viewview4503"
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
  security:
    oauth2:
      client:
        registration:
          kakao:
            provider: kakao
            client-id: dc4113f7eef1fc9ee26ff2a6fe1f46ab
            client-secret: e8D2BNq5YYcd6zWQCGQeFhWn3i8oPOYJ
            redirect-uri: "https://j14e101.p.ssafy.io:3000/login/oauth2/code/kakao"
            authorization-grant-type: authorization_code
            client-authentication-method: client_secret_post
            client-name: Kakao
            scope:
              - profile_nickname
              - account_email
              - profile_image
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id
  cloud:
    aws:
      credentials:
        access-key: AKIAW3MEEKX553YM5D6Q
        secret-key: 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
      region:
        static: ap-northeast-2
      s3:
        bucket: piview-products-images
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 100MB

app:
  auth:
    token-secret: cGl2aWV3LXN1cGVyLXNlY3JldC1rZXktZm9yLWp3dC10b2tlbi1hdXRoZW50aWNhdGlvbi0yMDI2Cg==
    token-expiration-msec: 1800000
    refresh-token-expiration-days: 14
    oauth2-cookie-expire-seconds: 60
    cookie-secure: true
    cookie-same-site: "none"
  oauth2:
    success-redirect-uri: "https://j14e101.p.ssafy.io:3000/oauth2/redirect"
    failure-redirect-uri: "https://j14e101.p.ssafy.io:3000/login?error=true"
    authorized-redirect-uris:
      - https://j14e101.p.ssafy.io:3000/oauth2/redirect
  frontend:
    authorized-redirect-uris: "http://localhost:3000/oauth2/redirect,https://j14e101.p.ssafy.io:3000/oauth2/redirect"
springdoc:
  swagger-ui:
    url: /v3/api-docs
    config-url: /v3/api-docs/swagger-config

server:
  forward-headers-strategy: framework

fastapi:
  base-url: http://dev-ai:8000

gemini:
  api:
    key: "S14P22E101-4d285ebc-b69e-4308-92ff-fffead97a785"
```

### 4-3. 기타 설정 파일 목록

DB 접속 정보 또는 프로젝트 프로퍼티가 정의된 주요 파일:

- 루트 `.env`
- 루트 `application-dev.yml`
- 루트 `application-prod.yml`
- `backend/src/main/resources/application-local.yml`
- `ai/.env`

## 5. 초기 준비

### 5-1. Docker 기반 실행

프로젝트 루트에서 실행:

```bash
docker compose build dev-frontend dev-backend dev-ai
docker compose up -d mysql-db develop-redis back-dev-redis dev-chroma dev-ai dev-backend dev-frontend nginx
```

상태 확인:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
```

### 5-2. DB 초기화

MySQL 컨테이너 최초 생성 시 `init.sql`이 아래 DB를 자동 생성한다.

- `piview_dev`
- `piview_back_dev`
- `piview_prod`

## 6. 서비스별 실행 포인트

### 6-1. Frontend

로컬 단독 개발:

```bash
cd frontend
pnpm install
pnpm build
pnpm start
```

### 6-2. Backend

로컬 단독 개발:

```bash
cd backend
./gradlew bootRun --args="--spring.profiles.active=local"
```

### 6-3. AI

로컬 단독 개발:

```bash
cd ai
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 7. 배포 시 특이사항

- dev와 prod를 같은 Compose 파일에서 함께 운영한다.
- `dev-backend`는 호스트의 `application-dev.yml`을 컨테이너 `/app/application-dev.yml`로 마운트한다.
- `dev-ai`와 `prod-ai`는 루트 `.env`를 읽는다.
- `dev-chroma`, `prod-chroma`는 별도 볼륨에 데이터를 영속 저장한다.
- `nginx`는 dev `3000`, prod `443`, Jenkins `9090`을 함께 프록시한다.
- HTTPS 인증서는 호스트 `/etc/letsencrypt`를 컨테이너에 마운트해 사용한다.

## 8. 장애 점검 기본 명령

```bash
docker ps -a --format '{{.Names}}\t{{.Status}}'
docker logs --tail 200 dev-backend
docker logs --tail 200 dev-ai
docker logs --tail 200 nginx
docker exec nginx sh -lc 'wget -S -O - http://dev-backend:8080/v3/api-docs 2>&1 | head -n 40'
```
