// src/types/product.ts

// EWG 등급
export type EwgGrade = "safe" | "caution" | "danger" | "unknown";

export interface EwgInfo {
  grade: EwgGrade;    // safe(1~2) / caution(3~6) / danger(7~10) / unknown
  score: number | null;
}

// 브랜드 (ERD: Brand)
export interface Brand {
  id: number;
  brandKr: string;
  brandEn: string | null;
}

// 카테고리 (ERD: BigCategories > Categories)
export interface BigCategory {
  id: number;
  bigCategoryName: string;
}

export interface Category {
  id: number;
  bigCategoryId: number;
  categoryName: string;
}

// 제품 이미지 (ERD: Images)
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
}

// 피부타입 매칭 (ERD: SkinTypes)
export type SkinTypeMatch = "건성" | "지성" | "복합성" | "민감성" | "중성";
export interface SkinTypeTag {
  id: number;
  skinType: SkinTypeMatch;
}

// 제품 태그 (ERD: ProductTag / Tag)
export interface Tag {
  id: number;
  tag: string; // "여드름", "보습", "저자극" 등 17개
}

export interface ProductTag {
  id: number;
  productId: number;
  tagId: number;
  tag?: Tag;
}

// 제품 메인 (ERD: Products)
export interface Product {
  id: number;
  brandId: number;
  brand?: Brand;
  categoryId: number;
  category?: Category;
  name: string;
  price: number | null;
  volume: string | null;
  ingredients: string | null;     // 한글 전성분 (raw)
  ingredientsEn: string | null;   // 영문 전성분 (raw)
  images?: ProductImage[];
  tags?: ProductTag[];
  skinTypes?: SkinTypeTag[];
  score?: number | null;          // 평점
}

// 성분 분석 결과 (API 응답 가공형 — BE 설계 확인 필요)
export interface IngredientAnalysis {
  nameKr: string;
  nameEn: string;
  ewg: EwgInfo;
  usage: string[];        // ["보습제", "피부컨디셔닝제"]
  skinTypeScore: number;  // Paula 스코어 (0~100)
  concerns: string[];     // 해당 피부고민 ["여드름", "보습"]
}

// 레이더 차트용 기능 점수 (BE → FE 가공)
export interface FunctionScore {
  hydration: number;   // 보습
  soothing:  number;   // 진정
  whitening: number;   // 미백
  antiAging: number;   // 주름
  porecare:  number;   // 모공
}

// 추천 점수 상세 (Layer별 디버깅용, 개발 시 활용)
export interface RecommendScore {
  ingredientScore:   number;
  skinTypeMatch:     number;
  normalizedRank:    number;
  routineGapBonus:   number;
  ewgRiskPenalty:    number;
  functionOverlap:   number;
  conflictPenalty:   number;
  finalScore:        number;
}

// 좋아요 (ERD: Likes)
export interface Like {
  id: number;
  userId: number;
  productId: number;
}
