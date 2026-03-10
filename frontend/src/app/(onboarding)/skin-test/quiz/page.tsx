"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface QuizQuestion {
  id: number;
  question: string;
  options: { icon: string; text: string; value: string }[];
}

const genderQuestion: QuizQuestion = {
  id: -1,
  question: "성별을\n알려주세요",
  options: [
    { icon: "👩", text: "여성", value: "female" },
    { icon: "👨", text: "남성", value: "male" },
  ],
};

const commonQuestions: QuizQuestion[] = [
  {
    id: 0,
    question: "연령대를\n알려주세요",
    options: [
      { icon: "🧒", text: "10대", value: "10s" },
      { icon: "🧑", text: "20대", value: "20s" },
      { icon: "👨", text: "30대", value: "30s" },
      { icon: "🧔", text: "40대 이상", value: "40s+" },
    ],
  },
  {
    id: 1,
    question: "세안 후 1시간 뒤\n내 피부는?",
    options: [
      { icon: "💧", text: "전체적으로 당기고 건조함", value: "dry" },
      { icon: "🔀", text: "T존만 기름지고 볼은 건조함", value: "combination" },
      { icon: "💦", text: "전체적으로 기름지고 번들거림", value: "oily" },
      { icon: "🔴", text: "따갑고 빨개짐", value: "sensitive" },
    ],
  },
  {
    id: 2,
    question: "화장품을 처음 사용할 때\n피부 반응은?",
    options: [
      { icon: "😌", text: "대부분의 제품에 별다른 반응 없음", value: "normal" },
      { icon: "😣", text: "가끔 따갑거나 붉어짐", value: "mild_sensitive" },
      { icon: "🚨", text: "자주 트러블이 생김", value: "very_sensitive" },
      { icon: "🤷", text: "잘 모르겠음", value: "unknown" },
    ],
  },
];

const femaleQuestions: QuizQuestion[] = [
  {
    id: 3,
    question: "생리 전후\n피부 변화는?",
    options: [
      { icon: "😊", text: "큰 변화 없음", value: "stable" },
      { icon: "🔴", text: "턱 라인에 트러블이 생김", value: "hormonal_acne" },
      { icon: "💧", text: "건조해지고 각질이 일어남", value: "dry_period" },
      { icon: "💦", text: "유분이 많아지고 번들거림", value: "oily_period" },
    ],
  },
  {
    id: 4,
    question: "메이크업 후\n피부 상태는?",
    options: [
      { icon: "✨", text: "하루 종일 잘 유지됨", value: "lasting" },
      { icon: "🫠", text: "T존에서 무너짐", value: "t_zone_melt" },
      { icon: "🏜️", text: "건조하게 들뜸", value: "dry_cakey" },
      { icon: "😣", text: "피부가 답답하고 트러블 생김", value: "irritated" },
    ],
  },
  {
    id: 5,
    question: "가장 신경 쓰이는\n피부 고민은?",
    options: [
      { icon: "🔴", text: "여드름/트러블", value: "acne" },
      { icon: "✨", text: "주름/탄력", value: "wrinkle" },
      { icon: "🌑", text: "색소/잡티", value: "pigmentation" },
      { icon: "🏜️", text: "건조/각질", value: "dryness" },
    ],
  },
];

const maleQuestions: QuizQuestion[] = [
  {
    id: 3,
    question: "면도 후\n피부 상태는?",
    options: [
      { icon: "😌", text: "특별한 자극 없음", value: "no_irritation" },
      { icon: "🔴", text: "붉어지고 따가움", value: "razor_burn" },
      { icon: "🧴", text: "건조하고 당김", value: "dry_after" },
      { icon: "😤", text: "인그로운 헤어/트러블", value: "ingrown" },
    ],
  },
  {
    id: 4,
    question: "낮 동안의\n피부 상태는?",
    options: [
      { icon: "😎", text: "큰 변화 없이 괜찮음", value: "stable" },
      { icon: "💦", text: "이마/코가 번들거림", value: "t_zone_oily" },
      { icon: "🏜️", text: "볼이 건조하고 당김", value: "cheek_dry" },
      { icon: "😰", text: "전체적으로 기름짐", value: "all_oily" },
    ],
  },
  {
    id: 5,
    question: "가장 신경 쓰이는\n피부 고민은?",
    options: [
      { icon: "🔴", text: "여드름/트러블", value: "acne" },
      { icon: "🪒", text: "면도 자극/인그로운", value: "shaving" },
      { icon: "👃", text: "블랙헤드/모공", value: "pores" },
      { icon: "🏜️", text: "건조/각질", value: "dryness" },
    ],
  },
];

