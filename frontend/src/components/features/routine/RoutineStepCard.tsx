// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/routine/RoutineStepCard.tsx
 *
 * 루틴 페이지의 단계별 카드.
 * 제품이 있으면 제품 정보, 없으면 추가 유도 UI.
 */

"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";

export interface RoutineStepCardProduct {
  id: string | number;
  name: string;
  brand: string;
  emoji: string;
  imageUrl?: string;
}

interface Props {
  stepNumber: number;
  stepLabel: string;      // ex: "클렌저"
  stepIcon: string;       // ex: "🫧"
  category: string;       // 검색 링크용
  product?: RoutineStepCardProduct | null;
  isFirst?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
}

export function RoutineStepCard({
  stepNumber, stepLabel, stepIcon, category,
  product, isFirst = false, onRemove, onAdd,
}: Props) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* 번호 */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: "28px", height: "28px", borderRadius: "50%",
          backgroundColor: isFirst ? "var(--color-brand)" : "#F5F0E8",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: isFirst ? "#fff" : "#B8A99A" }}>
          {stepNumber}
        </span>
      </div>

      {product ? (
        <>
          {/* 제품 이미지 */}
          <div
            className="flex items-center justify-center overflow-hidden shrink-0"
            style={{ width: "64px", height: "64px", borderRadius: "10px", backgroundColor: "#F8F5EF" }}
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "24px" }}>{product.emoji}</span>
            )}
          </div>

          {/* 제품 정보 */}
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-brand)", margin: 0 }}>{stepLabel}</p>
            <Link href={`/product/${product.id}`}>
              <p className="truncate" style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A1A", margin: "1px 0 0" }}>
                {product.name}
              </p>
            </Link>
            <p style={{ fontSize: "11px", color: "#B8A99A", margin: 0 }}>{product.brand}</p>
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={onRemove}
            className="shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#F5F5F5", border: "none" }}
          >
            <X size={14} color="#9E9E9E" />
          </button>
        </>
      ) : (
        <>
          {/* 빈 슬롯 아이콘 */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: "64px", height: "64px", borderRadius: "10px", backgroundColor: "#F5F0E8" }}
          >
            <span style={{ fontSize: "24px", opacity: 0.5 }}>{stepIcon}</span>
          </div>

          {/* 안내 텍스트 */}
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-brand)", margin: 0 }}>{stepLabel}</p>
            <p style={{ fontSize: "13px", color: "#B8A99A", margin: "2px 0 0" }}>제품을 추가해보세요</p>
          </div>

          {/* 추가 버튼 */}
          <button
            onClick={onAdd}
            className="shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--color-brand)", border: "none" }}
          >
            <Plus size={14} color="#fff" />
          </button>
        </>
      )}
    </div>
  );
}
