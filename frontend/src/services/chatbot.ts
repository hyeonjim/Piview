/**
 * services/chatbot.ts
 * 챗봇 API
 * POST /api/v1/chatbot/query
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type { ChatbotQueryRequest, ChatbotQueryResponse } from "@/types/chatbot";

export const chatbotService = {
  query: (request: ChatbotQueryRequest): Promise<ChatbotQueryResponse> =>
    client
      .post<ApiResponse<ChatbotQueryResponse>>("/chatbot/query", request)
      .then((res) => res.data.data),
};