const allergyQuestion: QuizQuestion = {
  id: 6,
  question: "주의하는 성분이\n있나요?",
  options: [
    { icon: "✅", text: "없음 (모든 성분 가능)", value: "none" },
    { icon: "🌸", text: "향료/향수 알레르기", value: "fragrance" },
    { icon: "🧪", text: "알코올 자극", value: "alcohol" },
    { icon: "⚗️", text: "방부제(파라벤) 주의", value: "preservative" },
  ],
};

export default function QuizPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const genderQuestions = gender === "male" ? maleQuestions : femaleQuestions;
  const questions = [
    genderQuestion,
    ...commonQuestions,
    ...genderQuestions,
    allergyQuestion,
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
      if (question.id === -1 && (value === "male" || value === "female"))
        setGender(value as "female" | "male");
    },
    [question.id],
  );

  const goNext = useCallback(() => {
    if (!selectedAnswer) return;
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      const skinMap: Record<string, string> = {
        dry: "dry",
        combination: "combination",
        oily: "oily",
        sensitive: "sensitive",
      };
      router.push(
        `/skin-test/result?type=${skinMap[answers[1]] || "combination"}`,
      );
    }
  }, [currentQ, selectedAnswer, questions.length, router, answers]);

  const goPrev = useCallback(() => {
    if (currentQ > 0) setCurrentQ((p) => p - 1);
    else router.push("/skin-test");
  }, [currentQ, router]);

  return (
    <div className="flex flex-col min-h-full bg-white relative">
      {/* 진행 바 */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-bg-chip">
            <div
              className="h-full rounded-full transition-all duration-300 bg-brand"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className="text-text-muted"
            style={{ fontSize: "15px", minWidth: "36px", textAlign: "right" }}
          >
            {currentQ + 1}/{questions.length}
          </span>
        </div>
        <p className="text-text-muted" style={{ fontSize: "15px" }}>
          {isGender
            ? "맞춤 진단 시작"
            : gender === "male"
              ? "남성 맞춤 진단"
              : "여성 맞춤 진단"}
        </p>
      </div>

      {/* 질문 콘텐츠 */}
      <div className="flex-1 px-6 flex flex-col overflow-hidden pb-24">
        {/* 뱃지 */}
        <div className="mt-6">
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              fontSize: "11px",
              fontWeight: 700,
              backgroundColor: isAllergy
                ? "#FFF3E0"
                : isGender
                  ? "#E3F2FD"
                  : "var(--color-brand-bg)",
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
              className="ml-2 inline-flex items-center font-semibold"
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "8px",
                backgroundColor: "#FFF3E0",
                color: "#E65100",
              }}
            >
              🚨 성분 안전
            </span>
          )}
        </div>

        {/* 질문 텍스트 */}
        <h2
          className="text-text-primary font-semibold"
          style={{
            fontSize: "22px",
            lineHeight: 1.4,
            marginTop: "12px",
            whiteSpace: "pre-line",
          }}
        >
          {question.question}
        </h2>

        {/* 선택지 */}
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
                    : "var(--color-bg-chip)",
                  border: `1.5px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
                  boxShadow: isSelected
                    ? "0px 2px 8px rgba(162,170,123,0.15)"
                    : "none",
                }}
              >
                <span style={{ fontSize: "20px", flexShrink: 0 }}>
                  {option.icon}
                </span>
                <span
                  className="text-text-primary"
                  style={{
                    fontSize: "15px",
                    fontWeight: isSelected ? 600 : 400,
                    lineHeight: 1.4,
                  }}
                >
                  {option.text}
                </span>
                {isSelected && (
                  <div
                    className="ml-auto shrink-0 flex items-center justify-center bg-brand"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-6 pb-6 pt-3 flex items-center justify-between bg-white border-t border-bg-chip">
        <button
          onClick={goPrev}
          className="bg-transparent border-none cursor-pointer px-4 py-3 text-text-hint font-medium hover:opacity-70 transition-opacity"
          style={{ fontSize: "15px" }}
        >
          ← 이전
        </button>
        <button
          onClick={goNext}
          className="px-6 py-2.5 font-semibold transition-all duration-200"
          style={{
            borderRadius: "20px",
            fontSize: "15px",
            border: "none",
            backgroundColor: selectedAnswer
              ? "var(--color-brand)"
              : "var(--color-border)",
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
