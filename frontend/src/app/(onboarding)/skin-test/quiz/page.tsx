"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const PROGRESS_TEXT_STYLE = {
  fontSize: "15px",
  minWidth: "36px",
  textAlign: "right" as const,
};
const CATEGORY_TEXT_STYLE = { fontSize: "15px" };
const ALLERGY_BADGE_STYLE = {
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "8px",
  backgroundColor: "#FFF3E0",
  color: "#E65100",
  fontWeight: 600,
};
const QUESTION_STYLE = {
  fontSize: "22px",
  lineHeight: 1.4,
  marginTop: "12px",
  whiteSpace: "pre-line" as const,
};
const OPTION_ICON_STYLE = { fontSize: "20px", flexShrink: 0 };
const CHECK_CIRCLE_STYLE = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
};
const PREV_BTN_STYLE = { fontSize: "15px" };
const NEXT_BTN_BASE = { borderRadius: "20px", fontSize: "15px" };

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GENDER_QUESTION,
  COMMON_QUESTIONS,
  FEMALE_QUESTIONS,
  MALE_QUESTIONS,
  ALLERGY_QUESTION,
  SKIN_TYPE_MAP,
} from "@/constants";

export default function QuizPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const genderQuestions = gender === "male" ? MALE_QUESTIONS : FEMALE_QUESTIONS;
  const questions = [
    GENDER_QUESTION,
    ...COMMON_QUESTIONS,
    ...genderQuestions,
    ALLERGY_QUESTION,
  ];
  const question = questions[currentQ];
  const selectedAnswer = answers[question.id];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;
  const isAllergy = question.id === 6;
  const isGender = question.id === -1;

  const selectAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
      if (question.id === -1 && (value === "male" || value === "female")) {
        setGender(value as "female" | "male");
      }
    },
    [question.id],
  );

  const goNext = useCallback(() => {
    if (!selectedAnswer) return;
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      const skinType = SKIN_TYPE_MAP[answers[1]] || "combination";
      router.push(`/skin-test/result?type=${skinType}`);
    }
  }, [currentQ, selectedAnswer, questions.length, answers, router]);

  const goPrev = useCallback(() => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
    else router.push("/skin-test");
  }, [currentQ, router]);

  return (
    <div className="flex flex-col min-h-full bg-white relative">
      {/* 진행바 */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-bg-chip">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-text-muted" style={PROGRESS_TEXT_STYLE}>
            {currentQ + 1}/{questions.length}
          </span>
        </div>
        <p className="text-text-muted" style={CATEGORY_TEXT_STYLE}>
          {isGender
            ? "맞춤 진단 시작"
            : gender === "male"
              ? "남성 맞춤 진단"
              : "여성 맞춤 진단"}
        </p>
      </div>

      {/* 질문 영역 */}
      <div className="flex-1 px-6 flex flex-col overflow-hidden pb-24">
        <div className="mt-6">
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: isAllergy
                ? "#FFF3E0"
                : isGender
                  ? "#E3F2FD"
                  : "var(--color-brand-bg)",
              fontSize: "11px",
              fontWeight: 700,
              color: isAllergy
                ? "#E65100"
                : isGender
                  ? "#1565C0"
                  : "var(--color-brand)",
            }}
          >
            Q{currentQ + 1}
          </span>
          {isAllergy && (
            <span
              className="ml-2 inline-flex items-center"
              style={ALLERGY_BADGE_STYLE}
            >
              🚨 성분 안전
            </span>
          )}
        </div>

        <h2 className="text-text-primary font-semibold" style={QUESTION_STYLE}>
          {question.question}
        </h2>

        <div className="flex flex-col gap-2.5 mt-6">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.value;
            return (
              <button
                key={option.value}
                onClick={() => selectAnswer(option.value)}
                className="w-full flex items-center gap-4 text-left transition-all duration-200 cursor-pointer"
                style={{
                  minHeight: "56px",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  backgroundColor: isSelected
                    ? "var(--color-brand-bg)"
                    : "#FAFAFA",
                  border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#EFEFEF"}`,
                  boxShadow: isSelected
                    ? "0px 2px 8px rgba(162,170,123,0.15)"
                    : "none",
                }}
              >
                <span style={OPTION_ICON_STYLE}>{option.icon}</span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: isSelected ? 600 : 400,
                    color: "#1A1A1A",
                    lineHeight: 1.4,
                  }}
                >
                  {option.text}
                </span>
                {isSelected && (
                  <div
                    className="ml-auto shrink-0 flex items-center justify-center bg-brand"
                    style={CHECK_CIRCLE_STYLE}
                  >
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path
                        d="M1 4L4 7L10 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pb-6 pt-3 flex items-center justify-between bg-white border-t border-border">
        <button
          onClick={goPrev}
          className="bg-transparent border-none cursor-pointer px-4 py-3 hover:opacity-70 transition-opacity text-text-hint font-medium"
          style={PREV_BTN_STYLE}
        >
          ← 이전
        </button>
        <button
          onClick={goNext}
          className="px-6 py-2.5 transition-all duration-200 border-none font-semibold"
          style={{
            ...NEXT_BTN_BASE,
            backgroundColor: selectedAnswer ? "var(--color-brand)" : "#F0F0F0",
            color: selectedAnswer ? "#FFFFFF" : "var(--color-text-disabled)",
            cursor: selectedAnswer ? "pointer" : "default",
            boxShadow: selectedAnswer
              ? "0 2px 8px rgba(162,170,123,0.3)"
              : "none",
          }}
        >
          {isLast ? "완료 ✓" : "다음 →"}
        </button>
      </div>
    </div>
  );
}
