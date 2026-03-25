/**
 * hooks/queries/useSyncRoutineDraft.ts
 *
 * ⚠️ DEPRECATED — 루틴 API 연동 완료로 이 훅은 더 이상 사용되지 않습니다.
 *
 * 이전에는 localRoutine(localStorage)을 구독하여 PUT /api/v1/routines/draft를
 * 자동으로 호출하는 사이드이펙트 훅이었습니다.
 *
 * 현재는 useRoutineQueries.ts의 useSyncDraftMutation으로 대체되었습니다:
 *   - 드래그 순서 변경 → useSyncDraftMutation (PUT)
 *   - 단일 제품 추가  → useAddDraftItemMutation (POST)
 *   - 단일 제품 삭제  → useRemoveProductFromDraftMutation (DELETE)
 *   - 전체 초기화    → useClearDraftMutation (DELETE)
 */

// 이 파일은 삭제 예정입니다. import 참조가 없으면 제거하세요.
export {};
