"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GENDER_QUESTION,
  COMMON_QUESTIONS,
  SKIN_PROBLEM_QUESTION,
} from "@/constants";
import { useSurveyStore } from "@/stores";
import { useSurveySubmit } from "@/hooks";

import type { SurveySubmitRequest } from "@/types/user";
import type { AgeGroup, Gender } from "@/types/user";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const PROGRESS_TEXT_STYLE = {
  fontSize: "15px",
  minWidth: "36px",
  textAlign: "right" as const,
};
const CATEGORY_TEXT_STYLE = { fontSize: "15px" };
const SKIN_PROBLEM_BADGE_STYLE = {
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "8px",
  backgroundColor: "#E8F5E9",
  color: "#2E7D32",
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
};
const PREV_BTN_STYLE = { fontSize: "15px" };
const NEXT_BTN_BASE = { borderRadius: "20px", fontSize: "15px" };

/** 전체 질문 수: 성별(1) + 연령대(1) + Q3~Q6(4) + 피부고민(1) = 7 */
const TOTAL_QUESTIONS = 7;

/**
 * 페이지 번호 → 질문 반환
 * 1: 성별, 2: 연령대, 3~6: Q3~Q6(공통), 7: 피부고민
 */
function getQuestionByNumber(number: number) {
  if (number === 1) return GENDER_QUESTION;       // id: -1
  if (number === 2) return COMMON_QUESTIONS[0];   // id: 0  연령대
  if (number === 3) return COMMON_QUESTIONS[1];   // id: 1  Q3
  if (number === 4) return COMMON_QUESTIONS[2];   // id: 2  Q4
  if (number === 5) return COMMON_QUESTIONS[3];   // id: 3  Q5
  if (number === 6) return COMMON_QUESTIONS[4];   // id: 4  Q6
  if (number === 7) return SKIN_PROBLEM_QUESTION; // id: 5  Q7 (다중선택)
  return null;
}

/**
 * answers[questionId] value → API A/B/C/D 변환
 * Q3~Q6 value가 이미 "A"|"B"|"C"|"D" 이므로 options 인덱스로 변환
 */
function valueToOption(
  questionId: number,
  value: string,
): "A" | "B" | "C" | "D" {
  const question = COMMON_QUESTIONS.find((q) => q.id === questionId);
  const idx = question?.options.findIndex((o) => o.value === value) ?? -1;
  return (["A", "B", "C", "D"][idx] ?? "A") as "A" | "B" | "C" | "D";
}

/** ageGroup value → AgeGroup enum */
function valueToAgeGroup(value: string): AgeGroup {
  const map: Record<string, AgeGroup> = {
    TEENS: "TEENS",
    TWENTIES: "TWENTIES",
    THIRTIES: "THIRTIES",
    FORTIES_PLUS: "FORTIES_PLUS",
  };
  return map[value] ?? "TWENTIES";
}

