/**
 * types/skin.ts
 * 피부 진단 API 요청/응답 타입
 *
 * 플로우: capture → polling(status) → submitSurvey
 */

// ── POST /skin/analysis/capture ───────────────────────────────────

// 응답 — analysisId + PENDING 즉시 반환
export interface SkinAnalysisCaptureResponse {
  analysisId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

// ── GET /skin/analysis/{analysisId} ──────────────────────────────

// 응답 — FAILED일 때만 errorMessage 채워짐
export interface SkinAnalysisStatusResponse {
  analysisId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
}

// ── POST /skin/surveys/{analysisId} ──────────────────────────────

// 요청 body
// ⚠️ 프론트 enum과 다름 → enumConvert.ts로 변환 후 전송
export interface SurveySubmitRequest {
  gender: "MEN" | "WOMEN";
  ageGroup: "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS";
  question3: "A" | "B" | "C" | "D";
  question4: "A" | "B" | "C" | "D";
  question5: "A" | "B" | "C" | "D";
  question6: "A" | "B" | "C" | "D";
  skinProblems: string[];
}

// 응답
export interface SurveySubmitResponse {
  analysisId: string;
  mySkinType: "DRY" | "OILY" | "COMBINATION" | "DEHYDRATED_OILY";
  skinProblems: string[];
}
