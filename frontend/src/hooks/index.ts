/**
 * hooks/index.ts
 * 훅 일괄 export — 외부에서는 항상 @/hooks 에서 import
 *
 * 순수 UI 훅
 */

export { useCompare } from "./useCompare";
export {
  useDislikedProductsQuery,
  useAddDislikedProduct,
  useRemoveDislikedProduct,
} from "./queries/useDislikedProducts";

// TanStack Query / 스토어 래퍼 훅 (queries/ 폴더)
export { useUserQuery } from "./queries/useUserQuery";
export { useLike, useLikedProducts, useToggleLike } from "./queries/useLike";
export { useMyCosQuery, useMyCosWithTags, useAddMyCos, useRemoveMyCos } from "./queries/useMyCos";
export { useProductSearch } from "./queries/useProductSearch";
export { useProductDetail } from "./queries/useProductDetail";
export { useProductFilters } from "./queries/useProductFilters";
export { useProductCompare } from "./queries/useProductCompare";
export { useSurveySubmit } from "./queries/useSurveySubmit";
export { useOcr } from "./queries/useOcr";
export {
  useCaptureAnalysis,
  useAnalysisStatus,
} from "./queries/useSkinAnalysis";

// 루틴 쿼리 훅
export {
  useDraftQuery,
  useRoutineListQuery,
  useMainRoutineQuery,
  useRoutineDetailQuery,
  useAddDraftItemMutation,
  useSyncDraftMutation,
  useClearDraftMutation,
  useRemoveProductFromDraftMutation,
  useCreateRoutineMutation,
  useSetMainRoutineMutation,
  useDeleteRoutineMutation,
  useLoadRoutineToDraftMutation,
  useUpdateRoutineMutation,
} from "./queries/useRoutineQueries";
