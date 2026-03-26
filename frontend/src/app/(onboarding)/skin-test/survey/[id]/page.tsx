"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  GENDER_QUESTION,
  COMMON_QUESTIONS,
  SKIN_PROBLEM_QUESTION,
} from "@/constants";
import { useSurveyStore } from "@/stores";
import { useSurveySubmit } from "@/hooks";

import type { SurveySubmitRequest } from "@/types/user";
import type { AgeGroup, Gender } from "@/types/user";

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
  const index = question?.options.findIndex((option) => option.value === value) ?? -1;
  return (["A", "B", "C", "D"][index] ?? "A") as "A" | "B" | "C" | "D";
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
  const progressPercent = (questionNumber / TOTAL_QUESTIONS) * 100;

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

      // POST /skin/surveys 요청 body 조립
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
    <div className="flex flex-col h-dvh bg-bg-surface relative">
      {/* 진행 상태 바 */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-bg-chip">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[13px] text-text-muted min-w-9 text-right tabular-nums">
            {questionNumber}/{TOTAL_QUESTIONS}
          </span>
        </div>
      </div>

      {/* 질문 영역 */}
      <div className="flex-1 px-6 flex flex-col overflow-y-auto pb-24">
        <div className="mt-8">
          {/* 질문 번호 배지 */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-brand-bg text-brand text-[14px] font-bold flex items-center justify-center shrink-0">
              Q{questionNumber}
            </span>

            {/* 다중 선택 안내 배지 */}
            {isSkinProblem && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-bg text-brand">
                복수 선택 가능
              </span>
            )}
          </div>

          {/* 질문 텍스트 */}
          <h2 className="text-[18px] font-semibold text-[#515152] leading-[1.45] mt-3">
            {question.question}
          </h2>
        </div>

        {/* 선택지 목록 */}
        <div className="flex flex-col gap-2.5 mt-6">
          {question.options.map((option) => {
            const isSelected = isSkinProblem
              ? skinProblems.includes(option.value)
              : selectedAnswer === option.value;

            return (
              <button
                key={option.value}
                onClick={() => selectAnswer(option.value)}
                className={[
                  "w-full flex items-center justify-between gap-3 text-left transition-all duration-200 cursor-pointer",
                  "min-h-[56px] px-4 py-3.5 rounded-2xl border-[1.5px]",
                  isSelected
                    ? "bg-brand-bg border-[#aeaeab] shadow-[0px_2px_8px_rgba(166,157,146,0.2)]"
                    : "bg-white border-border-subtle",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[16px] leading-[1.45] flex-1",
                    isSelected
                      ? "font-semibold text-[#434345]"
                      : "font-semibold text-[#434345]",
                  ].join(" ")}
                >
                  {option.text}
                </span>

                {/* 선택 체크 인디케이터 */}
                {isSelected && (
                  <div
                    className={[
                      "shrink-0 w-5 h-5 flex items-center justify-center bg-[#918f8f]",
                      isSkinProblem ? "rounded-[4px]" : "rounded-full",
                    ].join(" ")}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app px-6 pb-8 pt-3 flex items-center justify-between bg-bg-surface border-t border-border">
        <button
          onClick={goPrev}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity text-text-hint"
        >
          <ArrowLeft size={22} />
        </button>

        <button
          onClick={goNext}
          disabled={isPending}
          className={[
            "w-11 h-11 flex items-center justify-center rounded-full border-none transition-all duration-200",
            hasAnswer && !isPending
              ? "bg-[#beb7a2] text-white cursor-pointer shadow-[0_2px_8px_rgba(166,157,146,0.35)]"
              : "bg-bg-chip text-text-disabled cursor-default",
          ].join(" ")}
        >
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
}
