"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // 현재 페이지가 속한 10개 묶음 계산
  const groupSize = 5;
  const currentGroup = Math.ceil(page / groupSize);
  const groupStart = (currentGroup - 1) * groupSize + 1;
  const groupEnd = Math.min(currentGroup * groupSize, totalPages);

  const pageNumbers = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, i) => groupStart + i,
  );

  const hasPrevGroup = groupStart > 1;
  const hasNextGroup = groupEnd < totalPages;

  return (
    <div className="pagination-container">
      {/* 이전 버튼 */}
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="pagination-nav-button"
        data-disabled={page === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="pagination-icon" size={14} />
      </button>

      {/* 현재 그룹 페이지 번호들 */}
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onChange(pageNumber)}
          className="pagination-page-button"
          data-active={page === pageNumber}
          aria-label={`${pageNumber}페이지`}
          aria-current={page === pageNumber ? "page" : undefined}
        >
          {pageNumber}
        </button>
      ))}

      {/* 다음 버튼 */}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="pagination-nav-button"
        data-disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="pagination-icon" size={14} />
      </button>
    </div>
  );
}
