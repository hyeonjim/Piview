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
    <div className="flex items-center justify-center gap-1" style={{ padding: "16px 0 20px" }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px",
          borderRadius: "6px",
          border: "1px solid #EDEBE8",
          backgroundColor: "#FFFFFF",
          cursor: "pointer",
          opacity: page === 1 ? 0.3 : 1,
        }}
      >
        <ChevronLeft size={14} style={{ color: "#8A8278" }} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "32px", height: "32px",
            borderRadius: "6px",
            border: `1px solid ${page === n ? "#1C1C1E" : "#EDEBE8"}`,
            backgroundColor: page === n ? "#1C1C1E" : "#FFFFFF",
            color: page === n ? "#FFFFFF" : "#8A8278",
            fontSize: "12px",
            fontWeight: page === n ? 700 : 400,
            cursor: "pointer",
            fontFamily: "var(--font-pretendard), sans-serif",
          }}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px",
          borderRadius: "6px",
          border: "1px solid #EDEBE8",
          backgroundColor: "#FFFFFF",
          cursor: "pointer",
          opacity: page === totalPages ? 0.3 : 1,
        }}
      >
        <ChevronRight size={14} style={{ color: "#8A8278" }} />
      </button>
    </div>
  );
}
