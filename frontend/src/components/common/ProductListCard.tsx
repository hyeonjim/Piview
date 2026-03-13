"use client";

import { Heart, Plus, Check, Package, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";

interface ProductListCardProps {
  id: string | number;
  brand: string;
  name: string;
  category: string;
  categoryShort?: string;
  emoji?: string;
  skinTypes: string[];
  effects: string[];
  matchScore: number;
  reason?: string;
  inRoutine: boolean;
  isWished: boolean;
  isOwned: boolean;
  onAddRoutine: () => void;
  onToggleWish: () => void;
  onToggleOwned: () => void;
}

export function ProductListCard({
  id,
  brand,
  name,
  category,
  categoryShort,
  emoji,
  skinTypes,
  effects,
  matchScore,
  reason,
  inRoutine,
  isWished,
  isOwned,
  onAddRoutine,
  onToggleWish,
  onToggleOwned,
}: ProductListCardProps) {
  const catC = CATEGORY_COLORS[category];

  return (
    <div className="p-4 rounded-card bg-white border border-border-warm">
      <Link href={`/product/${id}`} className="no-underline">
        <div className="flex items-center gap-3 cursor-pointer">
          {/* 썸네일 */}
          <div className="flex items-center justify-center shrink-0 w-[100px] h-[100px] rounded-[12px] bg-bg-surface">
            {emoji ? (
              <span className="text-[38px]">{emoji}</span>
            ) : (
              <span className="text-[15px] font-bold text-text-muted">
                {categoryShort}
              </span>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="text-xs text-text-muted font-medium">{brand}</span>
              {catC && (
                <span
                  className="text-xs px-[7px] py-[1px] rounded-[4px] font-medium"
                  style={{ backgroundColor: catC.chip, color: catC.accent }}
                >
                  {category}
                </span>
              )}
              {reason !== undefined && (
                <span className="text-xs px-[7px] py-[1px] rounded-[4px] bg-brand-bg text-brand font-semibold">
                  추천
                </span>
              )}
            </div>

            <p className="text-base font-semibold text-[#2A2A2A] mt-0.5 leading-[1.3] m-0">
              {name}
            </p>

            {/* 피부타입 태그 */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {skinTypes.map((st) => {
                const c = SKIN_TYPE_TAG_COLORS[st] ?? { bg: "#F0EDE8", text: "#7A7060" };
                return (
                  <span
                    key={st}
                    className="text-xs px-[7px] py-[1px] rounded-[4px] font-semibold tracking-[0.2px]"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {st}
                  </span>
                );
              })}
            </div>

            {/* 기능 태그 */}
            <div className="flex flex-wrap gap-1 mt-1">
              {effects.slice(0, 4).map((fn) => {
                const fc = SKIN_FUNCTION_COLORS[fn];
                return fc ? (
                  <span
                    key={fn}
                    className="text-xs px-[7px] py-[1px] rounded-[4px] font-medium"
                    style={{ backgroundColor: fc.chip, color: fc.accent }}
                  >
                    {fn}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* 매칭 점수 */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-base font-bold text-brand">{matchScore}</span>
            <span className="text-[15px] text-text-muted tracking-[0.5px] uppercase">
              score
            </span>
          </div>
        </div>
      </Link>

      {/* 추천 이유 */}
      {reason && (
        <p className="text-[15px] text-brand mt-2 leading-[1.55] break-keep">
          {reason}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-1.5 mt-2.5 flex-wrap">
        <button
          onClick={onAddRoutine}
          disabled={inRoutine}
          className={`flex items-center justify-center gap-1 flex-1 min-w-[80px] h-8 rounded-[40px] border-none cursor-pointer transition-all active:scale-[0.97] text-[15px] font-bold ${
            inRoutine
              ? "bg-brand-bg text-brand"
              : "bg-brand text-white"
          }`}
        >
          {inRoutine ? <><Check size={11} /> 루틴추가됨</> : <><Plus size={11} /> 루틴추가</>}
        </button>

        <button
          onClick={onToggleOwned}
          className={`flex items-center justify-center gap-1 h-8 px-[10px] rounded-[40px] cursor-pointer transition-all active:scale-[0.97] text-[15px] font-semibold border ${
            isOwned
              ? "border-brand-light bg-brand-bg text-brand"
              : "border-border-warm bg-white text-text-muted"
          }`}
        >
          <Package size={11} /> {isOwned ? "보유 중" : "보유추가"}
        </button>

        <button
          onClick={onToggleWish}
          className={`flex items-center justify-center h-8 px-[10px] rounded-[40px] cursor-pointer transition-all active:scale-[0.97] border ${
            isWished
              ? "border-[#FFCDD2] bg-[#FFF0F3]"
              : "border-border-warm bg-white"
          }`}
        >
          <Heart
            size={16}
            color={isWished ? "#E57373" : "var(--color-text-muted)"}
            fill={isWished ? "#E57373" : "none"}
          />
        </button>

        <button className="flex items-center justify-center h-8 px-[10px] rounded-[40px] border border-border-warm bg-white cursor-pointer transition-all active:scale-[0.97]">
          <GitCompareArrows size={16} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
}
