# 에이전트 지침서 (AGENTS)

이 문서는 에이전트 사용 정책과 코드 스타일을 정의합니다.

## 정책

- 기본 원칙: 사용자가 "코드수정해줘"라고 말하기 전까지는 어떤 파일도 수정하지 않음.
- 항상 허용되는 작업:
    - 파일/코드 검색, 읽기, 분석, 설계/계획 수립, 제안 작성
    - 성능/아키텍처/리팩터링 아이디어 제시
- 코드 수정 허용 트리거: 사용자가 "코드수정해줘"라고 명시하면 이후부터 수정 가능
    - 선택적으로 범위를 함께 지정할 수 있음. 예) `코드수정해줘 src/pages/Impr.tsx`
    - 범위 미지정 시에도 수정 범위는 현재 작업 루트(`AGENTS.md`가 위치한 폴더) 하위로 제한
- 편집 범위 제한:
    - 현재 작업 루트(`./`) 및 하위 경로만 생성/수정/삭제(write) 허용
    - 작업 루트 밖 경로는 조회(read)만 허용, 편집(write) 금지
    - 작업 루트 밖 편집이 필요하면 반드시 사용자 명시 승인 후 진행
    - 절대경로 편집은 기본 금지(예외: 사용자 승인 시)
- 변경 원칙(수정이 허용된 이후):
    - 기존 코드 스타일과 패턴 준수, 불필요한 설정 변경 금지
    - 영향이 큰 변경은 사전 설명과 동의 후 진행

## 프로젝트 문서

## 스킬 메모

- 백엔드(Java/Spring) 작업 시 아래 스킬을 우선 사용합니다.
    - `java-architect`
    - `spring-boot-engineer`
    - `java-spring-boot`
- 원칙:
    - 아키텍처/패키지 설계는 `java-architect` 우선
    - Spring Boot 구현/보안/계층 패턴은 `spring-boot-engineer` 우선
    - 초기 부트스트랩/템플릿 작업은 `java-spring-boot` 우선

## 명명 규칙 (Java Backend)

- 이 프로젝트의 Java lint 기준은 아래 2개 파일을 기준으로 한다.
    - `checkstyle/naver-checkstyle-rules.xml`
    - `checkstyle/naver-checkstyle-suppressions.xml`
- 강제 규칙:
    - 소스 인코딩은 UTF-8
- 에이전트 작업 지침:
    - 코드 생성/수정 시 아래 명명 규칙을 기본값으로 적용한다.
    - 기존 코드가 규칙과 달라도, 사용자 요청 없이 대규모 리네이밍/정리 작업은 진행하지 않는다.
- 코드 내 일시 억제 주석:
    - `@checkstyle:off` / `@checkstyle:on`
    - 한 줄 억제: `@checkstyle:ignore`

- 패키지명: 전부 소문자 (`com.example.user.service`) (`com.piview.backend.auth`)
- 클래스/인터페이스명: `PascalCase` (`UserService`)
- 메서드명: `camelCase` (`^[a-z][a-z0-9][a-zA-Z0-9_]*$`) (`findById`)
- 멤버 변수명: `camelCase` (`^[a-z][a-zA-Z0-9][a-zA-Z0-9]*$`, `_` 불가) (`userName`)
- 파라미터명: `camelCase` (`^[a-z][a-zA-Z0-9][a-zA-Z0-9]*$`, `_` 불가) (`userId`)
- 로컬 변수명: `camelCase` (`^[a-z][a-zA-Z0-9][a-zA-Z0-9]*$`, `_` 불가, 단 `for` 루프 1글자 변수 허용) (`totalCount`)
- 약어 규칙: 대문자 약어 길이는 기본 1자 이하, 예외 `DAO`, `BO` (`userDAO`)
