"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** 엔터/검색 버튼 확정 시 호출 — trackEvent 등 확정 시점 처리용 */
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && onSearch)
            onSearch(value);
        }}
        placeholder={placeholder}
        className={cn(
          "w-full h-[38px] pl-9",
          "rounded-full border text-[13px] text-text-primary placeholder:text-[#c4beb7]",
          "outline-none transition-colors duration-150",
          "bg-[#ffffff]",
          value ? "pr-[64px] border-[#d9d5d0]" : "pr-3 border-[#eae7e3]"
        )}
      />

      {/* 우측 버튼 영역 — X + 돋보기 */}
      {value && (
        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* X 지우기 버튼 */}
          <button
            onClick={() => onChange("")}
            className="w-[18px] h-[18px] rounded-full bg-border-dash flex items-center justify-center"
            aria-label="검색어 지우기"
          >
            <X size={10} className="text-white" strokeWidth={2.5} />
          </button>
          {/* 돋보기 검색 확정 버튼 */}
          {onSearch && (
            <button
              onClick={() => onSearch(value)}
              className="w-[22px] h-[22px] flex items-center justify-center"
              aria-label="검색"
            >
              <Search size={14} className="text-[#8c8784]" strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
