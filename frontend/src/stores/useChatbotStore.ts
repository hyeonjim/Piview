/**
 * stores/useChatbotStore.ts
 * 챗봇 대화 내역 전역 상태 — 페이지 이동 후에도 유지
 */

import { create } from "zustand";
import type { ChatbotProductCandidate } from "@/types/chatbot";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: ChatbotProductCandidate[];
}

interface ChatbotStore {
  messages: ChatMessage[];
  sessionId: string | null;

  addMessage: (message: ChatMessage) => void;
  setSessionId: (id: string) => void;
  reset: () => void;
}

// 챗봇 초기 인사말
const GREETING_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "안녕하세요! 저는 Gamini 입니다.\n화장품 성분이나 피부고민, 추천제품등 궁금하신점을 말씀해주시면 친절하게 답변 해드리겠습니다 뀨뀨 🤗",
};

export const useChatbotStore = create<ChatbotStore>((set) => ({
  messages: [GREETING_MESSAGE],
  sessionId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setSessionId: (id) => set({ sessionId: id }),

  reset: () => set({ messages: [GREETING_MESSAGE], sessionId: null }),
}));
