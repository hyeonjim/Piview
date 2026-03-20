/**
 * hooks/useSurveySubmit.ts
 * 피부진단 최종 제출 훅 — POST /skin/surveys/{analysisId}
 *
 * 사용법 (skin-test/survey/[id]/page.tsx 마지막 질문 제출 시):
 *   const { mutate: submitSurvey, isPending } = useSurveySubmit();
 *   submitSurvey({ analysisId, body: request }, { onSuccess: (data) => router.push(...) });
 *
 * ⚠️ analysisId는 useSurveyStore에서 가져옴 — capture 완료 후 저장된 값
 */

import { useMutation } from "@tanstack/react-query";
import { skinService } from "@/services/skin";
import { useUserStore } from "@/stores/useUserStore";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import type { SurveySubmitRequest } from "@/types/user";
import type { SkinType } from "@/types/user";

interface SubmitSurveyParams {
  analysisId: string;
  body: SurveySubmitRequest;
}

export function useSurveySubmit() {
  const setSkinType = useUserStore((s) => s.setSkinType);
  const setConcerns = useUserStore((s) => s.setConcerns);

  return useMutation({
    mutationFn: ({ analysisId, body }: SubmitSurveyParams) =>
      skinService.submitSurvey(analysisId, body),

    onSuccess: (data) => {
      // 백엔드 enum("DRY") → 프론트 한글("건성") 변환 후 store 저장
      const skinType = fromSkinTypeEnum(data.mySkinType) as SkinType;
      setSkinType(skinType);
      setConcerns(data.skinProblems);
    },
  });
}
