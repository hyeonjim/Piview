"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "검색...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      {/* 검색 아이콘 */}
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-[38px] pl-9",
          "rounded-lg border text-sm text-text-primary",
          "outline-none transition-colors duration-150",
          "bg-[#FAFAF8]",
          value ? "pr-[34px] border-[#C4BEB7]" : "pr-3 border-border"
        )}
      />

      {/* 지우기 버튼 */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-border-dash flex items-center justify-center"
          aria-label="검색어 지우기"
        >
          <X size={10} className="text-white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
