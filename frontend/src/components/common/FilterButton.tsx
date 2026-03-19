"use client";

import { SlidersHorizontal } from "lucide-react";

interface FilterButtonProps {
  filterCount?: number;
  onClick: () => void;
  className?: string;
}

// 필터 버튼 — 베이지 스타일, 사각형 모서리
export default function FilterButton({
  filterCount = 0,
  onClick,
  className = "",
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-9 px-3 rounded-[8px] border text-[13px] font-bold cursor-pointer transition-colors active:scale-[0.97] ${className}`}
      style={{
        borderColor: filterCount > 0 ? "#a2aa7b" : "#D9D5D0",
        backgroundColor: filterCount > 0 ? "#F0F2E8" : "#fff",
        color: filterCount > 0 ? "#a2aa7b" : "#A69D92",
      }}
    >
      <SlidersHorizontal size={14} />
      필터
      {filterCount > 0 && (
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold">
          {filterCount}
        </span>
      )}
    </button>
  );
}
