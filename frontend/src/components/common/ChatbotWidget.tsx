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
  const messages = useChatbotStore((s) => s.messages);
  const { isPending, sendMessage, resetSession } = useChatbot();

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  // 열릴 때 input 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;
    setInput("");
    sendMessage(trimmed, context);
  };

  const handleReset = () => {
    resetSession();
    setInput("");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* 챗봇 패널 — 오른쪽에 붙는 플로팅 패널, 배경 흐림 없음 */}
      {isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[80] flex justify-center pointer-events-none"
          style={{ top: 0 }}
        >
          <div
            className="relative w-full h-full pointer-events-none"
            style={{ maxWidth: "var(--max-width-app)" }}
          >
            <div
              className="absolute right-0 bottom-0 flex flex-col bg-white pointer-events-auto"
              style={{
                width: "72%",
                top: "10%",
                borderRadius: "16px 0 0 0",
                boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
                bottom: "56px",
              }}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-8 h-1 rounded-full bg-[#e0ddd8]" />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0ede8] shrink-0">
                <div className="flex items-center gap-2">
                  <GaminiIcon size={18} color="var(--color-brand)" />
                  <span className="text-[15px] font-semibold text-[var(--color-text-sub)]">
                    Gamini
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={handleReset}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] hover:bg-[#f5f3f0] transition-colors"
                      title="새 대화 시작"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] hover:bg-[#f5f3f0] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 [scrollbar-width:none]">
                {/* 초기 안내 */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <GaminiIcon size={36} color="var(--color-brand)" />
                    <p className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                      피부 고민을 물어보세요
                    </p>
                    <p className="text-[13px] text-[var(--color-text-sub)] leading-relaxed">
                      피부 타입, 고민, 원하는 제품을
                      <br />
                      질문하면 Gamini가 맞춤 추천해드려요
                    </p>
                  </div>
                )}

                {/* 대화 메시지 */}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[var(--color-brand)] text-white rounded-br-sm"
                          : "bg-[#f7f5f1] text-[var(--color-text-primary)] rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* 추천 제품 카드 — ProductCard modal variant */}
                    {msg.role === "assistant" &&
                      msg.products &&
                      msg.products.length > 0 && (
                        <div className="w-full flex flex-col gap-1 mt-1">
                          {msg.products.map((product, pIdx) =>
                            product.productId ? (
                              <ProductCard
                                key={pIdx}
                                id={product.productId}
                                name={product.name}
                                brand={product.brandName ?? ""}
                                imageUrl={product.imageUrl ?? undefined}
                                imageContainerClassName=""
                                showLike={false}
                                variant="modal"
                              />
                            ) : null,
                          )}
                        </div>
                      )}
                  </div>
                ))}

                {/* 로딩 인디케이터 */}
                {isPending && (
                  <div className="flex items-start">
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#f7f5f1] flex items-center gap-2">
                      <Loader2
                        size={13}
                        className="animate-spin text-[var(--color-brand)]"
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
                <div className="flex items-center gap-2 bg-[#f7f5f1] rounded-full px-4 py-2.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing)
                        handleSend();
                    }}
                    placeholder="궁금한 점을 물어보세요"
                    className="flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                    disabled={isPending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isPending}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--color-brand)] border-none cursor-pointer disabled:opacity-40 disabled:cursor-default transition-opacity active:scale-[0.93] shrink-0"
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
        <div
          className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center pointer-events-none"
          style={{
            paddingBottom:
              "calc(56px + env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <div
            className="relative w-full pointer-events-none"
            style={{ maxWidth: "var(--max-width-app)" }}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="absolute bottom-0 right-4 w-12 h-12 rounded-full bg-[var(--color-brand)] border-none cursor-pointer flex items-center justify-center transition-all active:scale-[0.93] pointer-events-auto"
              style={{ boxShadow: "0 4px 14px rgba(166,157,146,0.5)" }}
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
