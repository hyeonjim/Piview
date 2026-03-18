/**
 * types/skin.ts
 * 피부 진단 API 요청/응답 타입 — POST /skin/surveys
 */

// POST /skin/surveys 요청 body
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

// POST /skin/surveys 응답
export interface SurveySubmitResponse {
  mySkinType: "DRY" | "OILY" | "COMBINATION" | "DEHYDRATED_OILY";
  skinProblems: string[];
}
