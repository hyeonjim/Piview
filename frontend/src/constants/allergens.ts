/**
 * allergens.ts
 * 식약처(MFDS) 고시 알레르기 유발 성분 목록
 * 출처: 화장품 안전기준 등에 관한 규정
 */

export const MFDS_ALLERGEN_INGREDIENTS: { name: string; cas: string }[] = [
  { name: "아밀신남알",           cas: "122-40-7"    },
  { name: "벤질알코올",           cas: "100-51-6"    },
  { name: "신나밀알코올",         cas: "104-54-1"    },
  { name: "시트랄",               cas: "5392-40-5"   },
  { name: "유제놀",               cas: "97-53-0"     },
  { name: "하이드록시시트로넬알", cas: "107-75-5"    },
  { name: "아이소유제놀",         cas: "97-54-1"     },
  { name: "아밀신나밀알코올",     cas: "101-85-9"    },
  { name: "벤질살리실레이트",     cas: "118-58-1"    },
  { name: "신남알",               cas: "104-55-2"    },
  { name: "쿠마린",               cas: "91-64-5"     },
  { name: "제라니올",             cas: "106-24-1"    },
  { name: "아니스알코올",         cas: "105-13-5"    },
  { name: "벤질신나메이트",       cas: "103-41-3"    },
  { name: "파네솔",               cas: "4602-84-0"   },
  { name: "부틸페닐메틸프로피오날", cas: "80-54-6"   },
  { name: "리날룰",               cas: "78-70-6"     },
  { name: "벤질벤조에이트",       cas: "120-51-4"    },
  { name: "시트로넬올",           cas: "106-22-9"    },
  { name: "헥실신남알",           cas: "101-86-0"    },
  { name: "리모넨",               cas: "5989-27-5"   },
  { name: "메틸 2-옥티노에이트",  cas: "111-12-6"    },
  { name: "알파-아이소메틸아이오논", cas: "127-51-5" },
  { name: "참나무이끼추출물",     cas: "90028-68-5"  },
  { name: "나무이끼추출물",       cas: "90028-67-4"  },
];

/** 빠른 조회용 Set (소문자·공백 정규화) */
export const MFDS_ALLERGEN_SET: Set<string> = new Set(
  MFDS_ALLERGEN_INGREDIENTS.map((a) => a.name.replace(/\s/g, "").toLowerCase())
);

/** 주어진 성분명이 식약처 알레르기 성분에 해당하는지 판별 */
export function isAllergenIngredient(ingredientName: string): boolean {
  const normalized = ingredientName.replace(/\s/g, "").toLowerCase();
  if (MFDS_ALLERGEN_SET.has(normalized)) return true;
  for (const allergen of MFDS_ALLERGEN_SET) {
    if (normalized.includes(allergen) || allergen.includes(normalized)) return true;
  }
  return false;
}
