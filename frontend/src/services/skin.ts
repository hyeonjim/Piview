/**
 * services/skin.ts
 * 피부 진단 API
 *
 * 플로우: captureAnalysis → getAnalysisStatus(polling) → submitSurvey
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  SkinAnalysisCaptureResponse,
  SkinAnalysisStatusResponse,
  SurveySubmitRequest,
  SurveySubmitResponse,
} from "@/types/user";

export const skinService = {
  // POST /skin/analysis/capture (multipart/form-data)
  // 즉시 analysisId + PENDING 반환 — 완료 여부는 getAnalysisStatus로 폴링
  captureAnalysis: (imageFile: File): Promise<SkinAnalysisCaptureResponse> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return client
      .post<
        ApiResponse<SkinAnalysisCaptureResponse>
      >("/skin/analysis/capture", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => res.data.data);
  },

  // GET /skin/analysis/{analysisId}
  // PENDING → 계속 폴링 / COMPLETED → submitSurvey 호출 가능 / FAILED → 에러 처리
  getAnalysisStatus: (
    analysisId: string,
  ): Promise<SkinAnalysisStatusResponse> =>
    client
      .get<
        ApiResponse<SkinAnalysisStatusResponse>
      >(`/skin/analysis/${analysisId}`)
      .then((res) => res.data.data),

  // POST /skin/surveys/{analysisId}
  // ⚠️ AI 분석 COMPLETED 상태일 때만 호출 가능
  // 요청 전 enumConvert.ts로 변환 필수 (gender: MEN/WOMEN, ageGroup: TWENTIES 등)
  submitSurvey: (
    analysisId: string,
    body: SurveySubmitRequest,
  ): Promise<SurveySubmitResponse> =>
    client
      .post<
        ApiResponse<SurveySubmitResponse>
      >(`/skin/surveys/${analysisId}`, body)
      .then((res) => res.data.data),
};
