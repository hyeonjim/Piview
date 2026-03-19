/**
 * skinTestOptions.ts
 * 피부 진단 방법 선택 옵션 (AI 사진 / 직접 선택 / 퀴즈)
 * → UI 고정 구조. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(onboarding)/skin-test/page.tsx → SKIN_TEST_OPTIONS
 */

import { Camera, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SkinTestOption {
  key:   string;
  href:  string;
  icon:  LucideIcon;
  title: string;
  desc:  string;
}

export const SKIN_TEST_OPTIONS: SkinTestOption[] = [
  {
    key:   "photo",
    href:  "/skin-test/photo",
    icon:  Camera,
    title: "AI 사진 분석",
    desc:  "얼굴 사진으로 AI가 피부 타입을 분석해요",
  },
  {
    key:   "know",
    href:  "/skin-test/select",
    icon:  Target,
    title: "알고 있어요",
    desc:  "피부 타입을 직접 선택합니다",
  },
];
