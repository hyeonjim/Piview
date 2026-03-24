/**
 * survey.ts
 * 피부 진단 설문 질문 및 선택지 전체 정의
 * → 앱 내 고정 콘텐츠. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(onboarding)/skin-test/survey/[id]/page.tsx → 모든 survey 상수
 *
 * ⚠️ Q3~Q6 선택지 순서(A/B/C/D)가 API SurveySubmitRequest 스펙과 1:1 대응
 *    선택지 순서 변경 시 반드시 백엔드 명세 확인 필요
 */

export interface SurveyOption {
  icon: string;
  text: string;
  value: string; // 내부 식별용 — API에 직접 전송되지 않음
}

export interface SurveyQuestion {
  id: number;
  question: string;
  options: SurveyOption[];
  multiSelect?: boolean; // true이면 다중 선택 허용 (Q7 skinProblems)
}

/** Q1 — 성별 (id: -1) */
export const GENDER_QUESTION: SurveyQuestion = {
  id: -1,
  question: "성별을\n알려주세요",
  options: [
    { icon: "👩", text: "여성", value: "WOMEN" },
    { icon: "👨", text: "남성", value: "MEN" },
  ],
};

/**
 * Q2~Q6 — 공통 질문 (성별 무관)
 * id:0 = 연령대
 * id:1 = Q3 (세안 후 10~20분)
 * id:2 = Q4 (오후 거울)
 * id:3 = Q5 (겉번들 안당김)
 * id:4 = Q6 (피지/모공)
 */
export const COMMON_QUESTIONS: SurveyQuestion[] = [
  {
    id: 0,
    question: "연령대를\n알려주세요",
    options: [
      { icon: "🧒", text: "10대", value: "TEENS" },
      { icon: "🧑", text: "20대", value: "TWENTIES" },
      { icon: "👨", text: "30대", value: "THIRTIES" },
      { icon: "🧔", text: "40대 이상", value: "FORTIES_PLUS" },
    ],
  },
  {
    // Q3: 세안한 뒤 아무것도 바르지 않고 10~20분 지나면?
    // A=전체 당김·메마름 / B=편안함 / C=볼·턱 당김 / D=겉괜찮 안당김
    id: 1,
    question: "세안 후 아무것도 바르지 않고\n10~20분 지나면?",
    options: [
      { icon: "🏜️", text: "얼굴 전체가 당기고 메마른 느낌", value: "A" },
      { icon: "😌", text: "비교적 편안함", value: "B" },
      { icon: "🔀", text: "볼이나 턱이 먼저 당기거나 거칠게 느껴짐", value: "C" },
      { icon: "💧", text: "겉은 괜찮아 보여도 안쪽이 당기거나 건조함", value: "D" },
    ],
  },
  {
    // Q4: 오후쯤 거울을 봤을 때?
    // A=전체 건조 / B=무난 / C=T존 번들 U존 건조 / D=전체 번들
    id: 2,
    question: "오후쯤 거울을 봤을 때\n얼굴은 보통 어떻게 보이나요?",
    options: [
      { icon: "🏜️", text: "얼굴 전체가 푸석하거나 건조함", value: "A" },
      { icon: "😊", text: "전체적으로 무난함", value: "B" },
      { icon: "🔀", text: "이마와 코는 번들거리는데 볼과 턱은 덜 번들거림", value: "C" },
      { icon: "💦", text: "얼굴 전체가 전반적으로 번들거림", value: "D" },
    ],
  },
  {
    // Q5: 겉은 번들, 안쪽은 당기는 느낌?
    // A=자주 / B=가끔 / C=거의 아님 / D=모르겠음
    id: 3,
    question: "겉은 번들거리는데\n안쪽은 당기거나 건조할 때가 있나요?",
    options: [
      { icon: "✅", text: "자주 그렇다", value: "A" },
      { icon: "🔄", text: "가끔 그렇다", value: "B" },
      { icon: "🙅", text: "거의 그렇지 않다", value: "C" },
      { icon: "🤷", text: "잘 모르겠다", value: "D" },
    ],
  },
  {
    // Q6: 피지/모공이 눈에 띄는 부위?
    // A=거의없다 / B=전체고름 / C=코·이마 위주 / D=코주변만
    id: 4,
    question: "맨얼굴을 봤을 때\n피지나 모공이 눈에 띄는 부위는?",
    options: [
      { icon: "😊", text: "거의 없다", value: "A" },
      { icon: "🌐", text: "얼굴 여러 부위에서 비슷하다", value: "B" },
      { icon: "👃", text: "주로 코나 이마 쪽에서 더 눈에 띈다", value: "C" },
      { icon: "🔀", text: "코 주변은 눈에 띄지만 볼이나 턱은 상대적으로 덜 눈에 띈다", value: "D" },
    ],
  },
];

/**
 * Q7 — 피부 고민 다중 선택 (id: 5)
 * API skinProblems enum 값을 value로 사용
 * multiSelect: true — 1개 이상 선택 필수
 */
export const SKIN_PROBLEM_QUESTION: SurveyQuestion = {
  id: 5,
  question: "가장 신경 쓰이는\n피부 고민을 선택해주세요",
  multiSelect: true,
  options: [
    { icon: "🔴", text: "여드름", value: "여드름" },
    { icon: "✨", text: "미백", value: "미백" },
    { icon: "🌑", text: "기미/주근깨/잡티", value: "기미/주근깨/잡티" },
    { icon: "🕰️", text: "주름/탄력", value: "주름/탄력" },
    { icon: "💦", text: "피지", value: "피지" },
    { icon: "👃", text: "블랙헤드", value: "블랙헤드" },
    { icon: "💧", text: "속건조", value: "속건조" },
    { icon: "🩷", text: "홍조", value: "홍조" },
    { icon: "🏜️", text: "각질", value: "각질" },
  ],
};



