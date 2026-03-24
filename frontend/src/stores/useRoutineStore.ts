/**
 * stores/useRoutineStore.ts
 * 루틴 UI 상태 스토어
 *
 * 서버 데이터(루틴 목록, draft 등)는 TanStack Query(useRoutineQueries.ts)로 관리.
 * 여기서는 페이지 간 유지가 필요한 UI 상태만 관리.
 */

import { create } from "zustand";

// 🏪 스토어 인터페이스

interface RoutineStore {
  // UI 상태 (메모리 전용) — 마이페이지 재방문 시 마지막 화면 복원

  /** RoutineTab에서 선택된 저장 루틴 ID (null = 드래프트 편집 뷰) */
  selectedRoutineId: number | null;
  setSelectedRoutineId: (id: number | null) => void;
}

// 🏗️ 스토어 생성

export const useRoutineStore = create<RoutineStore>()((set) => ({
  // UI 상태 (메모리 전용)
  selectedRoutineId: null,
  setSelectedRoutineId: (id) => set({ selectedRoutineId: id }),
}));
