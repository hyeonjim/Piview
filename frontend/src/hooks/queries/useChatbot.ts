/**
 * hooks/queries/useChatbot.ts
 * 챗봇 질의 훅
 *
 * - useMutation 기반 — 질문할 때마다 호출
 * - sessionId 내부 관리 — 첫 질문 null, 이후 응답 sessionId 자동 유지
 * - resetSession() — 새 대화 시작 시 sessionId 초기화
 */

import { useMutation } from "@tanstack/react-query";
import { chatbotService } from "@/services/chatbot";
import { useChatbotStore } from "@/stores";
import type { ChatbotClientContext, ChatbotQueryResponse } from "@/types/chatbot";

export function useChatbot() {
  const { sessionId, addMessage, setSessionId, reset } = useChatbotStore();

  const mutation = useMutation<
    ChatbotQueryResponse,
    Error,
    { message: string; context?: ChatbotClientContext }
  >({
    mutationFn: ({ message, context }) =>
      chatbotService.query({
        message,
        sessionId,
        context: context ?? undefined,
      }),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      addMessage({
        role: "assistant",
        content: data.answer,
        products: data.products.length > 0 ? data.products : undefined,
      });
    },
    onError: () => {
      addMessage({
        role: "assistant",
        content: "죄송해요, 잠시 오류가 발생했어요. 다시 시도해 주세요.",
      });
    },
  });

  const sendMessage = (message: string, context?: ChatbotClientContext) => {
    addMessage({ role: "user", content: message });
    mutation.mutate({ message, context });
  };

  const resetSession = () => {
    reset();
    mutation.reset();
  };

  return {
    isPending: mutation.isPending,
    sendMessage,
    resetSession,
  };
}
