/**
 * survey.ts
 * 피부 진단 설문 질문 및 선택지 전체 정의
 * → 앱 내 고정 콘텐츠. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(onboarding)/skin-test/quiz/page.tsx → 모든 survey 상수
 */

export interface SurveyOption {
  icon: string;
  text: string;
  value: string;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  options: SurveyOption[];
}

/** 성별 질문 (id: -1, 가장 먼저 출력) */
export const GENDER_QUESTION: SurveyQuestion = {
  id: -1,
  question: "성별을\n알려주세요",
  options: [
    { icon: "👩", text: "여성", value: "women" },
    { icon: "👨", text: "남성", value: "men" },
  ],
};

/** 공통 질문 (성별 무관) */
export const COMMON_QUESTIONS: SurveyQuestion[] = [
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
      { icon: "🔴", text: "따갑고 빨개짐", value: "dehydrated" },
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

/** 여성 전용 질문 */
export const WOMEN_QUESTIONS: SurveyQuestion[] = [
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

/** 남성 전용 질문 */
export const MEN_QUESTIONS: SurveyQuestion[] = [
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

/** 알레르기 질문 (마지막, id: 6) */
export const ALLERGY_QUESTION: SurveyQuestion = {
  id: 6,
  question: "주의하는 성분이\n있나요?",
  options: [
    { icon: "✅", text: "없음 (모든 성분 가능)", value: "none" },
    { icon: "🌸", text: "향료/향수 알레르기", value: "fragrance" },
    { icon: "🧪", text: "알코올 자극", value: "alcohol" },
    { icon: "⚗️", text: "방부제(파라벤) 주의", value: "preservative" },
  ],
};



