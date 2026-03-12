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

- 백엔드 API는 프론트엔드와의 협업을 위해 항상 일관된 JSON 응답 계약을 유지해야 하며, 공통 응답 및 예외 처리 방식은 아래 규약을 기준으로 통일한다.

### 공통 API 응답 & 예외 처리 규약

- 아래 공통 API 응답 및 예외 처리 규약은 백엔드 작업 시 반드시 준수한다.
- 성공 응답은 Controller 계층에서 `ResponseEntity`를 직접 반환하지 않고 반드시 `ApiResponse.success(...)` 형태를 사용한다.
- 반환 데이터가 있으면 `ApiResponse.success(data)`를 사용한다.
- 반환 데이터가 없으면 `ApiResponse.success()` 또는 `ApiResponse.success(message, null)`를 사용한다.
- 비즈니스 로직 실패는 Service 계층에서 `CustomException`을 `throw` 하여 처리하고, 예외 응답 변환은 `GlobalExceptionHandler`에 위임한다.
- Controller에서 성공/실패 응답 포맷을 제각각 직접 조립하거나, 예외를 `try-catch`로 삼켜서 임의 JSON을 반환하지 않는다.
- 새로운 예외 상황이 필요하면 프로젝트의 공통 예외 처리 체계를 우선 따른다.
- 새로운 비즈니스 예외가 필요할 때는 예외 클래스를 임의로 늘리지 말고 `ErrorCode`에 추가하여 `CustomException`으로 처리한다.
- 새로운 케이스가 필요하면 기존 공통 예외 처리 클래스를 그대로 사용하면서 `ErrorCode`에 상태 코드와 클라이언트에게 보여줄 구체적인 메시지를 추가하는 방식으로 커스텀한다.
- 클라이언트 입력값 검증은 Request DTO의 Bean Validation 어노테이션과 `@Valid`를 우선 사용한다.
- 검증 실패 응답 포맷은 공통 예외 처리 규약을 따르며, Controller에서 동일 검증 로직을 중복 구현하지 않는다.
- 아래 클래스들은 현재 공통 응답/예외 처리 규약의 기준 구현으로 간주한다.
    - `src/main/java/com/piview/backend/global/exception/ApiResponse.java`
    - `src/main/java/com/piview/backend/global/exception/CustomException.java`
    - `src/main/java/com/piview/backend/global/exception/ErrorCode.java`
    - `src/main/java/com/piview/backend/global/exception/GlobalExceptionHandler.java`
- 새로 작성하는 공통 API 응답과 비즈니스 예외 처리 코드는 위 구현을 우선 사용하고, 기존 계약을 깨지 않는 방향으로 맞춘다.
- 필요한 예외 메시지는 `ErrorCode`를 통해 케이스별로 구체화한다. 예: `해당 상품을 찾을 수 없습니다.`, `상품의 재고가 부족합니다.`
- 구조 변경이나 공통 예외 처리 리팩터링이 필요하면 기존 계약을 유지하는 범위에서 신중히 진행한다.
- 기존 구현을 수정할 때는 주변 코드와 계약을 우선 맞추고, 대규모 구조 변경은 사용자 요청이나 명확한 필요가 있을 때만 진행한다.

## 스킬 메모

- 백엔드(Java/Spring) 작업 시 공통 API 응답 및 예외 처리 규약 외의 일반적인 구현, 설계, 구조화 작업에서는 아래 스킬을 우선 참고한다.
    - `java-architect`
    - `spring-boot-engineer`
    - `java-spring-boot`
- 원칙:
    - 아키텍처/패키지 설계는 `java-architect`를 우선 참고한다.
    - Spring Boot 구현/보안/계층 패턴은 `spring-boot-engineer`를 우선 참고한다.
    - 초기 부트스트랩/템플릿 작업은 `java-spring-boot`를 우선 참고한다.
    - 단, 공통 API 응답 및 예외 처리 규약과 충돌하는 경우에는 규약을 우선 적용한다.

## 명명 규칙 (Java Backend)

- 이 프로젝트의 Java lint 기준은 아래 2개 파일을 기준으로 한다.
    - `checkstyle/naver-checkstyle-rules.xml`
    - `checkstyle/naver-checkstyle-suppressions.xml`

- 패키지명: 전부 소문자 (`com.piview.backend.auth`)
- 클래스/인터페이스명: `PascalCase` (`UserService`)
- 메서드명: `camelCase` (`findById`)
- 멤버 변수명: `camelCase` (`userName`)
- 파라미터명: `camelCase`  (`userId`)
- 로컬 변수명: `camelCase` (단 `for` 루프 1글자 변수 허용) (`totalCount`)
- 약어 규칙: 대문자 약어 길이는 기본 1자 이하, 예외 `DAO`, `BO` (`userDAO`)

## 패키지 구조 가이드

- 현재 백엔드 패키지 구조는 아직 최종 확정 상태는 아니다.
- 다만 기능 위주의 폴더 구조를 기준으로 작업하며, 새 기능 추가나 구조 설계 시 아래 구조를 우선 차용한다.
- 실제 구현 시에는 기존 코드베이스 구조와 인접 패키지 패턴을 함께 고려한다.

```text
com.piview.backend
  global
    config
    exception
    security
    common

  auth
    controller
    service
    repository
    entity
    dto
      request
      response

  user
    profile
      controller
      service
      repository
      entity
      dto
        request
        response
    disliked
      controller
      service
      repository
      entity
      dto
        request
        response

  skin
    survey
      controller
      service
      repository
      entity
      dto
        request
        response
    analysis
      controller
      service
      repository
      entity
      dto
        request
        response

  product
    catalog
      controller
      service
      repository
      entity
      dto
        request
        response
    ingredient
      service
      repository
      entity
      dto
        response
    like
      controller
      service
      repository
      entity
      dto
        request
        response
    compare
      controller
      service
      dto
        request
        response

  routine
    core
      controller
      service
      repository
      entity
      dto
        request
        response
    item
      controller
      service
      repository
      entity
      dto
        request
        response
    main
      controller
      service
    recommendation
      controller
      service
      dto
        request
        response

  ocr
    recognition
      controller
      service
      dto
        request
        response
    registration
      controller
      service
      repository
      entity
      dto
        request
        response
```
