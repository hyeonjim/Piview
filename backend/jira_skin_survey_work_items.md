# 피부 설문/분석 연동 작업 정리

## 작업 단위 1. AI ROI 메타데이터 응답 추가

- 목적
  - 프론트가 얼굴 부위 박스를 직접 표현할 수 있도록 ROI 좌표를 응답에 포함
- 주요 내용
  - AI 응답에 `roi_metadata` 추가
  - 좌표계는 `original_normalized`
  - ROI는 `forehead`, `left_cheek`, `right_cheek`의 `bbox` 형태로 제공
- 관련 커밋
  - `37b42ef` `AI-feat : ROI 메타데이터 응답 추가`

## 작업 단위 2. 피부 분석 결과 Redis 상태 확장

- 목적
  - 비동기 분석 결과를 최종 설문 제출 단계에서 안전하게 재사용
- 주요 내용
  - Redis 분석 상태 문서에 `consumed` 필드 추가
  - `analysisId`별 분석 상태를 `PENDING/COMPLETED/FAILED`로 유지
  - 최종 제출 동시 요청 방지를 위한 Redis 락 추가
  - 분석 미완료/실패/중복 제출용 예외 코드 추가
- 관련 커밋
  - `3126d6f` `BE-feat : 피부 분석 캐시 상태 확장`

## 작업 단위 3. 최종 피부 설문 제출 API 구현

- 목적
  - 설문 응답과 AI 분석 결과를 결합해 최종 피부 타입을 계산
- 주요 내용
  - `POST /api/v1/skin/surveys/{analysisId}` 구현
  - Redis에서 `analysisId` 결과 조회 후 소유권/상태 검증
  - 설문 문항 3~6 점수와 AI 신호를 합산해 `mySkinType` 계산
  - 최종 제출 성공 후 `consumed=true` 처리
- 관련 커밋
  - `4a16545` `BE-feat : 피부 설문 최종 제출 API 및 AI 결과 연동`

## 작업 단위 4. 최종 제출 응답에 AI 결과 가공 포함

- 목적
  - 프론트가 추가 가공 없이 바로 표시 가능한 형태로 AI 결과 전달
- 주요 내용
  - 최종 제출 응답에 `aiResult` 포함
  - raw probability 제거, `display_*` 값만 노출
  - `moisture`는 `cheek_mean_score`와 `state`로 정리
  - `roi_metadata`와 `warnings` 유지
- 관련 커밋
  - `4a16545` `BE-feat : 피부 설문 최종 제출 API 및 AI 결과 연동`

## 작업 단위 5. 피부 고민 입력 매핑 정리

- 목적
  - 문항 7 직접 입력값과 내부 저장 태그를 분리
- 주요 내용
  - 직접 입력 허용값을 아래 9개로 제한
    - `여드름`, `미백`, `피지`, `블랙헤드`, `기미/주근깨/잡티`, `속건조`, `주름/탄력`, `홍조`, `각질`
  - 내부 태그 매핑 정리
    - `기미/주근깨/잡티 -> 색소침착`
    - `주름/탄력 -> 안티에이징`
    - `속건조 -> 수분`
    - `홍조 -> 진정`
  - `40대 이상`은 `안티에이징` 태그 자동 추가
- 관련 커밋
  - `ceed1d5` `BE-fix : 피부 고민 입력 매핑 정리`

## 검증 내역

- `./gradlew.bat compileJava` 통과
- 로컬 도커 백엔드 재기동 후 API 호출 확인
- 실제 검증 흐름
  - `POST /api/v1/skin/analysis/capture`
  - `GET /api/v1/skin/analysis/{analysisId}`
  - `POST /api/v1/skin/surveys/{analysisId}`
- 최종 제출 응답 `200 OK` 확인
