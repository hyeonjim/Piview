"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GENDER_QUESTION,
  COMMON_QUESTIONS,
  WOMEN_QUESTIONS,
  MEN_QUESTIONS,
  ALLERGY_QUESTION,
} from "@/constants";
import { useSurveyStore } from "@/stores/useSurveyStore";
import { useSurveySubmit } from "@/hooks";

import { toGenderEnum, toAgeGroupEnum } from "@/utils/enumConvert";
import type { SurveySubmitRequest } from "@/types/user";
import type { AgeGroup, Gender } from "@/types/user";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const PROGRESS_TEXT_STYLE = { fontSize: "15px", minWidth: "36px", textAlign: "right" as const };
const CATEGORY_TEXT_STYLE = { fontSize: "15px" };
const ALLERGY_BADGE_STYLE = { fontSize: "10px", padding: "2px 8px", borderRadius: "8px", backgroundColor: "#FFF3E0", color: "#E65100", fontWeight: 600 };
const QUESTION_STYLE = { fontSize: "22px", lineHeight: 1.4, marginTop: "12px", whiteSpace: "pre-line" as const };
const OPTION_ICON_STYLE = { fontSize: "20px", flexShrink: 0 };
const CHECK_CIRCLE_STYLE = { width: "20px", height: "20px", borderRadius: "50%" };
const PREV_BTN_STYLE = { fontSize: "15px" };
const NEXT_BTN_BASE = { borderRadius: "20px", fontSize: "15px" };

/** 전체 질문 수 */
const TOTAL_QUESTIONS = 8;

function getQuestionByNumber(number: number, gender: "women" | "men") {
  if (number === 1) return GENDER_QUESTION;
  if (number === 2) return COMMON_QUESTIONS[0];
  if (number === 3) return COMMON_QUESTIONS[1];
  if (number === 4) return COMMON_QUESTIONS[2];
  if (number >= 5 && number <= 7) {
    const genderQuestions = gender === "men" ? MEN_QUESTIONS : WOMEN_QUESTIONS;
    return genderQuestions[number - 5];
  }
  if (number === 8) return ALLERGY_QUESTION;
  return null;
}

/**
 * 질문 선택지의 value → A/B/C/D 변환
 * 백엔드는 선택지 인덱스를 알파벳으로 받음
 */
function valueToOption(questionId: number, value: string, gender: "women" | "men"): "A" | "B" | "C" | "D" {
  let options: { value: string }[] = [];
  if (questionId === 1) options = COMMON_QUESTIONS[1].options;
  else if (questionId === 2) options = COMMON_QUESTIONS[2].options;
  else if (questionId === 3) options = (gender === "men" ? MEN_QUESTIONS : WOMEN_QUESTIONS)[0].options;
  else if (questionId === 6) options = ALLERGY_QUESTION.options;
  const idx = options.findIndex((o) => o.value === value);
  return (["A", "B", "C", "D"][idx] ?? "A") as "A" | "B" | "C" | "D";
}

/** ageGroup 값 → AgeGroup enum */
function valueToAgeGroup(value: string): AgeGroup {
  const map: Record<string, AgeGroup> = { "10s": "10", "20s": "20", "30s": "30", "40s+": "40" };
  return map[value] ?? "20";
}

