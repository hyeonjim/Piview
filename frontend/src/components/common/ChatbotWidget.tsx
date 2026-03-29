"use client";

/**
 * components/common/ChatbotWidget.tsx
 * 챗봇 FAB + 플로팅 패널 UI
 *
 * - 우측에 붙는 플로팅 패널 (배경 흐림 없음)
 * - sessionId 자동 관리 (useChatbot 훅)
 * - 추천 제품 → ProductCard modal variant
 * - context: screen, currentProductId 전달
 */

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, RotateCcw } from "lucide-react";
import { useChatbot } from "@/hooks";
import { useChatbotStore } from "@/stores";
import ProductCard from "@/components/common/ProductCard";
import type { ChatbotClientContext } from "@/types/chatbot";

// Gemini 스타일 아이콘 — 브랜드 컬러 적용
function GaminiIcon({
  size = 20,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 2C14 8.627 8.627 14 2 14C8.627 14 14 19.373 14 26C14 19.373 19.373 14 26 14C19.373 14 14 8.627 14 2Z"
        fill={color}
      />
    </svg>
  );
}

interface ChatbotWidgetProps {
  context?: ChatbotClientContext;
}

export default function ChatbotWidget({ context }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 대화 내역은 Zustand store에서 — 페이지 이동 후에도 유지
  const messages = useChatbotStore((state) => state.messages);
  const setChatKeyboardOpen = useChatbotStore((state) => state.setChatKeyboardOpen);
  // 키보드 열림 상태 — BottomNav 숨김 시 패널 하단을 bottom-0으로 확장
  const isChatKeyboardOpen = useChatbotStore((state) => state.isChatKeyboardOpen);
  const { isPending, sendMessage, resetSession } = useChatbot();

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isPending) return;
    setInput("");
    sendMessage(trimmedInput, context);
  };

  const handleReset = () => {
    resetSession();
    setInput("");
  };

  const handleClose = () => {
    setIsOpen(false);
    // 패널 닫힐 때 키보드 상태 초기화
    setChatKeyboardOpen(false);
  };

  return (
    <>
      {/* 챗봇 패널 — 오른쪽에 붙는 플로팅 패널, 배경 흐림 없음 */}
      {isOpen && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-80 flex justify-center pointer-events-none">
          <div className="relative w-full h-full pointer-events-none max-w-app">
            <div className={`absolute right-0 top-[10%] w-[72%] flex flex-col bg-white pointer-events-auto rounded-tl-[16px] shadow-[-4px_0_24px_rgba(0,0,0,0.10)] transition-[bottom] duration-200 ${isChatKeyboardOpen ? "bottom-0" : "bottom-14"}`}>
              {/* 핸들 바 */}
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-8 h-1 rounded-full bg-[#e7e6e5]" />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0ede8] shrink-0">
                <div className="flex items-center gap-2">
                  <GaminiIcon size={24} color="#cacde6" />
                  <span className="text-[18px] font-bold text-[#676769]">
                    Gamini
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={handleReset}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-[#737475] hover:bg-[#f0f3f5] transition-colors"
                      title="새 대화 시작"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-[#737475] hover:bg-[#f0f3f5] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 [scrollbar-width:none]">
                {/* 대화 메시지 */}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-[#e0e3f7] text-[var(--color-text-primary)]"
                          : "bg-[#f1f4f5] text-[var(--color-text-primary)] rounded-bl-sm"
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* 추천 제품 카드 — ProductCard modal variant */}
                    {message.role === "assistant" &&
                      message.products &&
                      message.products.length > 0 && (
                        <div className="w-full flex flex-col gap-1 mt-1">
                          {message.products.map((product, productIndex) =>
                            product.productId ? (
                              <ProductCard
                                key={productIndex}
                                id={product.productId}
                                name={product.name}
                                brand={product.brandName ?? ""}
                                imageUrl={product.imageUrl ?? undefined}
                                variant="modal"
                                showLike={false}
                              />
                            ) : null
                          )}
                        </div>
                      )}
                  </div>
                ))}

                {/* 로딩 인디케이터 */}
                {isPending && (
                  <div className="flex items-start">
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#f1f5f7] flex items-center gap-2">
                      <Loader2
                        size={13}
                        className="animate-spin text-[#cacde6]"
                      />
                      <span className="text-[13px] text-[var(--color-text-muted)]">
                        분석 중...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 */}
              <div className="px-4 py-3 border-t border-[#f0ede8] shrink-0">
                <div className="flex items-center gap-2 bg-[#f2f3f5] rounded-full px-4 py-2.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing)
                        handleSend();
                    }}
                    onFocus={() => setChatKeyboardOpen(true)}
                    onBlur={() => setChatKeyboardOpen(false)}
                    placeholder="궁금한 점을 물어보세요"
                    className="flex-1 min-w-0 bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                    disabled={isPending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isPending}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#cacde6] border-none cursor-pointer disabled:opacity-40 disabled:cursor-default transition-opacity active:scale-[0.93] shrink-0"
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB 버튼 — BottomNav와 동일한 fixed + max-w-app 컨테이너 패턴 */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-70 flex justify-center pointer-events-none pb-[calc(56px+env(safe-area-inset-bottom,0px)+16px)]">
          <div className="relative w-full pointer-events-none max-w-app">
            <button
              onClick={() => setIsOpen(true)}
              className="absolute bottom-0 right-4 w-12 h-12 rounded-full bg-[#cccee6] border-none cursor-pointer flex items-center justify-center transition-all active:scale-[0.93] pointer-events-auto "
              aria-label="AI 챗봇 열기"
            >
              <GaminiIcon size={22} color="white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
