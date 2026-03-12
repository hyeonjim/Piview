/**
 * _mock/products.ts  ⚠️ API 교체 대상
 */

export interface SearchProduct {
  id: number; brand: string; name: string; category: string;
  categoryShort: string; skinTypes: string[]; effects: string[]; desc: string;
}

export const MOCK_SEARCH_PRODUCTS: SearchProduct[] = [
  { id:1,  brand:"타가",      name:"(리뚤존식이 에디션) 아쿠아 토너",     category:"스킨/토너",        categoryShort:"ST", skinTypes:["지성","복합성"], effects:["여드름","미백","안티에이징"],       desc:"" },
  { id:2,  brand:"생앤선",    name:"[TROUBLE HATER] 핑크 파우더 토너",    category:"스킨/토너",        categoryShort:"ST", skinTypes:["수부지","지성"],  effects:["여드름","미백"],                    desc:"" },
  { id:3,  brand:"미샤",      name:"[니어스킨] 트러블컷 프레시 토너",     category:"스킨/토너",        categoryShort:"ST", skinTypes:["지성","복합성"], effects:["여드름","피지","블랙헤드","진정"],   desc:"" },
  { id:4,  brand:"피터스",    name:"0.5% 바하토너",                        category:"스킨/토너",        categoryShort:"ST", skinTypes:["지성","수부지"],  effects:["여드름","피지"],                    desc:"" },
  { id:5,  brand:"반도",      name:"082 어성초 토너",                       category:"스킨/토너",        categoryShort:"ST", skinTypes:["수부지","지성"],  effects:["진정","여드름"],                    desc:"" },
  { id:6,  brand:"라운드랩",  name:"1025 독도 토너",                        category:"스킨/토너",        categoryShort:"ST", skinTypes:["수부지","지성"],  effects:["수분","진정"],                      desc:"" },
  { id:7,  brand:"라운드랩",  name:"1025 독도 패드",                        category:"패드",             categoryShort:"PD", skinTypes:["수부지","지성"],  effects:["수분","진정"],                      desc:"" },
  { id:8,  brand:"타가",      name:"109 토너",                              category:"스킨/토너",        categoryShort:"ST", skinTypes:["수부지","지성"],  effects:["수분"],                             desc:"" },
  { id:9,  brand:"생앤선",    name:"119 스마트 시카 패드",                  category:"패드",             categoryShort:"PD", skinTypes:["지성","복합성"], effects:["여드름","안티에이징","진정"],        desc:"" },
  { id:10, brand:"미샤",      name:"180 AHA 페이셜 필 앤 토닝 패드",       category:"패드",             categoryShort:"PD", skinTypes:["지성"],           effects:["각질케어","미백"],                  desc:"" },
  { id:11, brand:"아누아",    name:"어성초 77 토너 300ml",                  category:"스킨/토너",        categoryShort:"ST", skinTypes:["지성","복합성"], effects:["진정","피지"],                      desc:"" },
  { id:12, brand:"코스알엑스", name:"달팽이 뮤신 96 에센스",                category:"에센스/앰플/세럼", categoryShort:"SR", skinTypes:["복합성","건성"],  effects:["수분","안티에이징","진정"],          desc:"" },
  { id:13, brand:"이니스프리", name:"그린티 씨드 세럼 80ml",                category:"에센스/앰플/세럼", categoryShort:"SR", skinTypes:["건성","복합성"],  effects:["수분","영양"],                      desc:"" },
  { id:14, brand:"넘버즈인",  name:"1번 비타민C 세럼",                      category:"에센스/앰플/세럼", categoryShort:"SR", skinTypes:["건성","복합성"],  effects:["미백","안티에이징"],                desc:"" },
  { id:15, brand:"피지오겔",  name:"AI 크림 200ml",                         category:"크림",             categoryShort:"CR", skinTypes:["민감성","건성"],  effects:["수분","진정","아토피"],             desc:"" },
  { id:16, brand:"아벤느",    name:"시카렉트 B5 리페어링 크림",             category:"크림",             categoryShort:"CR", skinTypes:["민감성","건성"],  effects:["진정","수분","아토피"],             desc:"" },
  { id:17, brand:"라로슈포제", name:"시카플라스트 밤 B5",                   category:"크림",             categoryShort:"CR", skinTypes:["민감성"],          effects:["진정","수분"],                      desc:"" },
  { id:18, brand:"세타필",    name:"모이스처라이징 크림",                   category:"크림",             categoryShort:"CR", skinTypes:["건성","민감성"],  effects:["수분","영양"],                      desc:"" },
  { id:19, brand:"아누아",    name:"어성초 선크림 SPF50+ PA++++",           category:"선크림",           categoryShort:"SC", skinTypes:["지성","복합성"], effects:["피지","진정"],                      desc:"" },
  { id:20, brand:"라운드랩",  name:"독도 선크림 SPF50+ PA++++",             category:"선크림",           categoryShort:"SC", skinTypes:["민감성","건성"],  effects:["수분","진정"],                      desc:"" },
  { id:21, brand:"이니스프리", name:"톤업 노세범 미네랄 선크림 50ml",       category:"선크림",           categoryShort:"SC", skinTypes:["지성"],           effects:["피지"],                             desc:"" },
  { id:22, brand:"코스알엑스", name:"알로에 수딩 젤 클렌저",                category:"클렌징폼",         categoryShort:"CF", skinTypes:["지성","복합성"], effects:["진정"],                             desc:"" },
  { id:23, brand:"세타필",    name:"젠틀 스킨 클렌저 500ml",               category:"클렌징폼",         categoryShort:"CF", skinTypes:["민감성","건성"],  effects:["수분"],                             desc:"" },
  { id:24, brand:"아벤느",    name:"클렌징 젤 200ml",                       category:"클렌징젤",         categoryShort:"CG", skinTypes:["민감성"],          effects:["진정"],                             desc:"" },
  { id:25, brand:"메디힐",    name:"티트리 케어 솔루션 크림",               category:"크림",             categoryShort:"CR", skinTypes:["지성"],           effects:["여드름","진정"],                    desc:"" },
];

export interface Product {
  id: string; brand: string; name: string; category: string;
  price: string; rating: number; reviews: number; skinType: string; ewg: number; emoji: string;
}
export const MOCK_PRODUCTS: Product[] = MOCK_SEARCH_PRODUCTS.slice(0, 6).map((p) => ({
  id: String(p.id), brand: p.brand, name: p.name, category: p.category,
  price: "24,000", rating: 4.7, reviews: 1000, skinType: p.skinTypes[0] ?? "복합성", ewg: 1, emoji: "💧",
}));
