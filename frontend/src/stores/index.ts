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

export { useRoutineStore } from "./useRoutineStore";

export { useSurveyStore } from "./useSurveyStore";
export { useLikeStore } from "./useLikeStore";
export { useSearchStore } from "./useSearchStore";
export { useRecommendStore } from "./useRecommendStore";
