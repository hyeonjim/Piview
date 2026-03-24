/**
 * userSettings.ts
 * 설정 페이지 피부타입·고민·알러지 선택지
 * (피그마 figma/data/constants.ts 에서 이관)
 *
 * 사용처:
 *   - src/app/(main)/mypage/settings/page.tsx
 */

/** 설정 페이지 피부타입 (id = 한글 레이블, settings에서 직접 저장) */
export const SETTINGS_SKIN_TYPES = [
  { id: "건성",  label: "건성"  },
  { id: "지성",  label: "지성"  },
  { id: "복합성",label: "복합성"},
  { id: "수부지",label: "수부지"},
] as const;

/** 설정 페이지 피부 고민 — 백엔드 SkinProblemMapper 키값과 일치 */
export const SETTINGS_SKIN_CONCERNS = [
  { id: "acne",         label: "여드름"          },
  { id: "whitening",    label: "미백"            },
  { id: "pigmentation", label: "기미/주근깨/잡티" },
  { id: "wrinkles",     label: "주름/탄력"       },
  { id: "sebum",        label: "피지"            },
  { id: "blackhead",    label: "블랙헤드"        },
  { id: "innerDryness", label: "속건조"          },
  { id: "redness",      label: "홍조"            },
  { id: "keratin",      label: "각질"            },
] as const;

/** 설정 페이지 알러지·기피 성분 */
export const SETTINGS_ALLERGIES = [
  { id: "fragrance",    label: "향료"            },
  { id: "alcohol",      label: "알코올"          },
  { id: "paraben",      label: "파라벤"          },
  { id: "sulfate",      label: "설페이트(SLS)"   },
  { id: "silicone",     label: "실리콘"          },
  { id: "mineral-oil",  label: "미네랄 오일"     },
  { id: "essential-oil",label: "에센셜 오일"     },
  { id: "retinol",      label: "레티놀"          },
  { id: "aha-bha",      label: "AHA/BHA"         },
  { id: "niacinamide",  label: "나이아신아마이드" },
] as const;
