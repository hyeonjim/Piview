/**
 * insights.ts
 * 홈 화면 하단 "Skincare Tips" 고정 콘텐츠
 * → 앱 내 고정 텍스트. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(main)/home/page.tsx → SKINCARE_INSIGHTS
 *
 * 주의: icon은 JSX이므로 이 파일을 import하는 곳에서
 *       Droplets, Sun, Leaf를 함께 import해야 함.
 *       또는 iconName(string)으로 바꾸고 페이지에서 매핑해서 사용.
 */

export interface SkincareInsight {
  label: string;
  desc: string;
  iconName: "droplets" | "sun" | "leaf"; // 페이지에서 아이콘 컴포넌트로 매핑
}

export const SKINCARE_INSIGHTS: SkincareInsight[] = [
  {
    label: "수분 관리",
    desc: "충분한 수분 공급이 건강한 피부의 기본입니다",
    iconName: "droplets",
  },
  {
    label: "자외선 차단",
    desc: "외출 30분 전 선크림을 꼼꼼히 발라주세요",
    iconName: "sun",
  },
  {
    label: "성분 체크",
    desc: "내 피부에 맞는 성분을 알면 루틴이 달라져요",
    iconName: "leaf",
  },
];
