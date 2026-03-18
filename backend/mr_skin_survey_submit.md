# MR 제목

`[BE/AI] 피부 분석 결과 기반 최종 설문 제출 흐름 구현`

## 🔘Part

- [ ] FE
- [x] BE
- [x] AI
- [ ] Infra

## 🔎 작업 내용

- 피부 분석 결과를 Redis에 임시 저장하고, 최종 설문 제출 시 `analysisId` 기준으로 조회하는 흐름을 추가했습니다.
  - 분석 상태 문서에 `consumed` 플래그를 추가했습니다.
  - 같은 `analysisId`에 대한 중복 제출을 막기 위해 Redis 락을 추가했습니다.
  - 분석 미완료, 분석 실패, 중복 제출 등 최종 제출 단계 예외 코드를 추가했습니다.

- 피부 설문 최종 제출 API를 AI 분석 결과와 연동하도록 확장했습니다.
  - `POST /api/v1/skin/surveys/{analysisId}` 형태로 최종 제출 경로를 정리했습니다.
  - 설문 응답과 AI 신호(`global`, `regional`, `moisture`)를 합쳐 최종 피부 타입을 계산하도록 반영했습니다.
  - 문항 7 입력값을 내부 피부 고민 태그로 매핑하고, `40대 이상`은 `안티에이징` 태그를 자동 추가하도록 반영했습니다.

- 최종 제출 응답에 프론트 표시용 AI 결과를 포함하도록 정리했습니다.
  - `global_face`, `regional_skin_type`, `moisture`, `roi_metadata`, `warnings`를 응답에 포함했습니다.
  - raw probability는 제외하고 `display_*` 값만 노출하도록 정리했습니다.
  - 수분 결과는 `cheek_mean_score`와 `state`로 가공해 전달하도록 반영했습니다.

- AI 응답에 ROI 메타데이터를 추가했습니다.
  - 원본 기준 `original_normalized` 좌표계를 사용합니다.
  - `forehead`, `left_cheek`, `right_cheek`의 `bbox`를 응답에 포함합니다.

## 🔧 참고

- 문항 7 직접 입력값은 아래 9개만 허용합니다.
  - `여드름`, `미백`, `피지`, `블랙헤드`, `기미/주근깨/잡티`, `속건조`, `주름/탄력`, `홍조`, `각질`
- 내부 태그 매핑은 아래 기준입니다.
  - `기미/주근깨/잡티 -> 색소침착`
  - `주름/탄력 -> 안티에이징`
  - `속건조 -> 수분`
  - `홍조 -> 진정`
  - `40대 이상 -> 안티에이징` 자동 추가
- 로컬 검증 기준
  - `./gradlew.bat compileJava` 통과
  - `capture -> status -> surveys` 실제 호출 `200 OK` 확인
- 관련 커밋
  - `37b42ef` `AI-feat : ROI 메타데이터 응답 추가`
  - `3126d6f` `BE-feat : 피부 분석 캐시 상태 확장`
  - `4a16545` `BE-feat : 피부 설문 최종 제출 API 및 AI 결과 연동`
  - `ceed1d5` `BE-fix : 피부 고민 입력 매핑 정리`
