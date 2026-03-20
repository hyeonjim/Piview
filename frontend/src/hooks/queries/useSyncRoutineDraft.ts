/**
 * hooks/useSyncRoutineDraft.ts
 *
 * 루틴 상태가 바뀔 때마다 PUT /api/v1/routines/draft 를 자동으로 호출하는 훅.
 *
 * ■ 동작 원리
 *   1. useLocalRoutineStore의 routine(LocalRoutineMap)을 구독
 *   2. routine이 바뀌면 ROUTINE_STEPS 순서대로 flat DraftItem[] 배열 생성
 *   3. 500ms 디바운스 후 routineService.syncDraft() 호출
 *      → 드래그 중 연속 변경이 발생해도 마지막 1번만 서버로 전송
 *
 * ■ 사용법 (mypage/page.tsx 최상단)
 *   useSyncRoutineDraft();  // 반환값 없음 — 사이드이펙트 전용
 *
 * ⚠️ API 연동 시: useLocalRoutineStore → useRoutineStore(서버 상태)로 교체
 */

import { useEffect, useRef } from "react";
import { useRoutineStore } from "@/stores";
import { routineService } from "@/services/routine";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import type { DraftItem } from "@/types/routine";

/** 디바운스 대기 시간(ms) — 드래그 등 연속 변경 이벤트 통합 */
const DEBOUNCE_DELAY_MS = 500;

export function useSyncRoutineDraft(): void {
  // routine이 바뀔 때만 이 훅이 재실행됨
  const routine = useRoutineStore((state) => state.localRoutine);

  // setTimeout ID 보관 — cleanup 시 취소용
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /**
     * LocalRoutineMap → DraftItem[] 변환
     *
     * ROUTINE_STEPS 정의 순서(CL→PR→SR→LT→CR→SC)를 기준으로
     * 각 스텝 내 제품을 순회하며 stepOrder를 1부터 채번
     *
     * - product.id가 숫자로 변환 불가능한 mock id는 skip
     *   (⚠️ API 연동 시 실제 숫자 ID가 들어오면 isNaN 가드 불필요)
     */
    const draftItems: DraftItem[] = [];
    let currentStepOrder = 1;

    ROUTINE_STEPS.forEach((step) => {
      const products = routine[step.code] ?? [];

      products.forEach((product) => {
        const parsedProductId = parseInt(product.id, 10);

        // ⚠️ API 연동 시: mock 문자열 id가 사라지면 아래 가드 제거
        if (isNaN(parsedProductId)) return;

        draftItems.push({
          columnId: step.columnId,
          productId: parsedProductId,
          stepOrder: currentStepOrder,
        });

        currentStepOrder += 1;
      });
    });

    // 이전 타이머 취소 후 새 타이머 등록
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      routineService
        .syncDraft(draftItems)
        .catch((error) => {
          // 동기화 실패 — 로컬 상태는 유지, 콘솔에만 기록
          console.error("[useSyncRoutineDraft] draft 동기화 실패:", error);
        });
    }, DEBOUNCE_DELAY_MS);

    // 언마운트 또는 다음 effect 실행 전 타이머 정리
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [routine]);
}
