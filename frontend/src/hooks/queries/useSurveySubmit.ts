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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { skinService } from "@/services/skin";
import { useUserStore } from "@/stores";
import { fromSkinTypeEnum, concernDbToLabel } from "@/utils/enumConvert";
import { queryKeys } from "@/lib/queryKeys";
import type { SurveySubmitRequest, SkinType } from "@/types/user";

interface SubmitSurveyParams {
  analysisId: string;
  body: SurveySubmitRequest;
}

export function useSurveySubmit() {
  const queryClient = useQueryClient();
  const setSkinType = useUserStore((s) => s.setSkinType);
  const setConcerns = useUserStore((s) => s.setConcerns);

  return useMutation({
    mutationFn: ({ analysisId, body }: SubmitSurveyParams) =>
      skinService.submitSurvey(analysisId, body),

    onSuccess: (data) => {
      // 백엔드 enum("DRY") → 프론트 한글("건성") 변환 후 store 저장
      const skinType = fromSkinTypeEnum(data.mySkinType) as SkinType;
      setSkinType(skinType);
      // skinProblems는 DB값("수분") → label("속건조") 변환 필요 — useUserQuery와 동일하게 처리
      setConcerns((data.skinProblems ?? []).map(concernDbToLabel));
      // user 캐시 무효화 — 이후 useUserQuery가 구버전 데이터로 store를 덮어쓰지 않도록
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}
