/**
 * 🔧 constants/_mock/routine.ts
 * 🔧 루틴 API 목업 데이터 — 임시 하드코딩, 실제 데이터 아님
 *
 * ⚠️ BE 연동 시 전체 파일 삭제 후 실제 API 응답으로 교체
 *
 * 커버 범위:
 *  - DraftItemDto[]         → GET  /api/v1/routines/draft
 *  - RoutineListResponse[]  → GET  /api/v1/routines
 *  - RoutineResponse        → GET  /api/v1/routines/main
 *  - RoutineResponse        → GET  /api/v1/routines/{routineId}
 *
 * ■ 목업 식별 규칙
 *  - 루틴 제목: "목업루틴N" 형식 사용
 *  - 제품명: "[목업] 제품명" 형식 사용
 *  - IS_MOCK_DATA 플래그로 UI에서 🔧 배지/배너 표시
 */

import type {
  DraftItemDto,
  RoutineListResponse,
  RoutineResponse,
} from "@/types/routine";

/**
 * 목업 데이터 사용 여부 플래그
 * RoutineTab 등 UI에서 import해 배지/배너를 조건부 렌더링할 때 사용
 * ⚠️ BE 연동 시 이 파일 전체 삭제 — 플래그 참조도 함께 제거
 */
// 🔧 목업 플래그 — ⚠️ BE 연동 시 이 파일 전체 삭제, 플래그 참조도 함께 제거
export const IS_MOCK_DATA = true;

// ── 공통 제품 목업 ────────────────────────────────────────────────
// "[목업]" 접두사로 실제 제품과 구분
// 실제 제품 이미지는 서버에서 내려오므로 imageUrl은 빈 문자열로 처리
const MOCK_PRODUCT_CLEANSER = {
  productId: 9001,
  name: "[목업] 클렌저 제품",
  brandName: "[목업] 브랜드",
  categoryName: "클렌저",
  imageUrl: "",
  skinTypes: ["건성", "복합성"],
  tags: ["수분", "저자극"],
  liked: false,
};

const MOCK_PRODUCT_TONER = {
  productId: 9002,
  name: "[목업] 토너 제품",
  brandName: "[목업] 브랜드",
  categoryName: "스킨/토너",
  imageUrl: "",
  skinTypes: ["건성", "복합성"],
  tags: ["수분", "진정"],
  liked: false,
};

const MOCK_PRODUCT_SERUM = {
  productId: 9003,
  name: "[목업] 세럼 제품",
  brandName: "[목업] 브랜드",
  categoryName: "세럼/에센스",
  imageUrl: "",
  skinTypes: ["지성", "복합성"],
  tags: ["미백", "안티에이징"],
  liked: false,
};

const MOCK_PRODUCT_CREAM = {
  productId: 9004,
  name: "[목업] 크림 제품",
  brandName: "[목업] 브랜드",
  categoryName: "크림",
  imageUrl: "",
  skinTypes: ["건성", "수부지"],
  tags: ["수분", "보습"],
  liked: false,
};

const MOCK_PRODUCT_LOTION = {
  productId: 9005,
  name: "[목업] 로션 제품",
  brandName: "[목업] 브랜드",
  categoryName: "로션/에멀전",
  imageUrl: "",
  skinTypes: ["건성", "수부지"],
  tags: ["보습", "장벽강화"],
  liked: false,
};

// ── 🔧 임시 루틴(Draft) 목업 ─────────────────────────────────────────
// GET /api/v1/routines/draft 응답 형식
export const MOCK_DRAFT_ITEMS: DraftItemDto[] = [
  { columnId: 1, stepOrder: 1, product: MOCK_PRODUCT_CLEANSER },
  { columnId: 2, stepOrder: 2, product: MOCK_PRODUCT_TONER },
  { columnId: 3, stepOrder: 3, product: MOCK_PRODUCT_SERUM },
];

// ── 🔧 루틴 목록 목업 ────────────────────────────────────────────────
// GET /api/v1/routines 응답 형식
// 제목은 "목업루틴N" 형식 — 실제 사용자 루틴과 혼동 방지
export const MOCK_ROUTINE_LIST: RoutineListResponse[] = [
  { routineId: 9001, title: "목업루틴1", isMain: true,  productCount: 4 },
  { routineId: 9002, title: "목업루틴2", isMain: false, productCount: 3 },
];

// ── 🔧 루틴 상세 목업 ────────────────────────────────────────────────
// GET /api/v1/routines/main, GET /api/v1/routines/{routineId} 응답 형식
export const MOCK_MAIN_ROUTINE: RoutineResponse = {
  routineId: 9001,
  title: "목업루틴1",
  isMain: true,
  steps: [
    {
      columnId: 1,
      columnName: "클렌저",
      products: [
        { routineDetailId: 9101, stepOrder: 1, product: MOCK_PRODUCT_CLEANSER },
      ],
    },
    {
      columnId: 2,
      columnName: "스킨/토너",
      products: [
        { routineDetailId: 9102, stepOrder: 2, product: MOCK_PRODUCT_TONER },
      ],
    },
    {
      columnId: 3,
      columnName: "세럼/에센스",
      products: [
        { routineDetailId: 9103, stepOrder: 3, product: MOCK_PRODUCT_SERUM },
      ],
    },
    {
      columnId: 5,
      columnName: "크림/오일",
      products: [
        { routineDetailId: 9104, stepOrder: 4, product: MOCK_PRODUCT_CREAM },
      ],
    },
  ],
};

// 🔧 루틴 ID별 상세 목업 맵 — ⚠️ BE 연동 시 삭제
export const MOCK_ROUTINE_DETAIL_MAP: Record<number, RoutineResponse> = {
  9001: MOCK_MAIN_ROUTINE,
  9002: {
    routineId: 9002,
    title: "목업루틴2",
    isMain: false,
    steps: [
      {
        columnId: 1,
        columnName: "클렌저",
        products: [
          { routineDetailId: 9201, stepOrder: 1, product: MOCK_PRODUCT_CLEANSER },
        ],
      },
      {
        columnId: 4,
        columnName: "로션/에멀전",
        products: [
          { routineDetailId: 9202, stepOrder: 2, product: MOCK_PRODUCT_LOTION },
        ],
      },
      {
        columnId: 5,
        columnName: "크림/오일",
        products: [
          { routineDetailId: 9203, stepOrder: 3, product: MOCK_PRODUCT_CREAM },
        ],
      },
    ],
  },
};
