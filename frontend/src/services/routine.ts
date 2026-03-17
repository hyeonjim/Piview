/**
 * services/routine.ts
 * 루틴 관련 API 서비스
 */

import client from "./client";

export const routineService = {
  /**
   * 임시 루틴(draft)에 제품 추가
   * POST /api/v1/routines/draft
   * @param columnId - 루틴 단계 ID (CL=1, PR=2, SR=3, LT=4, CR=5, SC=6)
   * @param productId - 추가할 화장품 ID
   */
  addDraft: (columnId: number, productId: number) =>
    client.post("/api/v1/routines/draft", { columnId, productId }),
};
