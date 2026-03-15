/**
 * hooks/useToast.ts
 *
 * 일시적으로 표시했다가 사라지는 토스트 메시지 상태를 관리합니다.
 * search, recommend, routine 등 여러 페이지에서 공용.
 *
 * 사용법:
 *   const { toastMessage, showToast } = useToast();
 *   showToast("루틴에 추가됐어요!");
 *   <Toast msg={toastMessage} />
 */

import { useState, useCallback } from "react";

interface UseToastOptions {
  /** 토스트가 자동 사라지는 시간 (ms, 기본 2200) */
  duration?: number;
}

export function useToast({ duration = 2200 }: UseToastOptions = {}) {
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(""), duration);
    },
    [duration]
  );

  return { toastMessage, showToast };
}
