/**
 * _mock/products.ts
 * 제품 목록 더미 데이터
 *
 * ⚠️  API 교체 대상
 *     교체 시: 이 파일의 import를 삭제하고
 *              useEffect + api.get("/products") 로 대체
 *
 * 사용처:
 *   - src/app/(main)/recommend/page.tsx  → MOCK_PRODUCTS
 *   - src/app/(main)/search/page.tsx     → MOCK_SEARCH_PRODUCTS
 */

export interface Product {
  id:       string;
  brand:    string;
  name:     string;
  category: string;
  price:    string;
  rating:   number;
  reviews:  number;
  skinType: string;
  ewg:      number;
  emoji:    string;
}

/** 추천 페이지용 더미 제품 */
export const MOCK_PRODUCTS: Product[] = [
  { id:"1", brand:"이니스프리", name:"그린티 씨드 세럼",     category:"세럼/에센스", price:"32,000", rating:4.8, reviews:2341, skinType:"건성",  ewg:2, emoji:"🌿" },
  { id:"2", brand:"아누아",    name:"어성초 77 토너",        category:"스킨/토너",  price:"24,000", rating:4.7, reviews:5892, skinType:"지성",  ewg:1, emoji:"💧" },
  { id:"3", brand:"코스알엑스", name:"달팽이 뮤신 96 에센스", category:"세럼/에센스", price:"28,000", rating:4.9, reviews:8123, skinType:"복합성", ewg:1, emoji:"✨" },
  { id:"4", brand:"라운드랩", name:"독도 토너",              category:"스킨/토너",  price:"18,000", rating:4.6, reviews:3412, skinType:"민감성", ewg:2, emoji:"💦" },
  { id:"5", brand:"넘버즈인", name:"1번 비타민C 세럼",       category:"세럼/에센스", price:"38,000", rating:4.7, reviews:1234, skinType:"건성",  ewg:2, emoji:"🍋" },
  { id:"6", brand:"메디힐",   name:"티트리 케어 솔루션",     category:"크림",       price:"22,000", rating:4.5, reviews:2109, skinType:"지성",  ewg:1, emoji:"🌱" },
];

export interface SearchProduct {
  id:            number;
  brand:         string;
  name:          string;
  category:      string;
  categoryShort: string;
  skinTypes:     string[];
  effects:       string[];
  desc:          string;
}

/** 검색 페이지용 더미 제품 */
export const MOCK_SEARCH_PRODUCTS: SearchProduct[] = Array.from({ length: 10 }, (_, i) => ({
  id:   i + 1,
  brand: ["타가", "생앤선", "미샤", "피터스", "반도", "라운드랩"][i % 6],
  category:      "스킨/토너",
  categoryShort: "PR",
  name: [
    "(리뚤존식이 에디션) 아...",
    "[TROUBLE HATER] ...",
    "[니어스킨] 트러블컷 프...",
    "0.5% 바하토너",
    "082 어성초 토너",
    "1025 독도 토너",
    "1025 독도 패드",
    "109 토너",
    "119 스마트 시카 패드",
    "180 AHA 페이셜 필 앤...",
  ][i],
  skinTypes: [
    ["지성", "복합성"], ["수부지", "지성"], ["지성", "복합성"],
    ["지성", "수부지"], ["수부지", "지성"], ["수부지", "지성"],
    ["수부지", "지성"], ["수부지", "지성"], ["지성", "복합성"], ["지성"],
  ][i],
  effects: [
    ["여드름", "미백", "세스칙착", "안티에이징"],
    ["여드름", "미백"],
    ["여드름", "피지", "블랙헤드", "진정"],
    ["지성", "수부지", "여드름", "피지"],
    [], [], [], [],
    ["여드름", "안티에이징", "진정"],
    [],
  ][i] || [],
  desc: "복합성 피부에 사용 가능하며, 특히 그이 허용에 도움을 줄 수 있는 제품입니다. 자세 선분 없이 안심하고 사용하게 세부 가능합니다.",
}));
