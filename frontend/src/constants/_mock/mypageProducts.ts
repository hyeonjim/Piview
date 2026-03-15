/**
 * _mock/mypageProducts.ts
 * 마이페이지 루틴 스텝 추천 제품 더미 데이터
 *
 * ⚠️ API 교체 대상
 *    교체 시: productService.getRecommendedByStep(stepCode) 로 대체
 *
 * 사용처:
 *   - src/app/(main)/mypage/page.tsx → STEP_PRODUCTS
 */
import { LocalProduct } from "@/stores/useLocalRoutineStore";

/** 스텝별 추천 제품 목록 */
export const STEP_PRODUCTS: LocalProduct[] = [
  { id:"c1",  brand:"아벤느",     name:"클린스 포밍 젤",                   category:"클렌저",        emoji:"🫧", skinTypes:["건성"],        effects:["진정","수분"],                   matchScore:78 },
  { id:"c2",  brand:"세타필",     name:"젠틀 스킨 클렌저",                 category:"폼/젤/밤/오일", emoji:"🧴", skinTypes:["건성","건성"],  effects:["수분","진정"],                   matchScore:82 },
  { id:"t1",  brand:"아누아",     name:"어성초 77 토너",                   category:"스킨/토너",     emoji:"💧", skinTypes:["지성","복합성"],  effects:["여드름","피지","진정"],           matchScore:92 },
  { id:"t2",  brand:"미샤",       name:"[니어스킨] 트러블컷 프레시 토너", category:"스킨/토너",     emoji:"💦", skinTypes:["지성","복합성"],  effects:["여드름","피지","블랙헤드","진정"],matchScore:88 },
  { id:"t3",  brand:"피터스",     name:"0.5% 바하토너",                   category:"스킨/토너",     emoji:"🌊", skinTypes:["지성","수부지"],  effects:["여드름","미백","피지","블랙헤드"],matchScore:85 },
  { id:"t4",  brand:"라운드랩",   name:"1025 독도 토너",                  category:"스킨/토너",     emoji:"🌿", skinTypes:["건성","건성"],  effects:["수분","진정"],                   matchScore:87 },
  { id:"s1",  brand:"코스알엑스",  name:"달팽이 뮤신 96 에센스",           category:"세럼/에센스",   emoji:"✨", skinTypes:["복합성","건성"],  effects:["수분","안티에이징","진정"],       matchScore:95 },
  { id:"s2",  brand:"이니스프리",  name:"그린티 씨드 세럼",                category:"세럼",          emoji:"🌱", skinTypes:["건성","복합성"],  effects:["수분","영양"],                   matchScore:88 },
  { id:"s3",  brand:"넘버즈인",   name:"1번 비타민C 세럼",                 category:"세럼",          emoji:"🍋", skinTypes:["건성"],           effects:["미백","색소침착","안티에이징"],   matchScore:83 },
  { id:"cr1", brand:"피지오겔",   name:"AI 크림",                         category:"크림",          emoji:"🤍", skinTypes:["건성","건성"],  effects:["수분","진정","아토피"],           matchScore:90 },
  { id:"cr2", brand:"이니스프리",  name:"그린티 씨드 크림",                category:"크림",          emoji:"💚", skinTypes:["건성","복합성"],  effects:["수분","영양"],                   matchScore:86 },
  { id:"sc1", brand:"아누아",     name:"어성초 선크림 SPF50+",             category:"선크림",        emoji:"☀️", skinTypes:["지성","복합성"],  effects:["피지","진정"],                   matchScore:91 },
  { id:"sc2", brand:"라로슈포제", name:"안티헬리오스 XL SPF50+",           category:"선크림",        emoji:"🌤️", skinTypes:["건성"],         effects:["진정"],                          matchScore:86 },
];
