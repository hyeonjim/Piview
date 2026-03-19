/**
 * services/myCos.ts
 * 보유제품 (MyCos) API
 *
 * GET    /my-cos           — 목록 조회
 * POST   /my-cos           — 추가 (201, 409 중복 처리)
 * DELETE /my-cos/{myCosId} — 삭제 (소프트 딜리트)
 */

import client from "./client";
import type { MyCosItem, MyCosCreateRequest } from "@/types/product";

export const myCosService = {
  // GET /my-cos → MyCosItem[] (빈 배열 가능)
  getList: (): Promise<MyCosItem[]> =>
    client.get<MyCosItem[]>("/my-cos").then((res) => res.data),

  // POST /my-cos → 생성된 myCosId(number) 반환
  // 201: 성공 / 409: 이미 보유 중 (Conflict) — 호출 측에서 409 처리
  add: (body: MyCosCreateRequest): Promise<number> =>
    client.post<number>("/my-cos", body).then((res) => res.data),

  // DELETE /my-cos/{myCosId} → 성공 메시지 문자열
  remove: (myCosId: number): Promise<string> =>
    client.delete<string>(`/my-cos/${myCosId}`).then((res) => res.data),
};
