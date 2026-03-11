# 설문 API 작업 계획 (revised)

## 범위
- 대상 API: `POST /api/v1/skin/surveys`
- 전제: `auth`/보안 코드는 pull 반영된 현재 구조를 기준으로 작업
- 설문 저장은 로그인 사용자 기준으로 진행
- 현재 구조에서는 `User`가 `users` 테이블과 기본 프로필(`gender`, `ageGroup`, `mySkinType`)을 직접 관리
- `MySkin.user_id`는 이번 단계에서는 `User.id` 기준으로 저장

## AGENTS 규칙 반영
- 성공 응답은 `ApiResponse.success(...)` 사용
- 비즈니스 예외는 `CustomException + ErrorCode` 사용
- 패키지 구조는 기능 단위(`skin/survey/...`)를 유지

## 진행 현황
- 완료:
  - 1단계 `BE-feat: 설문 기본 enum 및 구조 추가`
  - 커밋: `cccccda`
  - 브랜치: `BE-feat-skin-survey`
  - 포함 내용: `survey` 패키지 골격, enum, `MySkin` 엔티티/레포지토리, 설문 DTO
  - 2단계 `BE-feat: 설문 점수 계산기 및 동점 규칙 구현`
  - 포함 내용: `SurveyScoreCalculator` 추가, 동점 규칙(Q5 -> Q4 -> Q3) 반영, 단위 테스트 3건 통과
  - 3단계 `BE-refactor: 설문 저장 기준을 Auth 중심으로 재정렬`
  - 커밋: `77ef7fd`
  - 포함 내용: `User` 분리안 제거, `MySkin.user_id` 기준을 `Auth.id` 방향으로 정리
  - 4단계 `BE-feat: 설문 저장 서비스 구현 (Q1~Q7)`
  - 커밋: `d2de921`
  - 포함 내용: `SurveyService` 추가, `Auth` 조회 및 프로필 갱신, `MySkin` 재저장
  - 5단계 `BE-feat: POST /api/v1/skin/surveys 엔드포인트 추가`
  - 커밋: `eeaa88b`
  - 포함 내용: `SurveyController` 추가, `@AuthenticationPrincipal UserPrincipal` 기반 설문 제출 엔드포인트 연결
  - 설문 관련 테스트 실행 확인
  - 실행 명령: `.\gradlew test --tests "com.piview.backend.skin.survey.service.SurveyScoreCalculatorTest"`
  - 결과: `BUILD SUCCESSFUL`
- 보류:
  - 6단계 `BE-feat: Q7 피부 고민 태그 매핑 반영`
  - 7단계 `BE-refactor: 설문/인증 예외 처리 공통 규약 정리`
  - 8단계 `BE-test: 설문 저장/인증 연계 테스트 보강`
  - 9단계 `BE-chore: 문서 및 후속 분리 리팩터링 포인트 정리`
- 다음 작업:
  - Redis 로컬 실행 환경 준비
  - `local` 프로필로 스프링 서버 실행
  - DataGrip에서 `users`, `my_skin` 반영 상태 확인
  - 로그인 후 Postman으로 `POST /api/v1/skin/surveys` 실동작 확인

## 작업 단위 (커밋명 예시 포함)

### 3) `BE-refactor: 설문 저장 기준을 Auth 중심으로 재정렬`
- 상태: 완료 (`77ef7fd`)
- 목표:
  - 당시 설문 저장 기준 엔티티를 `User`가 아닌 `Auth`로 확정
- 변경 대상:
  - `skin/survey` 서비스 설계
  - `MySkin.user_id` 사용 기준 정리
  - 설계 문서/주석 정리
- 완료 기준:
  - 당시 로그인 사용자 식별값이 `Auth.id`라는 점 명확화
  - 기존 `User.auth_id` 전제 제거

