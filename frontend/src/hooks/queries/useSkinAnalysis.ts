/**
 * hooks/queries/useSkinAnalysis.ts
 * 피부 분석 훅
 *
 * useCaptureAnalysis  — POST /skin/analysis/capture
 *                       사진 업로드 → analysisId 반환
 * useAnalysisStatus   — GET  /skin/analysis/{analysisId}
 *                       PENDING 동안 2초마다 폴링 → COMPLETED/FAILED 시 중단
 *
 * 사용법 (skin-test/photo/page.tsx):
 *   const { mutate: capture, isPending: isCapturing } = useCaptureAnalysis();
 *   capture(imageFile, { onSuccess: ({ analysisId }) => setAnalysisId(analysisId) });
 *
 *   const { data: status } = useAnalysisStatus(analysisId);
 *   // status.status === "COMPLETED" 이면 survey 페이지로 이동
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { skinService } from "@/services/skin";
import { queryKeys } from "@/lib/queryKeys";

// ── POST /skin/analysis/capture ──────────────────────────────────

export function useCaptureAnalysis() {
  return useMutation({
    mutationFn: (imageFile: File) => skinService.captureAnalysis(imageFile),
  });
}

// ── GET /skin/analysis/{analysisId} — 폴링 ───────────────────────

export function useAnalysisStatus(analysisId: string | null) {
  return useQuery({
    queryKey: queryKeys.analysisStatus(analysisId ?? ""),
    queryFn: async () => {
      const result = await skinService.getAnalysisStatus(analysisId!);
      return result;
    },
    enabled: !!analysisId,
    // PENDING이면 2초마다 재조회, COMPLETED/FAILED면 폴링 중단
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return 2000;
    },
  });
}
