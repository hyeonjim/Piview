/**
 * types/chatbot/chatbot.ts
 * 챗봇 API 타입 정의
 * POST /api/v1/chatbot/query
 */

// ── 요청 ─────────────────────────────────────────────────────────

export interface ChatbotClientContext {
  /** 현재 화면. search | detail */
  screen: "search" | "detail" | null;
  /** 상세 화면에서 현재 보고 있는 상품 ID */
  currentProductId: number | null;
}

export interface ChatbotQueryRequest {
  message: string;
  /** 첫 질문은 null, 후속 질문은 이전 응답의 sessionId 그대로 */
  sessionId: string | null;
  context?: ChatbotClientContext;
}

// ── 응답 ─────────────────────────────────────────────────────────

export interface ChatbotProductCandidate {
  productId: number | null;
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  /** 추천 이유 요약 */
  reason: string | null;
}

export interface ChatbotCitation {
  type: string;
  productId: number | null;
  text: string | null;
}

export interface ChatbotQueryResponse {
  sessionId: string;
  answer: string;
  /** 최대 5개, 비어있을 수 있음 */
  products: ChatbotProductCandidate[];
  appliedFilters: Record<string, unknown>;
  citations: ChatbotCitation[];
}
