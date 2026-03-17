// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/routine/RoutineStepCard.tsx
 *
 * 루틴 페이지의 단계별 카드.
 * 제품이 있으면 제품 정보, 없으면 추가 유도 UI.
 */

"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
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
  stepLabel: string; // ex: "클렌저"
  stepIcon: string;  // ex: "🫧"
  category: string;  // 검색 링크용
  product?: RoutineStepCardProduct | null;
  isFirst?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
}

export function RoutineStepCard({
  stepNumber,
  stepLabel,
  stepIcon,
  product,
  isFirst = false,
  onRemove,
  onAdd,
}: Props) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/5">

      {/* 스텝 번호 */}
      <div
        className={`flex items-center justify-center shrink-0 size-7 rounded-full ${
          isFirst ? "bg-brand" : "bg-[#F5F0E8]"
        }`}
      >
        <span
          className={`text-xs font-semibold ${
            isFirst ? "text-white" : "text-[#B8A99A]"
          }`}
        >
          {stepNumber}
        </span>
      </div>

      {product ? (
        <>
          {/* 제품 썸네일 */}
          <div className="relative flex items-center justify-center overflow-hidden shrink-0 size-16 rounded-[10px] bg-[#F8F5EF]">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            ) : (
              <span className="text-2xl">{product.emoji}</span>
            )}
          </div>

          {/* 제품 정보 */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-brand m-0">{stepLabel}</p>
            <Link href={`/product/${product.id}`}>
              <p className="truncate text-[16px] font-medium text-[#1A1A1A] mt-0.5">{product.name}</p>
            </Link>
            <p className="text-[12px] text-[#B8A99A] m-0">{product.brand}</p>
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={onRemove}
            className="shrink-0 flex items-center justify-center size-7 rounded-full bg-[#F5F5F5] border-none cursor-pointer transition-all active:scale-90"
          >
            <X size={14} color="#9E9E9E" />
          </button>
        </>
      ) : (
        <>
          {/* 빈 슬롯 아이콘 */}
          <div className="flex items-center justify-center shrink-0 size-16 rounded-[10px] bg-[#F5F0E8]">
            <span className="text-2xl opacity-50">{stepIcon}</span>
          </div>

          {/* 안내 텍스트 */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-brand m-0">{stepLabel}</p>
            <p className="text-[13px] text-[#B8A99A] mt-0.5">제품을 추가해보세요</p>
          </div>

          {/* 추가 버튼 */}
          <button
            onClick={onAdd}
            className="shrink-0 flex items-center justify-center size-7 rounded-full bg-brand border-none cursor-pointer transition-all active:scale-90"
          >
            <Plus size={14} color="#fff" />
          </button>
        </>
      )}
    </div>
  );
}
