/**
 * types/api.ts
 * Spring Boot 공통 응답 래퍼
 * ⚠️ 실제 BE 응답 형태 확인 후 수정 필요
 */

export interface ApiResponse<DataType> {
  data: DataType;
  message: string;
  status: number;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PaginatedResponse<DataType> {
  content: DataType[];
  pagination: PaginationMeta;
}
