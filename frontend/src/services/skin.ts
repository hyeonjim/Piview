/**
 * services/skin.ts
 * 피부 진단 API — POST /skin/surveys
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type { SurveySubmitRequest, SurveySubmitResponse } from "@/types/user";

export const skinService = {
  // POST /skin/surveys
  // 요청 전 enumConvert.ts로 변환 필수 (gender: MEN/WOMEN, ageGroup: TWENTIES 등)
  submitSurvey: (body: SurveySubmitRequest): Promise<SurveySubmitResponse> =>
    client
      .post<ApiResponse<SurveySubmitResponse>>("/skin/surveys", body)
      .then((res) => res.data.data),
};
