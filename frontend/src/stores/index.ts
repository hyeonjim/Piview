/**
 * stores/index.ts
 * 스토어 일괄 export + reset 레지스트리
 *
 * storeResets: 로그아웃/세션 만료 시 clearAllStores()에서 일괄 호출
 * store가 추가되면 여기에 reset 함수를 등록할 것
 */

import { useUserStore } from "./useUserStore";
import { useSearchStore } from "./useSearchStore";
import { useRecommendStore } from "./useRecommendStore";
import { useLikeStore } from "./useLikeStore";
import { useRoutineStore } from "./useRoutineStore";

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
export { useChatbotStore } from "./useChatbotStore";
export type { ChatMessage } from "./useChatbotStore";

/** 로그아웃/세션 만료 시 초기화할 store reset 함수 목록 */
export const storeResets: Array<() => void> = [
  () => useUserStore.getState().clearUser(),
  () => useSearchStore.getState().setSearchQuery(""),
  () => useSearchStore.getState().resetFilter(),
  () => useRecommendStore.getState().resetPage(),
  () => useLikeStore.getState().initFromServer([]),
  () => useLikeStore.getState().setPage(1),
  () => useRoutineStore.getState().clearRecommendedProducts(),
];
