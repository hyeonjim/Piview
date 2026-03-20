"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** 현재 페이지 번호 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 페이지 변경 핸들러 */
  onChange: (page: number) => void;
}

/**
 * 페이지네이션 컴포넌트
 * - 1페이지 이하일 경우 렌더링하지 않음
 * - 이전/다음 버튼과 페이지 번호 버튼으로 구성
 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  // 페이지가 1개 이하면 페이지네이션 숨김
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      {/* 이전 페이지 버튼 */}
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="pagination-nav-button"
        data-disabled={page === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="pagination-icon" size={14} />
      </button>

      {/* 페이지 번호 버튼들 */}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
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

      {/* 다음 페이지 버튼 */}
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
