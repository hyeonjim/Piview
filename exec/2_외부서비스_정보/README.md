# 2. 외부 서비스 정보

## 1. 개요

PiView는 자체 운영 인프라 외에도 소셜 로그인, 클라우드 스토리지, LLM/임베딩 API를 사용한다.
MySQL, Redis, Chroma, Jenkins, Nginx는 자체 Docker 인프라로 운영하므로 외부 서비스 목록에서는 별도로 구분한다.

## 2. 외부 서비스 목록

### 2-1. Kakao OAuth

용도:

- 카카오 소셜 로그인
- 사용자 프로필 및 이메일 연동

설정 위치:

- `application-dev.yml`

필수 정보:

```yaml
provider: kakao
client-id: dc4113f7eef1fc9ee26ff2a6fe1f46ab
client-secret: e8D2BNq5YYcd6zWQCGQeFhWn3i8oPOYJ
redirect-uri: https://j14e101.p.ssafy.io:3000/login/oauth2/code/kakao
authorization-uri: https://kauth.kakao.com/oauth/authorize
token-uri: https://kauth.kakao.com/oauth/token
user-info-uri: https://kapi.kakao.com/v2/user/me
client-authentication-method: client_secret_post
scope:
  - profile_nickname
  - account_email
  - profile_image
```

추가 메모:

- 프론트 OAuth redirect URI: `https://j14e101.p.ssafy.io:3000/oauth2/redirect`
- 로그인 실패 시 이동 URI: `https://j14e101.p.ssafy.io:3000/login?error=true`

### 2-2. AWS S3

용도:

- 제품 관련 이미지 업로드 및 저장

설정 위치:

- `application-dev.yml`

필수 정보:

```yaml
access-key: AKIAW3MEEKX553YM5D6Q
secret-key: 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
region: ap-northeast-2
bucket: piview-products-images
```

### 2-3. SSAFY GMS / Gemini 계열 API

용도:

- 챗봇 생성 응답
- 임베딩 생성
- OCR/분류 보조 모델 호출

설정 위치:

- 루트 `.env`
- `application-dev.yml`

필수 정보:

```env
GMS_KEY=S14P22E101-4d285ebc-b69e-4308-92ff-fffead97a785
CHATBOT_MODEL=gemini-2.5-flash-lite
EMBEDDING_API_BASE_URL=https://gms.ssafy.io/gmsapi/api.openai.com
EMBEDDING_MODEL=text-embedding-3-small
```

추가 메모:

- `application-dev.yml`에도 `gemini.api.key`가 동일 키로 설정되어 있다.
- AI 서버 기본 모델 관련 기본값은 `ai/README.md` 기준 `gemini-2.5-flash` 계열을 사용한다.

### 2-4. Let's Encrypt

용도:

- 운영/개발 HTTPS 인증서 제공

설정 위치:

- 호스트 `/etc/letsencrypt`
- `docker-compose.yml`의 `nginx` 볼륨 마운트

적용 도메인:

- `j14e101.p.ssafy.io`

### 2-5. Jenkins

용도:

- 배포/운영 관리 UI

접속 주소:

- `https://j14e101.p.ssafy.io:9090`

비고:

- Jenkins는 외부 SaaS가 아니라 자체 운영 컨테이너다.
- 제출 항목상 운영에 필요한 외부 접점이므로 같이 기록한다.

## 3. 자체 운영 인프라와의 구분

아래는 외부 SaaS가 아니라 프로젝트가 직접 운영하는 내부 서비스다.

- MySQL: `mysql-db`
- Redis: `develop-redis`, `back-dev-redis`, `prod-redis`
- Chroma: `dev-chroma`, `prod-chroma`
- Nginx: `nginx`
- AI API 서버: `dev-ai`, `prod-ai`
- Spring Boot 서버: `dev-backend`, `prod-backend`

## 4. 외부 서비스 사용 시 필요한 파일 목록

- 루트 `.env`
- 루트 `application-dev.yml`
- 루트 `application-prod.yml`
- 호스트 `/etc/letsencrypt`

## 5. 제출 메모

- 이 문서는 실제 dev 설정 기준으로 작성했다.
- 외부 서비스 값은 private 제출 전제하에 정리했다.
