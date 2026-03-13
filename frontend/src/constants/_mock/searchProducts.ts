export interface SearchProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  mainCategory: string;
  skinType1?: string;
  skinType2?: string;
  concerns: Record<string, boolean>;
  price: number;
  volume: string;
  rating: number;
  reviews: number;
  emoji: string;
  imageUrl?: string;
  matchScore: number;
}

export const MOCK_SEARCH_PRODUCTS: SearchProduct[] = [
  { id:"s1", brand:"아누아", name:"어성초 77 토너", category:"스킨/토너", mainCategory:"스킨케어", skinType1:"지성", skinType2:"복합성", concerns:{ 여드름:true, 피지:true, 진정:true }, price:24000, volume:"250ml", rating:4.7, reviews:5892, emoji:"💧", matchScore:92 },
  { id:"s2", brand:"라운드랩", name:"1025 독도 토너", category:"스킨/토너", mainCategory:"스킨케어", skinType1:"건성", skinType2:"건성", concerns:{ 수분:true, 진정:true }, price:18000, volume:"300ml", rating:4.6, reviews:3412, emoji:"🌊", matchScore:87 },
  { id:"s3", brand:"코스알엑스", name:"달팽이 뮤신 96 에센스", category:"에센스/앰플/세럼", mainCategory:"스킨케어", skinType1:"복합성", skinType2:"건성", concerns:{ 수분:true, 안티에이징:true, 진정:true }, price:28000, volume:"100ml", rating:4.9, reviews:8123, emoji:"✨", matchScore:95 },
  { id:"s4", brand:"이니스프리", name:"그린티 씨드 세럼", category:"에센스/앰플/세럼", mainCategory:"스킨케어", skinType1:"건성", skinType2:"복합성", concerns:{ 수분:true, 영양:true }, price:32000, volume:"80ml", rating:4.8, reviews:2341, emoji:"🌿", matchScore:88 },
  { id:"s5", brand:"넘버즈인", name:"1번 비타민C 세럼", category:"에센스/앰플/세럼", mainCategory:"스킨케어", skinType1:"건성", concerns:{ 미백:true, 색소침착:true, 안티에이징:true }, price:38000, volume:"30ml", rating:4.7, reviews:1234, emoji:"🍋", matchScore:83 },
  { id:"s6", brand:"메디힐", name:"티트리 케어 솔루션 에센셜 마스크팩", category:"에센스/앰플/세럼", mainCategory:"스킨케어", skinType1:"지성", concerns:{ 여드름:true, 피지:true, 진정:true }, price:22000, volume:"25ml x 10", rating:4.5, reviews:2109, emoji:"🌱", matchScore:80 },
  { id:"s7", brand:"클라랩", name:"119 스마트 시카 패드", category:"패드", mainCategory:"스킨케어", skinType1:"지성", skinType2:"복합성", concerns:{ 여드름:true, 안티에이징:true, 진정:true }, price:28000, volume:"60ea", rating:4.6, reviews:1890, emoji:"🍃", matchScore:85 },
  { id:"s8", brand:"피지오겔", name:"AI 크림", category:"크림", mainCategory:"스킨케어", skinType1:"건성", skinType2:"건성", concerns:{ 수분:true, 진정:true, 아토피:true }, price:32000, volume:"75ml", rating:4.8, reviews:3210, emoji:"🤍", matchScore:90 },
  { id:"s9", brand:"아벤느", name:"클린스 포밍 젤", category:"폼/젤/밤/오일", mainCategory:"클렌징", skinType1:"건성", concerns:{ 진정:true, 수분:true }, price:19000, volume:"200ml", rating:4.5, reviews:1560, emoji:"🫧", matchScore:78 },
  { id:"s10", brand:"세타필", name:"젠틀 스킨 클렌저", category:"폼/젤/밤/오일", mainCategory:"클렌징", skinType1:"건성", skinType2:"건성", concerns:{ 수분:true, 진정:true }, price:15000, volume:"250ml", rating:4.7, reviews:4230, emoji:"🧴", matchScore:82 },
  { id:"s11", brand:"아누아", name:"어성초 선크림 SPF50+", category:"선크림/스틱", mainCategory:"선케어", skinType1:"지성", skinType2:"복합성", concerns:{ 피지:true, 진정:true }, price:26000, volume:"50ml", rating:4.8, reviews:3890, emoji:"☀️", matchScore:91 },
  { id:"s12", brand:"라로슈포제", name:"안티헬리오스 XL SPF50+", category:"선크림/스틱", mainCategory:"선케어", skinType1:"건성", concerns:{ 진정:true }, price:34000, volume:"50ml", rating:4.7, reviews:2180, emoji:"🌤️", matchScore:86 },
];

export const MAIN_CATEGORIES_MOCK: Record<string, string[]> = {
  "스킨케어": ["스킨/토너","로션/에멀젼","에센스/앰플/세럼","크림","페이스오일","미스트","패드"],
  "클렌징": ["폼/젤/밤/오일"],
  "선케어": ["선크림/스틱"],
};
