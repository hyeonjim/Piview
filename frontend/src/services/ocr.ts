/**
 * services/ocr.ts
 * OCR 인식 API — POST /ocr/recognize
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type { OcrRecognitionResponse } from "@/types/product";

export const ocrService = {
  // POST /ocr/recognize (multipart/form-data)
  recognize: (imageFile: File): Promise<OcrRecognitionResponse> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return client
      .post<ApiResponse<OcrRecognitionResponse>>("/ocr/recognize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data.data);
  },
};
