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

// ── fix: useState, useCallback import 추가 ──────────────────────────
import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GENDER_QUESTION,
  COMMON_QUESTIONS,
  // ── fix: MALE_QUESTIONS/FEMALE_QUESTIONS → 실제 export명으로 교체 ──
  WOMEN_QUESTIONS,
  MEN_QUESTIONS,
  ALLERGY_QUESTION,
  SKIN_TYPE_MAP,
} from "@/constants";
// ── fix: useSurveyStore 실제 사용으로 교체 (로컬 state 제거) ─────────
import { useSurveyStore } from "@/stores/useSurveyStore";

/** 전체 질문 수 (성별 1 + 공통 3 + 성별 맞춤 3 + 알레르기 1) */
const TOTAL_QUESTIONS = 8;

/**
 * 질문 번호(1~8)와 성별로 해당 SurveyQuestion 반환
 * ── fix: 이전에는 선언만 하고 호출하지 않아 currentQ 항상 0이었음
 *        이제 컴포넌트에서 직접 호출해 질문을 결정
 */
function getQuestionByNumber(number: number, gender: "women" | "men") {
  if (number === 1) return GENDER_QUESTION;
  if (number === 2) return COMMON_QUESTIONS[0]; // 연령대
  if (number === 3) return COMMON_QUESTIONS[1]; // 세안 후 피부
  if (number === 4) return COMMON_QUESTIONS[2]; // 제품 반응
  if (number >= 5 && number <= 7) {
    // ── fix: MALE/FEMALE_QUESTIONS → MEN/WOMEN_QUESTIONS ──
    const genderQuestions = gender === "men" ? MEN_QUESTIONS : WOMEN_QUESTIONS;
    return genderQuestions[number - 5];
  }
  if (number === 8) return ALLERGY_QUESTION;
  return null;
}

export default function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const questionNumber = parseInt(id, 10); // 1-based URL 파라미터

  const router = useRouter();

  // ── fix: 로컬 state 제거 → useSurveyStore로 통합
  //        페이지 전환(이전/다음) 시 답변·성별 유지됨
  const { gender, answers, setGender, setAnswer, resetSurvey } =
    useSurveyStore();

  // ── fix: getQuestionByNumber 실제 호출 — URL id + store gender 기반
  const question = getQuestionByNumber(questionNumber, gender);

  // 잘못된 URL id 진입 시 안전하게 처리
  if (!question) {
    router.replace("/skin-test/survey/1");
    return null;
  }

  const selectedAnswer = answers[question.id];
  const progress = (questionNumber / TOTAL_QUESTIONS) * 100;
  const isLast = questionNumber === TOTAL_QUESTIONS;
  const isAllergy = question.id === 6;
  const isGender = question.id === -1;

  // ── fix: store의 setAnswer/setGender 사용
  const selectAnswer = useCallback(
    (value: string) => {
      setAnswer(question.id, value);
      // 성별 선택 시 store에 gender 저장
      // store gender 타입이 "women"|"men"으로 통일되어 변환 불필요
      if (question.id === -1 && (value === "women" || value === "men")) {
        setGender(value);
      }
    },
    [question.id, setAnswer, setGender],
  );

  /** 다음 질문 또는 결과 페이지로 이동 */
  const goNext = () => {
    if (!selectedAnswer) return;
    if (isLast) {
      // 세안 후 피부 상태(question id: 1) 기준으로 피부 타입 결정
      // ⚠️ API 연동 시 BE/AI 분석 결과로 교체
      const skinType = SKIN_TYPE_MAP[answers[1]] ?? "combination";

      // ── fix: result에 concerns(고민), age(연령대) 파라미터도 함께 전달 ──
      //        이전에는 type만 넘겨 result 페이지 고민·연령대 항상 기본값 표시됨
      const concern = answers[5] ?? ""; // 피부 고민 (5번 질문)
      const ageGroup = answers[0] ?? ""; // 연령대 (0번 질문)
      const allergy = answers[6] ?? ""; // 주의 성분 (6번 질문)

      const queryParams = new URLSearchParams({ type: skinType });
      if (concern) queryParams.set("concerns", concern);
      if (ageGroup) queryParams.set("age", ageGroup);
      if (allergy && allergy !== "none") queryParams.set("allergies", allergy);

      resetSurvey(); // 설문 완료 후 스토어 초기화
      router.push(`/skin-test/result?${queryParams.toString()}`);
    } else {
      router.push(`/skin-test/survey/${questionNumber + 1}`);
    }
  };

  /** 이전 질문 또는 skin-test 선택 페이지로 이동 */
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
            : gender === "men"
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
            Q{questionNumber}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 px-6 pb-6 pt-3 flex items-center justify-between bg-white border-t border-border">
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