/** 피부 고민(id:5) 답변 → skinProblems 배열 */
function valueToSkinProblems(concernValue: string): string[] {
  if (!concernValue || concernValue === "") return [];
  return [concernValue];
}

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const questionNumber = parseInt(id, 10);

  const router = useRouter();
  const { gender, answers, setGender, setAnswer, resetSurvey } = useSurveyStore();
  const { mutate: submitSurvey, isPending } = useSurveySubmit();

  const question = getQuestionByNumber(questionNumber, gender);
  if (!question) {
    router.replace("/skin-test/survey/1");
    return null;
  }

  const selectedAnswer = answers[question.id];
  const progress = (questionNumber / TOTAL_QUESTIONS) * 100;
  const isLast = questionNumber === TOTAL_QUESTIONS;
  const isAllergy = question.id === 6;
  const isGender = question.id === -1;

  const selectAnswer = useCallback(
    (value: string) => {
      setAnswer(question.id, value);
      if (question.id === -1 && (value === "men" || value === "women")) {
        setGender(value as "women" | "men");
      }
    },
    [question.id, setAnswer, setGender],
  );

  const goNext = () => {
    if (!selectedAnswer || isPending) return;

    if (isLast) {
      // ── POST /skin/surveys 요청 body 조립 ──
      const request: SurveySubmitRequest = {
        gender: toGenderEnum(answers[-1] as Gender ?? gender),
        ageGroup: toAgeGroupEnum(valueToAgeGroup(answers[0])),
        question3: valueToOption(1, answers[1], gender),
        question4: valueToOption(2, answers[2], gender),
        question5: valueToOption(3, answers[3], gender),
        question6: valueToOption(6, answers[6], gender),
        skinProblems: valueToSkinProblems(answers[5]),
      };

      submitSurvey(request, {
        onSuccess: (data) => {
          resetSurvey();
          // 응답의 mySkinType으로 결과 페이지 이동
          router.push(`/skin-test/result?type=${data.mySkinType.toLowerCase()}`);
        },
        onError: () => {
          // 실패해도 로컬 계산값으로 결과 페이지 이동
          const fallback = answers[1] ?? "combination";
          resetSurvey();
          router.push(`/skin-test/result?type=${fallback}`);
        },
      });
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
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-text-muted" style={PROGRESS_TEXT_STYLE}>{questionNumber}/{TOTAL_QUESTIONS}</span>
        </div>
        <p className="text-text-muted" style={CATEGORY_TEXT_STYLE}>
          {isGender ? "맞춤 진단 시작" : gender === "men" ? "남성 맞춤 진단" : "여성 맞춤 진단"}
        </p>
      </div>

      {/* 질문 영역 */}
      <div className="flex-1 px-6 flex flex-col overflow-hidden pb-24">
        <div className="mt-6">
          <span className="inline-flex items-center justify-center" style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: isAllergy ? "#FFF3E0" : isGender ? "#E3F2FD" : "var(--color-brand-bg)", fontSize: "11px", fontWeight: 700, color: isAllergy ? "#E65100" : isGender ? "#1565C0" : "var(--color-brand)" }}>
            Q{questionNumber}
          </span>
          {isAllergy && <span className="ml-2 inline-flex items-center" style={ALLERGY_BADGE_STYLE}>🚨 성분 안전</span>}
        </div>
        <h2 className="text-text-primary font-semibold" style={QUESTION_STYLE}>{question.question}</h2>
        <div className="flex flex-col gap-2.5 mt-6">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.value;
            return (
              <button key={option.value} onClick={() => selectAnswer(option.value)} className="w-full flex items-center gap-4 text-left transition-all duration-200 cursor-pointer" style={{ minHeight: "56px", padding: "13px 16px", borderRadius: "12px", backgroundColor: isSelected ? "var(--color-brand-bg)" : "#FAFAFA", border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#EFEFEF"}`, boxShadow: isSelected ? "0px 2px 8px rgba(162,170,123,0.15)" : "none" }}>
                <span style={OPTION_ICON_STYLE}>{option.icon}</span>
                <span style={{ fontSize: "15px", fontWeight: isSelected ? 600 : 400, color: "#1A1A1A", lineHeight: 1.4 }}>{option.text}</span>
                {isSelected && (
                  <div className="ml-auto shrink-0 flex items-center justify-center bg-brand" style={CHECK_CIRCLE_STYLE}>
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
        <button onClick={goPrev} className="bg-transparent border-none cursor-pointer px-4 py-3 hover:opacity-70 transition-opacity text-text-hint font-medium" style={PREV_BTN_STYLE}>← 이전</button>
        <button onClick={goNext} disabled={isPending} className="px-6 py-2.5 transition-all duration-200 border-none font-semibold" style={{ ...NEXT_BTN_BASE, backgroundColor: selectedAnswer && !isPending ? "var(--color-brand)" : "#F0F0F0", color: selectedAnswer && !isPending ? "#FFFFFF" : "var(--color-text-disabled)", cursor: selectedAnswer && !isPending ? "pointer" : "default", boxShadow: selectedAnswer && !isPending ? "0 2px 8px rgba(162,170,123,0.3)" : "none" }}>
          {isPending ? "제출 중..." : isLast ? "완료 ✓" : "다음 →"}
        </button>
      </div>
    </div>
  );
}
