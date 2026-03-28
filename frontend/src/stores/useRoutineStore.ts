/**
 * stores/useRoutineStore.ts
 * 루틴 UI 상태 스토어
 *
 * 서버 데이터(루틴 목록, draft 등)는 TanStack Query(useRoutineQueries.ts)로 관리.
 * 여기서는 페이지 간 유지가 필요한 UI 상태만 관리.
 */

import { create } from "zustand";

// 🔑 localStorage 키
const STORAGE_KEY = 'piview_recommended_products';

// 📦 localStorage helper 함수들

/**
 * localStorage에서 추천 제품 ID 목록 로드
 * @returns 추천 제품 ID Set (에러 시 빈 Set)
 */
const loadRecommendedIds = (): Set<number> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * localStorage에 추천 제품 ID 목록 저장
 * @param ids 저장할 추천 제품 ID Set
 */
const saveRecommendedIds = (ids: Set<number>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.warn('Failed to save recommended IDs:', error);
  }
};

// 🏪 스토어 인터페이스

interface RoutineStore {
  // UI 상태 (메모리 전용) — 마이페이지 재방문 시 마지막 화면 복원

  /** RoutineTab에서 선택된 저장 루틴 ID (null = 드래프트 편집 뷰) */
  selectedRoutineId: number | null;
  setSelectedRoutineId: (id: number | null) => void;

  // 성분 충돌 상태 (메모리 전용) — 페이지 이동에도 유지
  /** 충돌 성분 메시지 */
  conflictMessage: string | null;
  /** 충돌을 유발한 제품 ID 목록 */
  conflictProductIds: number[];
  /** 충돌 상태 저장 */
  setConflict: (message: string, productIds: number[]) => void;
  /** 충돌 상태 초기화 */
  clearConflict: () => void;

  // PICK 배지 추적 (localStorage 영구 저장)

  /** 추천으로 추가된 제품 ID Set */
  recommendedProductIds: Set<number>;
  /** 제품을 추천 제품으로 마킹 */
  markAsRecommended: (productId: number) => void;
  /** 추천 제품 정보 제거 (제품 삭제 시) */
  removeRecommended: (productId: number) => void;
  /** 제품이 추천 제품인지 확인 */
  isRecommended: (productId: number) => boolean;
  /** 모든 추천 제품 정보 초기화 */
  clearRecommendedProducts: () => void;
}

// 🏗️ 스토어 생성

export const useRoutineStore = create<RoutineStore>()((set, get) => ({
  // UI 상태 (메모리 전용)
  selectedRoutineId: null,
  setSelectedRoutineId: (id) => set({ selectedRoutineId: id }),

  // 성분 충돌 상태
  conflictMessage: null,
  conflictProductIds: [],
  setConflict: (message, productIds) => set({ conflictMessage: message, conflictProductIds: productIds }),
  clearConflict: () => set({ conflictMessage: null, conflictProductIds: [] }),

  // PICK 배지 추적 (localStorage 연동)
  recommendedProductIds: loadRecommendedIds(),

  markAsRecommended: (productId) => {
    const updated = new Set(get().recommendedProductIds).add(productId);
    saveRecommendedIds(updated);
    set({ recommendedProductIds: updated });
  },

  removeRecommended: (productId) => {
    const updated = new Set(get().recommendedProductIds);
    updated.delete(productId);
    saveRecommendedIds(updated);
    set({ recommendedProductIds: updated });
  },

  isRecommended: (productId) =>
    get().recommendedProductIds.has(productId),

  clearRecommendedProducts: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ recommendedProductIds: new Set() });
  },
}));
