/**
 * services/myCos.ts
 * 보유제품 (MyCos) API
 *
 * GET    /my-cos                — 목록 조회
 * POST   /my-cos/{productId}    — 추가 (409 중복 처리)
 * DELETE /my-cos/{myCosId}      — 삭제
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type { MyCosItem } from "@/types/product";

export const myCosService = {
  // GET /my-cos → MyCosItem[] (빈 배열 가능)
  getList: (): Promise<MyCosItem[]> =>
    client
      .get<ApiResponse<MyCosItem[]>>("/my-cos")
      .then((res) => res.data.data),

  // POST /my-cos/{productId} → 생성된 myCosId(number) 반환
  // 409: 이미 보유 중 (Conflict) — 호출 측에서 처리
  add: (productId: number): Promise<number> =>
    client
      .post<ApiResponse<number>>(`/my-cos/${productId}`)
      .then((res) => res.data.data),

  // DELETE /my-cos/{myCosId}
  remove: (myCosId: number): Promise<void> =>
    client.delete(`/my-cos/${myCosId}`).then(() => undefined),
};
