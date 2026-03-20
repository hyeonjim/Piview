/**
 * hooks/useOcr.ts
 * OCR 인식 훅 — POST /ocr/recognize
 *
 * 사용법 (skin-test/photo/page.tsx):
 *   const { mutate: recognize, isPending, data } = useOcr();
 *   recognize(imageFile, {
 *     onSuccess: (result) => {
 *       if (result.success && result.productId) {
 *         router.push(`/product/${result.productId}`);
 *       }
 *     }
 *   });
 *
 * ⚠️ productId 받아도 GET /products/{id} 없으면 상세 페이지 mock 유지
 */

import { useMutation } from "@tanstack/react-query";
import { ocrService } from "@/services/ocr";

export function useOcr() {
  return useMutation({
    mutationFn: (imageFile: File) => ocrService.recognize(imageFile),
  });
}
