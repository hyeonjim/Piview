/**
 * types/api.ts
 * Spring Boot 공통 응답 래퍼
 */

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