export default function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const questionNumber = parseInt(id, 10);

  const router = useRouter();
  const {
    gender,
    answers,
    skinProblems,
    analysisId,
    setGender,
    setAnswer,
    toggleSkinProblem,
    resetSurvey,
  } = useSurveyStore();
  const { mutate: submitSurvey, isPending } = useSurveySubmit();

  const question = getQuestionByNumber(questionNumber);
  if (!question) {
    router.replace("/skin-test/survey/1");
    return null;
  }

  const isSkinProblem = question.id === 5;
  const isGender = question.id === -1;
  const isLast = questionNumber === TOTAL_QUESTIONS;
  const progress = (questionNumber / TOTAL_QUESTIONS) * 100;

  const selectedAnswer = answers[question.id];
  // Q7은 1개 이상 선택이면 통과, 나머지는 단일 선택 필수
  const hasAnswer = isSkinProblem ? skinProblems.length > 0 : !!selectedAnswer;

  const selectAnswer = useCallback(
    (value: string) => {
      if (isSkinProblem) {
        toggleSkinProblem(value);
        return;
      }
      setAnswer(question.id, value);
      if (question.id === -1 && (value === "MEN" || value === "WOMEN")) {
        setGender(value as "WOMEN" | "MEN");
      }
    },
    [question.id, isSkinProblem, setAnswer, setGender, toggleSkinProblem],
  );

  const goNext = () => {
    if (!hasAnswer || isPending) return;

    if (isLast) {
      if (!analysisId) {
        router.replace("/skin-test/photo");
        return;
      }

      // ── POST /skin/surveys 요청 body 조립 ──
      const request: SurveySubmitRequest = {
        gender: (answers[-1] as Gender) ?? gender,
        ageGroup: valueToAgeGroup(answers[0]),
        question3: valueToOption(1, answers[1]),
        question4: valueToOption(2, answers[2]),
        question5: valueToOption(3, answers[3]),
        question6: valueToOption(4, answers[4]),
        skinProblems,
      };

      submitSurvey(
        { analysisId, body: request },
        {
          onSuccess: (data) => {
            resetSurvey();
            router.push(
              `/skin-test/result?type=${data.mySkinType.toLowerCase()}`,
            );
          },
          onError: () => {
            resetSurvey();
            router.push(`/skin-test/result?type=combination`);
          },
        },
      );
    } else {
      router.push(`/skin-test/survey/${questionNumber + 1}`);
    }
  };

  const goPrev = () => {
    if (questionNumber > 1) {
      router.push(`/skin-test/survey/${questionNumber - 1}`);
    } else {
      router.push("/skin-test");
    }
  };

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
            {questionNumber}/{TOTAL_QUESTIONS}
          </span>
        </div>
        <p className="text-text-muted" style={CATEGORY_TEXT_STYLE}>
          {isGender
            ? "맞춤 진단 시작"
            : gender === "MEN"
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
              backgroundColor: isSkinProblem
                ? "#E8F5E9"
                : isGender
                  ? "#E3F2FD"
                  : "var(--color-brand-bg)",
              fontSize: "11px",
              fontWeight: 700,
              color: isSkinProblem
                ? "#2E7D32"
                : isGender
                  ? "#1565C0"
                  : "var(--color-brand)",
            }}
          >
            Q{questionNumber}
          </span>
          {isSkinProblem && (
            <span
              className="ml-2 inline-flex items-center"
              style={SKIN_PROBLEM_BADGE_STYLE}
            >
              ✅ 복수 선택 가능
            </span>
          )}
        </div>
        <h2 className="text-text-primary font-semibold" style={QUESTION_STYLE}>
          {question.question}
        </h2>

        <div className="flex flex-col gap-2.5 mt-6">
          {question.options.map((option) => {
            const isSelected = isSkinProblem
              ? skinProblems.includes(option.value)
              : selectedAnswer === option.value;

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
                    color: "var(--color-product-name)",
                    lineHeight: 1.4,
                    flex: 1,
                  }}
                >
                  {option.text}
                </span>
                {isSelected && (
                  <div
                    className="shrink-0 flex items-center justify-center bg-brand"
                    style={{
                      ...CHECK_CIRCLE_STYLE,
                      borderRadius: isSkinProblem ? "4px" : "50%",
                    }}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 px-6 pb-6 pt-3 flex items-center justify-between bg-white border-t border-border">
        <button
          onClick={goPrev}
          className="bg-transparent border-none cursor-pointer px-4 py-3 hover:opacity-70 transition-opacity text-text-hint font-semibold"
          style={PREV_BTN_STYLE}
        >
          ← 이전
        </button>
        <button
          onClick={goNext}
          disabled={isPending}
          className="px-6 py-2.5 transition-all duration-200 border-none font-semibold"
          style={{
            ...NEXT_BTN_BASE,
            backgroundColor:
              hasAnswer && !isPending ? "var(--color-brand)" : "#F0F0F0",
            color:
              hasAnswer && !isPending
                ? "var(--color-bg-card)"
                : "var(--color-text-disabled)",
            cursor: hasAnswer && !isPending ? "pointer" : "default",
            boxShadow:
              hasAnswer && !isPending
                ? "0 2px 8px rgba(162,170,123,0.3)"
                : "none",
          }}
        >
          {isPending ? "제출 중..." : isLast ? "완료 ✓" : "다음 →"}
        </button>
      </div>
    </div>
  );
}