### 4) `BE-feat: 설문 저장 서비스 구현 (Q1~Q7)`
- 상태: 완료 (`d2de921`)
- 목표:
  - 로그인 사용자 기준으로 Q1/Q2/Q3~Q6 결과/Q7 고민값 저장
- 변경 대상:
  - `skin/survey/service/SurveyService.java`
  - 당시 기준 `auth/repository/AuthRepository.java`
  - `skin/survey/repository/MySkinRepository.java`
- 상세:
  - 당시 기준 `Auth` 조회
  - `gender`, `ageGroup`, `mySkinType` 갱신
  - 기존 `MySkin` 삭제 후 Q7 다건 재저장
- 완료 기준:
  - 당시 기준 `Auth` 프로필과 `MySkin` 값이 일관되게 저장
  - 트랜잭션 처리 포함

### 5) `BE-feat: POST /api/v1/skin/surveys 엔드포인트 추가`
- 상태: 완료 (`eeaa88b`)
- 목표:
  - 컨트롤러 노출, 로그인 사용자 식별, 요청 검증, 응답 포맷 통일
- 변경 대상:
  - `skin/survey/controller/SurveyController.java`
  - Request DTO Bean Validation
  - `@AuthenticationPrincipal UserPrincipal` 연동
- 완료 기준:
  - Postman 호출 성공
  - 응답이 `ApiResponse.success(...)` 형태
  - 로그인 사용자 기준으로 저장 성공

### 6) `BE-refactor: Auth -> User 구조 변경 기준으로 설문 저장 동일화`
- 상태: 미진행
- 목표:
  - `origin/back-dev`의 `Auth -> User` 변경을 유지한 채, 설문 저장 로직을 `User` 기준으로 재정렬
- 변경 대상:
  - `skin/survey/service/SurveyService.java`
  - `skin/survey/entity/MySkin.java`
  - 관련 주석/문서
- 상세:
  - `AuthRepository` -> `UserRepository`
  - `Auth` -> `User`
  - `authId` -> `userId`
  - `MySkin.user_id` 설명을 `User.id` 기준으로 정리
- 완료 기준:
  - 설문 저장 로직이 `user` 패키지 구조와 모순 없이 동작
  - 설문 관련 문서/주석이 `User` 기준으로 통일

### 7) `BE-feat: Q7 피부 고민 태그 매핑 반영`
- 상태: 미진행
- 목표:
  - 설문 보기 문구와 추천/저장 태그를 분리하고, Q7 입력값을 내부 태그로 정규화
- 변경 대상:
  - `skin/survey/service/SurveyService.java`
  - 필요 시 설문 DTO/문서
- 상세:
  - 설문 입력값은 기존 보기 문구를 그대로 받음
  - `기미/주근깨/잡티 -> 색소침착`
  - `속건조 -> 수분`
  - `주름/탄력 -> 안티에이징`
  - `홍조 -> 홍조, 진정`
  - `각질 -> 수분, 영양`
  - 다중 매핑 시 `MySkin` 행이 여러 건 저장될 수 있으므로 중복 제거 규칙 포함
- 완료 기준:
  - Q7 입력값이 문서 기준 태그로 변환되어 `my_skin`에 저장
  - 중복 태그 저장 방지
  - `홍조`, `각질` 같은 다중 매핑 케이스 저장 확인

### 8) `BE-refactor: 설문/인증 예외 처리 공통 규약 정리`
- 상태: 미진행
- 목표:
  - 설문 API와 auth API를 공통 응답/예외 규약에 맞춤
- 변경 대상:
  - `ErrorCode`
  - `GlobalExceptionHandler`
  - 필요 시 `AuthService`, `SurveyService`, `AuthController`
- 상세:
  - `IllegalArgumentException` 제거
  - 설문 입력 오류, 사용자 없음, 토큰 오류 등을 `CustomException`으로 변환
- 완료 기준:
  - Controller에서 임의 `ResponseEntity` 조립 최소화
  - 공통 오류 응답 유지

