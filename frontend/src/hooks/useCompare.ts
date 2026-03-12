/**
 * hooks/useCompare.ts
 *
 * 제품 비교 기능 상태 관리 (최대 2개).
 * search, recommend 페이지에서 공용.
 *
 * 사용법:
 *   const { compareItems, toggleCompare, clearCompare, canCompare } = useCompare<Product>();
 */

import { useState, useCallback } from "react";

export function useCompare<T extends { id: string | number }>() {
  const [compareItems, setCompareItems] = useState<T[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = useCallback((item: T) => {
    setCompareItems((prev) => {
      if (prev.find((x) => x.id === item.id)) {
        return prev.filter((x) => x.id !== item.id);
      }
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    setShowCompare(false);
  }, []);

  const openCompare = useCallback(() => setShowCompare(true), []);
  const closeCompare = useCallback(() => setShowCompare(false), []);

  /** 2개가 선택됐을 때만 true */
  const canCompare = compareItems.length === 2;

  return {
    compareItems,
    showCompare,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
    canCompare,
  };
}
