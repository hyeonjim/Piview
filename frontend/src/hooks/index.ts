/**
 * hooks/index.ts
 * 훅 일괄 export — 외부에서는 항상 @/hooks 에서 import
 *
 * 순수 UI 훅
 */

export { useToast } from "./useToast";
export { useScroll } from "./useScroll";
export { useCompare } from "./useCompare";

// TanStack Query / 스토어 래퍼 훅 (queries/ 폴더)
export { useLike } from "./queries/useLike";
export { useSyncRoutineDraft } from "./queries/useSyncRoutineDraft";
export { useMyCosQuery, useAddMyCos, useRemoveMyCos } from "./queries/useMyCos";
export { useProductSearch } from "./queries/useProductSearch";
export { useSurveySubmit } from "./queries/useSurveySubmit";
export { useOcr } from "./queries/useOcr";

// 루틴 쿼리 훅
export {
  useDraftQuery,
  useRoutineListQuery,
  useMainRoutineQuery,
  useRoutineDetailQuery,
  useClearDraftMutation,
  useRemoveProductFromDraftMutation,
  useCreateRoutineMutation,
  useSetMainRoutineMutation,
  useUpdateRoutineOrderMutation,
  useDeleteRoutineMutation,
} from "./queries/useRoutineQueries";
