# piview Backend

이 저장소는 piview 프로젝트의 Spring Boot 백엔드입니다.

## 로컬 실행

### 1. 준비
- Java 21
- MySQL
- Redis

### 2. 로컬 설정 파일 준비
- `src/main/resources/application-local.yml` 파일을 준비합니다.
- 아래 항목이 로컬 환경과 맞아야 합니다.
  - `spring.datasource.url`
  - `spring.datasource.username`
  - `spring.datasource.password`
  - `spring.data.redis.host`
  - `spring.data.redis.port`
  - OAuth2 관련 로컬 설정
  - JWT 관련 로컬 설정

### 3. MySQL 실행
- 로컬 MySQL 서버를 실행합니다.
- 애플리케이션이 사용할 DB를 미리 생성합니다.

```sql
CREATE DATABASE cosmetics_test1_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

- JPA 설정이 `ddl-auto: update`이면 서버 실행 시 필요한 테이블이 자동 생성 또는 갱신될 수 있습니다.

### 4. Redis 실행
- 로컬 Redis 서버를 실행합니다.
- 기본 연결 정보는 `localhost:6379` 기준입니다.
- Docker를 사용할 경우 예시는 아래와 같습니다.

```powershell
docker run --name local-redis -p 6379:6379 -d redis
```

### 5. 백엔드 실행
- `local` 프로필로 서버를 실행합니다.

```powershell
.\gradlew bootRun --args="--spring.profiles.active=local"
```

### 6. 실행 확인
- 기본 포트는 `8080`입니다.
- 서버가 정상 실행되면 아래 주소를 기준으로 확인합니다.
  - 서버 기본 주소: `http://localhost:8080`
  - 카카오 로그인 시작 주소: `http://localhost:8080/oauth2/authorization/kakao`

### 7. 로컬 점검 순서
1. MySQL 접속 확인
2. Redis 실행 확인
3. `local` 프로필로 서버 실행
4. 로그인 또는 토큰 재발급 흐름 확인
5. Postman으로 주요 API 호출
6. 필요 시 DataGrip 등으로 대표 테이블 상태 확인

## 참고
- 현재 로컬 점검 시 대표적으로 확인하는 테이블은 `users`, `my_skin`입니다.
- 위 테이블은 설문/로그인 연동 확인에 자주 쓰이는 예시이며, 전체 백엔드 테이블 목록을 뜻하지는 않습니다.
- API 확인도 특정 기능만 한정하지 않고, 현재 작업 범위에 맞는 엔드포인트를 기준으로 진행하면 됩니다.
