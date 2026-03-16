// src/components/common/SearchBar.tsx
// shadcn Input 기반 — 피그마: bg-white border border-[#f0f0f0] rounded-[8px] shadow-[0px_4px_20px_rgba(0,0,0,0.06)]
"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = "제품명, 브랜드 검색",
  value,
  onChange,
  onSearch,
  className,
  autoFocus,
}: SearchBarProps) {
  const [internal, setInternal] = useState("");
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setInternal(e.target.value);
    onChange?.(e.target.value);
  };

  const handleClear = () => {
    if (!controlled) setInternal("");
    onChange?.("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch?.(current);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* 검색 아이콘 */}
      <Search
        size={18}
        className="absolute left-4 text-text-muted pointer-events-none"
      />

      <Input
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "pl-11 pr-10 h-12 rounded-xl",
          "bg-bg-card border-border shadow-card",
          "placeholder:text-text-muted text-text-primary text-[15px]",
          "focus-visible:ring-brand focus-visible:ring-1 focus-visible:border-brand"
        )}
      />

      {/* 지우기 버튼 */}
      {current && (
        <button
          onClick={handleClear}
          className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full bg-bg-surface text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
