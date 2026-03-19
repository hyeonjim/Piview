/**
 * services/routine.ts
 * 루틴 관련 API 서비스
 */

import client from "./client";
import type { DraftItem } from "@/types/routine";

export const routineService = {
  /**
   * 임시 루틴(draft)에 제품 추가
   * POST /api/v1/routines/draft
   * @param columnId - 루틴 단계 ID (CL=1, PR=2, SR=3, LT=4, CR=5, SC=6)
   * @param productId - 추가할 화장품 ID
   * @deprecated syncDraft(PUT)로 통합 예정 — 현재 단일 추가 시에만 사용
   */
  addDraft: (columnId: number, productId: number) =>
    client.post("/api/v1/routines/draft", { columnId, productId }),

  /**
   * 임시 루틴(draft) 전체 동기화
   * PUT /api/v1/routines/draft
   *
   * - 화면에 보이는 루틴 전체 배열을 그대로 전송
   * - 백엔드는 Redis(routine:draft:{userId})에 덮어쓰기
   * - 제품 추가 / 제거 / 드래그 순서 변경 시 매번 호출
   *
   * @param items - 현재 루틴의 전체 제품 목록 (순서 포함)
   */
  syncDraft: (items: DraftItem[]) =>
    client.put("/api/v1/routines/draft", items),
};
