// src/components/common/FilterButton.tsx
// 필터 버튼 — 활성 필터 개수 배지 포함. search/recommend 공용.
import { SlidersHorizontal } from "lucide-react";

interface FilterButtonProps {
  filterCount: number;
  onClick: () => void;
}

export default function FilterButton({ filterCount, onClick }: FilterButtonProps) {
  const isActive = filterCount > 0;
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer ${
        isActive ? "bg-brand" : "bg-bg-chip"
      }`}
    >
      <SlidersHorizontal size={17} color={isActive ? "#fff" : "#616161"} />
      {isActive && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#FF5252] text-white text-[9px] font-bold border-2 border-white">
          {filterCount}
        </span>
      )}
    </button>
  );
}