### 9) `BE-test: 설문 저장/인증 연계 테스트 보강`
- 상태: 미진행
- 목표:
  - 저장, 검증, 인증 실패 케이스 확인
- 변경 대상:
  - `SurveyScoreCalculatorTest`
  - 서비스/컨트롤러 테스트
- 완료 기준:
  - 정상 저장
  - 필수값 누락
  - 잘못된 선택지
  - 인증 사용자 없음
  - 동점 규칙 검증
  - Q7 태그 매핑 검증

### 10) `BE-chore: 문서 및 후속 분리 리팩터링 포인트 정리`
- 상태: 미진행
- 목표:
  - 이번 범위는 `User` 통합 모델로 마무리하고, 후속 구조 정리는 별도 리팩터링 트랙으로 남김
- 변경 대상:
  - 설문 API 관련 문서
  - 구조 메모/TODO
- 완료 기준:
  - 설문 API 기준 저장 모델 명확화
  - 향후 마이페이지/추천 확장 시 분리 필요 포인트 문서화

## 로컬 작업 흐름 (커밋 안 해도 됨)
1. Redis 실행 환경 준비
2. `.\gradlew bootRun --args="--spring.profiles.active=local"`로 서버 실행
3. DataGrip에서 `users`, `my_skin` 테이블 상태 확인
4. 카카오 로그인으로 토큰 확보
5. Postman으로 설문 API 저장 확인
6. `Auth -> User` 동일화 반영 후 저장 결과 재확인
7. Q7 태그 매핑 반영 후 저장 결과 재확인
8. 안정화 후 8~10단계 순서로 예외/테스트/문서 마무리

## DataGrip/테스트 시작 시점 가이드
- 현재:
  - DataGrip 연결 확인 완료 상태를 전제로 진행
  - 계산기 테스트 단독 실행 확인 완료
- 지금 바로 확인할 것:
  - `users` 프로필 필드 갱신 여부
  - `my_skin` 저장/삭제 여부
  - 로그인 사용자 기준 설문 저장 성공 여부
- 이후 7단계에서:
  - 서비스/컨트롤러 테스트를 추가 보강
  - DB 연동 테스트를 본격적으로 수행

## Postman 테스트 케이스
- 케이스 A: Q1~Q7 정상 입력 -> 200
- 케이스 B: Q1 또는 Q2 누락 -> validation 오류
- 케이스 C: Q3~Q6 잘못된 선택지 -> 도메인 오류
- 케이스 D: 동점 케이스 -> 규칙(Q5 > Q4 > Q3)대로 고정 결과
- 케이스 E: 로그인 사용자 기준 `User`/`MySkin` 저장 성공
- 케이스 F: 인증 사용자 미존재 -> 사용자 관련 오류 응답
- 케이스 G: `홍조` 선택 -> `홍조`, `진정` 2건 저장
- 케이스 H: `각질` 선택 -> `수분`, `영양` 2건 저장
- 케이스 I: `기미/주근깨/잡티` 선택 -> `색소침착` 1건 저장

## 메모
- OAuth/로그인 구현 자체는 현재 범위 밖이며, 현재는 pull 반영된 인증 구조를 전제로 설문 저장 연동을 진행한다.
- 경로 규약은 `/api/v1/*` 기준으로 유지한다.
- 현재 구조에서는 `User`가 인증과 설문 기본 프로필 저장을 함께 담당한다.
- 2단계는 단위 로직 검증 우선이라 `IllegalArgumentException` 사용이 남아 있을 수 있으며, API 연결 시점(8단계)에서 공통 예외 체계로 정리한다.
- 7단계의 태그 매핑은 설문 보기 문구와 내부 추천 태그를 분리하기 위한 단계이며, `MySkin`에는 매핑된 태그값을 저장한다.
- 서버 실행 및 Postman 전 확인 가이드는 `AIHS/run-guide/spring-server-before-postman.md`에 정리했다.
