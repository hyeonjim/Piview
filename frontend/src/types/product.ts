// src/types/product.ts

// EWG 등급
export type EwgGrade = "safe" | "caution" | "danger" | "unknown";

export interface EwgInfo {
  grade: EwgGrade;    // safe(1~2) / caution(3~6) / danger(7~10) / unknown
  score: number | null;
}

// 피부타입 (ProductSkinScores, ProductScore 등에서 공통 사용)
export type SkinTypeMatch = "건성" | "지성" | "복합성" | "수부지";

// 브랜드 (ERD: Brand)
// ⚠️ 변경: brandKr/brandEn → brandName (ERD: brand_name 단일 필드)
export interface Brand {
  id: number;             // ERD: brand_id
  brandName: string | null; // ERD: brand_name
}

// 카테고리 (ERD: BigCategory > Category)
export interface BigCategory {
  id: number;             // ERD: big_category_id
  bigCategoryName: string | null;
}

export interface Category {
  id: number;             // ERD: category_id
  bigCategoryId: number;
  categoryName: string;
}

// 제품 이미지 (ERD: Images)
// ⚠️ 변경: productId 제거 (Images에 없음), imageUrl → url
export interface ProductImage {
  id: number;       // ERD: image_id
  url: string | null; // ERD: url
}

// 태그 (ERD: Tag)
export interface Tag {
  id: number;   // ERD: tag_id
  tag: string | null;
}

// 제품-태그 점수 (ERD: ProductTagScores)
// ⚠️ 변경: 기존 ProductTag → ProductTagScore (ERD 테이블명/구조 반영)
export interface ProductTagScore {
  id: number;         // ERD: id AUTO_INCREMENT
  productId: number;  // FK → Products
  tagId: number;      // FK → Tag
  score: number;      // DECIMAL(6,2) TF-IDF 기반 점수
  isTagged: boolean;  // score가 67th percentile 초과 시 TRUE
  tag?: Tag;
}

// 제품 메인 (ERD: Products)
// ⚠️ 변경: volume/ingredientsEn/score 제거, imageId/store 추가, images[] → image 단일
export interface Product {
  id: number;           // ERD: product_id
  brandId: number;      // FK → Brand
  brand?: Brand;
  categoryId: number;   // FK → Category
  category?: Category;
  imageId: number;      // FK → Images (단일 이미지)
  image?: ProductImage;
  name: string | null;
  ingredients: string | null; // 전성분 (raw text)
  price: number | null;
  store: number | null;       // ERD: store
  tagScores?: ProductTagScore[]; // ERD: ProductTagScores
}

// 성분 (ERD: Ingredients)
export interface Ingredient {
  id: number;               // ERD: ingredient_id
  nameEn: string;
  nameKo: string | null;
  ewgScoreMin: number | null;
  ewgScoreMax: number | null;
  ewgGrade: EwgGrade | null;
  coosFunctions: string | null; // TEXT
}

// 제품-성분 매핑 (ERD: ProductIngredients)
export interface ProductIngredient {
  id: number;              // AUTO_INCREMENT
  ingredientId: number;    // FK → Ingredients
  productId: number;       // FK → Products
  nameKo: string | null;   // 원본 한글 성분명
  nameEn: string | null;   // 원본 영문 성분명
  position: number;        // 성분 순서 (1부터)
  isMatched: boolean;      // Ingredients 테이블 매칭 성공 여부
  ingredient?: Ingredient;
}

// 성분 효능 (ERD: IngredientBenefits)
export interface IngredientBenefit {
  id: number;              // AUTO_INCREMENT
  ingredientId: number;    // FK → Ingredients
  benefit: string;         // ENUM
}

// 피부타입별 제품 적합도 점수 (ERD: ProductSkinScores)
export interface ProductSkinScore {
  productId: number;                    // PK, FK → Products
  scoreDry: number | null;              // 건성 적합도 0~100
  scoreOily: number | null;             // 지성 적합도 0~100
  scoreCombination: number | null;      // 복합성 적합도 0~100
  scoreSubuji: number | null;           // 수부지 적합도 0~100
  topSkinType: SkinTypeMatch | null;    // 1순위 피부타입
  top2SkinType: SkinTypeMatch | null;   // 2순위 피부타입
}

// 추천 점수 상세 (ERD: Product Score)
export interface ProductScore {
  id: number;                   // ERD: product_score_id AUTO_INCREMENT
  productId: number;            // FK → Products
  skinType: SkinTypeMatch;      // UNIQUE(product_id, skin_type)
  normScore: number;            // DECIMAL(5,2) 0~100
  diffScore: number | null;     // DECIMAL(6,2) 음수 가능
  compScore: number;            // DECIMAL(6,2) 0.6*norm + 0.4*diff
  confidence: "high" | "medium" | "low"; // ENUM
}

// 성분 분석 결과 (API 응답 가공형 — ⚠️ BE 설계 확인 필요)
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
  hydration: number;  // 보습
  soothing:  number;  // 진정
  whitening: number;  // 미백
  antiAging: number;  // 주름
  porecare:  number;  // 모공
}

// 추천 점수 레이어 상세 (디버깅용)
export interface RecommendScore {
  ingredientScore:  number;
  skinTypeMatch:    number;
  normalizedRank:   number;
  routineGapBonus:  number;
  ewgRiskPenalty:   number;
  functionOverlap:  number;
  conflictPenalty:  number;
  finalScore:       number;
}
