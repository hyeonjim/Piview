/**
 * 🔧 _mock/recommend.ts
 * 🔧 추천 페이지 더미 제품 데이터 — 임시 하드코딩, 실제 데이터 아님
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
  // EWG 성분 안전도 — ⚠️ API 연동 시 서버 값으로 교체
  ewgSafe:    number;
  ewgCaution: number;
  ewgDanger:  number;
}

// 🔧 추천 제품 목업 — ⚠️ API 연동 시 삭제
export const MOCK_RECOMMEND: RecommendProduct[] = [
  { id:"s2",  brand:"라운드랩",   name:"1025 독도 토너",                    category:"스킨/토너",        emoji:"🌊", skinTypes:["건성"],          effects:["수분","진정"],                    reason:"독도 해양 심층수 성분이 피부 장벽을 강화하고 수분을 공급합니다.",                                                         matchScore:87, ewgSafe:20, ewgCaution:3, ewgDanger:0 },
  { id:"s1",  brand:"아누아",     name:"어성초 77 토너",                    category:"스킨/토너",        emoji:"💧", skinTypes:["지성","복합성"],  effects:["여드름","피지","진정"],            reason:"피지 조절에 탁월하며 어성초 성분이 피부 진정에 도움을 줍니다.",                                                          matchScore:92, ewgSafe:18, ewgCaution:4, ewgDanger:1 },
  { id:"s3",  brand:"코스알엑스",  name:"달팽이 뮤신 96 에센스",             category:"에센스/앰플/세럼", emoji:"✨", skinTypes:["복합성","건성"],  effects:["수분","안티에이징","진정"],        reason:"달팽이 뮤신 96%로 피부 재생과 보습에 탁월한 효과를 발휘합니다.",                                                          matchScore:95, ewgSafe:22, ewgCaution:2, ewgDanger:0 },
  { id:"s4",  brand:"이니스프리",  name:"그린티 씨드 세럼",                  category:"에센스/앰플/세럼", emoji:"🌿", skinTypes:["건성","복합성"],  effects:["수분","영양"],                    reason:"제주 그린티 성분이 피부 수분을 오래 유지시켜 드립니다.",                                                                  matchScore:88, ewgSafe:19, ewgCaution:5, ewgDanger:2 },
  { id:"s8",  brand:"피지오겔",   name:"AI 크림",                           category:"크림",             emoji:"🤍", skinTypes:["건성"],          effects:["수분","진정","아토피"],           reason:"건성 피부를 위한 저자극 크림으로 장벽 강화에 도움을 줍니다.",                                                          matchScore:90, ewgSafe:21, ewgCaution:3, ewgDanger:0 },
  { id:"s11", brand:"아누아",     name:"어성초 선크림 SPF50+",               category:"선크림/스틱",      emoji:"☀️", skinTypes:["지성","복합성"],  effects:["피지","진정"],                    reason:"지성 피부에 적합한 가벼운 텍스처로 백탁 현상이 없습니다.",                                                               matchScore:91, ewgSafe:16, ewgCaution:7, ewgDanger:2 },
  { id:"s7",  brand:"클라랩",     name:"119 스마트 시카 패드",               category:"패드",             emoji:"🍃", skinTypes:["지성","복합성"],  effects:["여드름","안티에이징","진정"],      reason:"병풀 추출물이 트러블을 진정시키고 피부 결을 정돈해줍니다.",                                                               matchScore:85, ewgSafe:16, ewgCaution:5, ewgDanger:1 },
  { id:"s5",  brand:"넘버즈인",   name:"1번 비타민C 세럼",                  category:"에센스/앰플/세럼", emoji:"🍋", skinTypes:["건성"],          effects:["미백","색소침착","안티에이징"],    reason:"고농도 비타민C로 피부 톤을 밝히고 안티에이징 케어를 도와줍니다.",                                                          matchScore:83, ewgSafe:15, ewgCaution:6, ewgDanger:2 },
  { id:"s9",  brand:"아벤느",     name:"클린스 포밍 젤",                    category:"폼/젤/밤/오일",    emoji:"🫧", skinTypes:["건성"],          effects:["진정","수분"],                    reason:"건성 피부를 위한 저자극 클렌저로 세안 후 당김이 없습니다.",                                                               matchScore:78, ewgSafe:18, ewgCaution:4, ewgDanger:1 },
  { id:"s10", brand:"세타필",     name:"젠틀 스킨 클렌저",                  category:"폼/젤/밤/오일",    emoji:"🧴", skinTypes:["건성"],          effects:["수분","진정"],                    reason:"건성 피부를 위한 오랜 베스트셀러로 자극 없이 촉촉하게 유지됩니다.",                                                          matchScore:82, ewgSafe:12, ewgCaution:3, ewgDanger:0 },
  { id:"s12", brand:"라로슈포제", name:"안티헬리오스 XL SPF50+",             category:"선크림/스틱",      emoji:"🌤️",skinTypes:["건성"],          effects:["진정"],                           reason:"민감하고 건조한 피부의 집중 케어에 적합한 배리어 선크림입니다.",                                                            matchScore:86, ewgSafe:18, ewgCaution:8, ewgDanger:3 },
  { id:"s6",  brand:"메디힐",     name:"티트리 케어 솔루션 에센셜 마스크팩", category:"에센스/앰플/세럼", emoji:"🌱", skinTypes:["지성"],          effects:["여드름","피지","진정"],            reason:"지성 피부의 피지 조절과 트러블 케어를 동시에 해결합니다.",                                                                   matchScore:80, ewgSafe:17, ewgCaution:4, ewgDanger:1 },
];
