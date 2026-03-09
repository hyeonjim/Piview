"use client";

import { useState } from "react";
import { Settings, Plus, Leaf, Package } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common";

const ROUTINE_STEPS = [
  { code: "CL", label: "클렌저" },
  { code: "PR", label: "스킨/토너/미스트/패드" },
  { code: "PR", label: "스킨/토너/미스트/패드" },
  { code: "SR", label: "세럼/에센스/앰플" },
  { code: "LT", label: "로션/에멀전" },
  { code: "CR", label: "크림/오일" },
  { code: "SC", label: "선크림" },
];

export default function MyPage() {
  const [tab, setTab] = useState<"routine" | "owned">("routine");

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 bg-bg-surface border border-border">
            <AvatarFallback className="text-text-muted font-semibold text-lg bg-bg-surface">
              F
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-text-primary">User</p>
            <p className="text-xs text-text-muted mt-0.5">
              피부 타입을 진단해보세요
            </p>
          </div>
          <Link
            href="/mypage/settings"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border"
          >
            <Settings size={16} className="text-text-muted" />
          </Link>
        </div>

        <Button
          variant="primary"
          fullWidth
          size="md"
          className="mt-4"
          onClick={() => {}}
        >
          피부 진단 시작하기
        </Button>

        <div className="flex mt-3 bg-bg-surface rounded-xl p-1">
          <button
            onClick={() => setTab("routine")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "routine" ? "bg-bg-card text-text-primary shadow-sm" : "text-text-muted"}`}
          >
            <Leaf size={14} /> 내 루틴
          </button>
          <button
            onClick={() => setTab("owned")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "owned" ? "bg-bg-card text-text-primary shadow-sm" : "text-text-muted"}`}
          >
            <Package size={14} /> 보유제품
          </button>
        </div>
      </div>

      {tab === "routine" && (
        <div className="px-5 flex flex-col gap-2 pb-24">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-base font-bold text-text-primary">내 루틴</p>
              <p className="text-xs text-text-muted">
                0/6단계 완성 · 길게 눌러 순서 변경
              </p>
            </div>
            <div className="flex gap-1.5">
              {["OCR", "저장", "추천"].map((action, i) => (
                <button
                  key={action}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-badge border font-medium ${i === 2 ? "bg-brand text-white border-brand" : "border-border text-text-secondary"}`}
                >
                  {action === "OCR" && "⇄ "}
                  {action === "저장" && "📋 "}
                  {action === "추천" && "✦ "}
                  {action}
                </button>
              ))}
            </div>
          </div>
          {ROUTINE_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-4"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                {step.code}
              </div>
              <p className="flex-1 text-sm font-medium text-text-primary">
                {step.label}
              </p>
              <button className="flex items-center gap-1 text-xs text-brand font-medium">
                <Plus size={13} /> 추가
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "owned" && (
        <div className="px-5 pb-24">
          <div className="mb-3">
            <p className="text-base font-bold text-text-primary">보유제품</p>
            <p className="text-xs text-text-muted">0개 보유 중</p>
          </div>
          <div className="border-2 border-dashed border-border rounded-2xl py-12">
            <EmptyState
              icon={Package}
              title="보유한 제품이 없습니다"
              description={
                '제품 상세에서 "보유중" 버튼을 눌러\n제품을 등록해보세요'
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
