/**
 * stores/index.ts
 * 스토어 일괄 export
 */

export {
  useUserStore,
  selectSkinType,
  selectGender,
  selectUserName,
  selectAccessToken,
} from "./useUserStore";

export {
  useRoutineStore,
  selectConflicts,
  selectMissingSteps,
  selectRoutineCount,
  selectLocalRoutine,
  selectIsMainRoutine,
  selectCurrentRoutineName,
  selectSavedRoutines,
} from "./useRoutineStore";

// 타입 re-export (기존 import 경로 유지)
export type {
  LocalProduct,
  LocalRoutineMap,
  SavedRoutine,
  RoutineStepMeta,
} from "./useRoutineStore";
export { ROUTINE_STEP_META } from "./useRoutineStore";

export { useFilterStore, selectActiveFilterCount } from "./useFilterStore";
export { useSurveyStore } from "./useSurveyStore";
export { useOwnedStore } from "./useOwnedStore";
export { useLikeStore } from "./useLikeStore";
