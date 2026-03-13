"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 py-4 pb-6">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-chip cursor-pointer border-none transition-all active:scale-[0.92] disabled:opacity-30 disabled:cursor-default"
      >
        <ChevronLeft size={16} className="text-text-sub" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all text-xs ${
            page === n
              ? "bg-brand text-white font-bold"
              : "bg-bg-chip text-text-sub font-normal"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-chip cursor-pointer border-none transition-all active:scale-[0.92] disabled:opacity-30 disabled:cursor-default"
      >
        <ChevronRight size={16} className="text-text-sub" />
      </button>
    </div>
  );
}
