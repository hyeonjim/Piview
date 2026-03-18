/**
 * types/ocr.ts
 * OCR 인식 API 요청/응답 타입 — POST /ocr/recognize
 */

// POST /ocr/recognize 응답
export interface OcrRecognitionResponse {
  productId: number | null;
  brandName: string | null;
  productName: string | null;
  matchAccuracy: number;  // 0~100
  success: boolean;
}
