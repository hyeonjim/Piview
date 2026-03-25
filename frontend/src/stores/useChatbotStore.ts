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

export const useChatbotStore = create<ChatbotStore>((set) => ({
  messages: [],
  sessionId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setSessionId: (id) => set({ sessionId: id }),

  reset: () => set({ messages: [], sessionId: null }),
}));
