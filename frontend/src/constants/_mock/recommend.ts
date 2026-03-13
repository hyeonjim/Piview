/**
 * _mock/recommend.ts
 * 추천 페이지 더미 제품 데이터
 *
 * ⚠️ API 교체 대상
 *    교체 시: recommendService.getPersonalized() 로 대체
 *
 * 사용처:
 *   - src/app/(main)/recommend/page.tsx
 */

export interface RecommendProduct {
  id:         string;
  brand:      string;
  name:       string;
  category:   string;
  emoji:      string;
  skinTypes:  string[];
  effects:    string[];
  reason:     string;
  matchScore: number;
}

export const MOCK_RECOMMEND: RecommendProduct[] = [
  { id:"r1",  brand:"샘앤선",     name:"[TROUBLE HATER] 핑크 파우더 토너",  category:"스킨/토너",        emoji:"💧", skinTypes:["수부지","지성"],  effects:["여드름","미백","안티에이징"],       reason:"복합성 피부에도 사용 가능하며, 특정 고민 해결에 도움을 줄 수 있는 제품이에요. 자극 성분 없이 안전하게 사용 가능합니다.",  matchScore:89 },
  { id:"r2",  brand:"미샤",       name:"[니어스킨] 트러블컷 프레시 토너",   category:"스킨/토너",        emoji:"💦", skinTypes:["지성","복합성"],  effects:["여드름","피지","블랙헤드","진정"],  reason:"복합성 피부에도 사용 가능하며, 특정 고민 해결에 도움을 줄 수 있는 제품이에요. 자극 성분 없이 안전하게 사용 가능합니다.",  matchScore:88 },
  { id:"r3",  brand:"아누아",     name:"어성초 77 토너",                     category:"스킨/토너",        emoji:"🌿", skinTypes:["지성","복합성"],  effects:["여드름","피지","진정"],             reason:"피지 조절에 탁월하며 어성초 성분이 피부 진정에 도움을 줍니다.",                                                          matchScore:92 },
  { id:"r4",  brand:"이니스프리",  name:"그린티 씨드 세럼",                   category:"에센스/앰플/세럼", emoji:"🌱", skinTypes:["건성","복합성"],  effects:["수분","영양"],                     reason:"제주 그린티 성분이 피부 수분을 오래 유지시켜 드립니다.",                                                                  matchScore:88 },
  { id:"r5",  brand:"코스알엑스",  name:"달팽이 뮤신 96 에센스",              category:"에센스/앰플/세럼", emoji:"✨", skinTypes:["복합성","건성"],  effects:["수분","안티에이징","진정"],         reason:"달팽이 뮤신 96%로 피부 재생과 보습에 탁월한 효과를 발휘합니다.",                                                          matchScore:95 },
  { id:"r6",  brand:"피지오겔",   name:"AI 크림",                            category:"크림",             emoji:"🤍", skinTypes:["건성","건성"],  effects:["수분","진정","아토피"],             reason:"건성 피부를 위한 저자극 크림으로 장벽 강화에 도움을 줍니다.",                                                          matchScore:90 },
  { id:"r7",  brand:"아누아",     name:"어성초 선크림 SPF50+",               category:"선크림",           emoji:"☀️", skinTypes:["지성","복합성"],  effects:["피지","진정"],                     reason:"지성 피부에 적합한 가벼운 텍스처로 백탁 현상이 없습니다.",                                                               matchScore:91 },
  { id:"r8",  brand:"라운드랩",   name:"독도 토너",                          category:"스킨/토너",        emoji:"💦", skinTypes:["건성","건성"],  effects:["수분","진정"],                     reason:"독도 해양 심층수 성분이 피부 장벽을 강화하고 수분을 공급합니다.",                                                         matchScore:87 },
  { id:"r9",  brand:"세타필",     name:"모이스처라이징 크림",                category:"크림",             emoji:"🤍", skinTypes:["건성","건성"],  effects:["수분","영양"],                     reason:"건성·건성 피부를 위한 오랜 베스트셀러로 자극 없이 촉촉하게 유지됩니다.",                                               matchScore:85 },
  { id:"r10", brand:"아벤느",     name:"시카렉트 B5 리페어링 크림",          category:"크림",             emoji:"🌿", skinTypes:["건성","건성"],  effects:["진정","수분","아토피"],             reason:"병풀과 판테놀 성분이 손상된 피부 장벽 회복을 도와줍니다.",                                                               matchScore:88 },
  { id:"r11", brand:"라로슈포제", name:"시카플라스트 밤 B5",                 category:"크림",             emoji:"💚", skinTypes:["건성"],          effects:["진정","수분"],                     reason:"민감하고 건조한 피부의 집중 케어에 적합한 배리어 크림입니다.",                                                            matchScore:86 },
  { id:"r12", brand:"이니스프리", name:"톤업 노세범 미네랄 선크림 50ml",     category:"선크림",           emoji:"☀️", skinTypes:["지성"],            effects:["피지"],                            reason:"지성 피부의 피지 조절과 UV 차단을 동시에 해결합니다.",                                                                   matchScore:83 },
];
