// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/routine/SavedRoutineCard.tsx
 *
 * 저장된 루틴 목록의 카드 아이템.
 */

"use client";

import { Trash2, RotateCcw } from "lucide-react";

interface Props {
  name: string;
  stepCount: number;
  createdAt?: string;
  onLoad?: () => void;
  onDelete?: () => void;
}

export function SavedRoutineCard({ name, stepCount, createdAt, onLoad, onDelete }: Props) {
  return (
    <div
      className="flex items-center gap-3 p-3.5"
      style={{ borderRadius: "14px", backgroundColor: "#F8F6F0", border: "1px solid #EAE5DA" }}
    >
      {/* 아이콘 */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "var(--color-brand)" }}
      >
        <span style={{ fontSize: "18px" }}>📋</span>
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", margin: 0 }}>{name}</p>
        <p style={{ fontSize: "11px", color: "#9E9E9E", margin: "2px 0 0" }}>
          {stepCount}단계{createdAt && ` · ${createdAt}`}
        </p>
      </div>

      {/* 불러오기 버튼 */}
      <button
        onClick={onLoad}
        className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        style={{ height: "30px", padding: "0 10px", borderRadius: "8px", border: "none",
          backgroundColor: "var(--color-brand)", color: "#FFFFFF", fontSize: "11px", fontWeight: 600 }}
      >
        <RotateCcw size={11} /> 불러오기
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className="flex items-center justify-center cursor-pointer transition-all active:scale-90"
        style={{ width: "30px", height: "30px", borderRadius: "8px", border: "none", backgroundColor: "#F0EDE8" }}
      >
        <Trash2 size={13} color="#C0392B" />
      </button>
    </div>
  );
}
