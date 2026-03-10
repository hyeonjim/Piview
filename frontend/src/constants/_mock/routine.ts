/**
 * _mock/routine.ts
 * 홈 화면 시간대별 루틴 더미 데이터
 *
 * ⚠️  API 교체 대상
 *     교체 시: 이 파일의 import를 삭제하고
 *              useEffect + api.get("/users/me/routine") 로 대체
 *
 * 사용처:
 *   - src/app/(main)/home/page.tsx → MORNING_STEPS, AFTERNOON_STEPS, EVENING_STEPS, getRoutineInfo
 */

export interface RoutineItem {
  step: number;
  name: string;
  sub:  string;
  icon: string;
}

export interface RoutineInfo {
  label: string;
  emoji: string;
  steps: RoutineItem[];
}

export const MORNING_STEPS: RoutineItem[] = [
  { step:1, name:"클렌저",   sub:"Gentle Cleanser",   icon:"🫧" },
  { step:2, name:"토너",     sub:"Hydrating Toner",   icon:"💧" },
  { step:3, name:"세럼",     sub:"Vitamin C Serum",   icon:"✨" },
  { step:4, name:"크림",     sub:"Moisturizer",       icon:"🤍" },
  { step:5, name:"선크림",   sub:"SPF 50+",           icon:"☀️" },
];

export const AFTERNOON_STEPS: RoutineItem[] = [
  { step:1, name:"미스트",   sub:"Hydrating Mist",    icon:"💦" },
  { step:2, name:"선크림",   sub:"SPF 50+ 덧바르기",  icon:"☀️" },
  { step:3, name:"립밤",     sub:"Lip Moisturizer",   icon:"💋" },
];

export const EVENING_STEPS: RoutineItem[] = [
  { step:1, name:"클렌징",   sub:"Oil / Balm Cleanser",     icon:"🧴" },
  { step:2, name:"폼클렌저", sub:"Foam Cleanser",           icon:"🫧" },
  { step:3, name:"토너",     sub:"Calming Toner",           icon:"💧" },
  { step:4, name:"세럼",     sub:"Retinol / Repair Serum",  icon:"✨" },
  { step:5, name:"나이트크림",sub:"Night Cream",             icon:"🌙" },
];

/** 현재 시간 기준 루틴 정보 반환 */
export function getRoutineInfo(): RoutineInfo {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return { label:"Morning",   emoji:"☀️", steps: MORNING_STEPS   };
  if (h >= 12 && h < 18) return { label:"Afternoon",  emoji:"🌤️", steps: AFTERNOON_STEPS };
  return                         { label:"Evening",   emoji:"🌙", steps: EVENING_STEPS   };
}
