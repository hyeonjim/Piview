/**
 * services/disliked.ts
 * 기피 제품 (Disliked Products) API
 *
 * GET    /users/me/disliked/products                    — 목록 조회
 * POST   /users/me/disliked/products                    — 추가 (409 중복 처리)
 * DELETE /users/me/disliked/products/{dislikedProductId} — 삭제
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  DislikedProduct,
  DislikedProductCreateResponse,
} from "@/types/product/detail";

export const dislikedService = {
  // GET /users/me/disliked/products → DislikedProduct[] (빈 배열 가능)
  getList: (): Promise<DislikedProduct[]> =>
    client
      .get<ApiResponse<DislikedProduct[]>>("/users/me/disliked/products")
      .then((res) => res.data.data),

  // POST /users/me/disliked/products body: { productId } → 생성된 dislikedProductId 반환
  // 409: 이미 기피 등록됨 (Conflict) — 호출 측에서 처리
  add: (productId: number): Promise<DislikedProductCreateResponse> =>
    client
      .post<ApiResponse<DislikedProductCreateResponse>>(
        "/users/me/disliked/products",
        { productId },
      )
      .then((res) => res.data.data),

  // DELETE /users/me/disliked/products/{dislikedProductId}
  remove: (dislikedProductId: number): Promise<void> =>
    client
      .delete(`/users/me/disliked/products/${dislikedProductId}`)
      .then(() => undefined),
};
