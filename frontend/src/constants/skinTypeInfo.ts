/**
 * skinTypeInfo.ts
 * 피부 타입별 진단 결과 텍스트 (라벨 / 이모지 / 인사이트)
 * → UI 고정 콘텐츠이므로 DB 교체 대상 아님
 *
 * 사용처:
 *   - src/app/(onboarding)/skin-test/result/page.tsx → SKIN_TYPE_INFO
 */

export interface SkinTypeInfo {
  label: string;
  emoji: string;
  insight: string;
}

export const SKIN_TYPE_INFO: Record<string, SkinTypeInfo> = {
  dry: {
    label: "건성 피부",
    emoji: "💧",
    insight:
      "수분 장벽이 약한 편이에요. 히알루론산, 세라마이드 성분이 풍부한 제품을 사용하고, 세안 후 바로 수분 크림을 발라 수분을 잠가주세요.",
  },
  oily: {
    label: "지성 피부",
    emoji: "💦",
    insight:
      "피지 분비가 왕성한 편이에요. 가벼운 젤 타입 보습제와 BHA 성분으로 모공을 관리하고, 논코메도제닉 제품을 선택하세요.",
  },
  combination: {
    label: "복합성 피부",
    emoji: "🔀",
    insight:
      "T존과 볼 부위의 특성이 달라요. 부위별로 다른 케어가 효과적이에요. 오일-프리 제품으로 T존을 관리하고 볼에는 충분한 수분을 공급해주세요.",
  },
  dehydrated: {
    label: "수부지 피부",
    emoji: "💧💦",
    insight:
      "피지는 많지만 수분이 부족한 피부예요. 유·수분 밸런스를 맞추는 것이 중요하며, 가벼운 수분 세럼과 오일 프리 크림을 함께 사용하세요.",
  },
};

export const DEFAULT_SKIN_TYPE = SKIN_TYPE_INFO.combination;
