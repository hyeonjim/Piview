// src/components/common/ProductCard.tsx
"use client";

import { Heart, Plus, Check, Package, GitCompareArrows } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import EWGIndicator from "./EWGIndicator";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";

interface ProductCardProps {
  // 기존 props
  id: number | string;
  name: string;
  brand: string;
  imageUrl?: string;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
  liked?: boolean;
  onLike?: (id: number | string) => void;
  layout?: "vertical" | "horizontal";

  // 새로운 props
  category?: string;
  categoryShort?: string;
  emoji?: string;
  skinTypes?: string[];
  effects?: string[];

  // 추천 관련
  reason?: string;
  isRecommended?: boolean;

  // 랭킹 표시 (아이콘만, 텍스트 없음)
  rankingIndex?: number;
  showRanking?: boolean;

  // 액션 버튼
  actions?: {
    onAddRoutine?: () => void;
    inRoutine?: boolean;
    onToggleOwned?: () => void;
    isOwned?: boolean;
    onToggleLike?: () => void;
    isLiked?: boolean;
    showCompare?: boolean;
    onCompare?: () => void;
  };

  // 디스플레이 옵션
  variant?: "default" | "modal";
  showDetailButton?: boolean;
  onDetailClick?: () => void;
}

export default function ProductCard({
  id,
  name,
  brand,
  imageUrl,
  ewgSafe = 0,
  ewgCaution = 0,
  ewgDanger = 0,
  liked = false,
  onLike,
  layout = "vertical",
  category,
  emoji,
  skinTypes = [],
  effects = [],
  reason,
  isRecommended = false,
  rankingIndex,
  showRanking = false,
  actions,
  variant = "default",
  showDetailButton = false,
  onDetailClick,
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(liked);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked((p) => !p);
    onLike?.(id);
  };

  const handleWishToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    actions?.onToggleLike?.();
  };

  const handleActionClick = (e: React.MouseEvent, callback?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    callback?.();
  };

  const categoryColor = category ? CATEGORY_COLORS[category] : undefined;

  // horizontal 레이아웃 (기존 유지)
  if (layout === "horizontal") {
    return (
      <Link href={`/product/${id}`}>
        <div className="flex items-center bg-bg-card border border-border rounded-card shadow-card overflow-hidden h-[88px]">
          {/* 이미지 */}
          <div className="relative w-[88px] h-full shrink-0 bg-bg-surface">
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">{emoji || "🧴"}</span>
              </div>
            )}
          </div>
          {/* 텍스트 */}
          <div className="flex-1 px-3 py-2 min-w-0">
            <p className="text-xs text-text-muted truncate">{brand}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5 line-clamp-2 leading-snug">
              {name}
            </p>
            <EWGIndicator
              safe={ewgSafe}
              caution={ewgCaution}
              danger={ewgDanger}
              className="mt-1.5"
            />
          </div>
          {/* 좋아요 */}
          <button onClick={handleLike} className="p-3 shrink-0">
            <Heart
              size={18}
              className={cn(
                "transition-colors",
                isLiked ? "fill-red-400 text-red-400" : "text-text-muted",
              )}
            />
          </button>
        </div>
      </Link>
    );
  }

  // modal variant 레이아웃
  if (variant === "modal") {
    return (
      <div
        className="rounded-[14px] p-3 border"
        style={{
          backgroundColor: actions?.inRoutine
            ? "var(--color-brand-bg)"
            : "white",
          borderColor: actions?.inRoutine
            ? "var(--color-brand-light)"
            : "#E8E0D0",
        }}
      >
        {/* 랭킹 배지 (아이콘만, 숫자 텍스트 없음) */}
        {rankingIndex !== undefined && showRanking && (
          <div
            className={cn(
              "inline-flex items-center justify-center mb-2 px-2 py-[2px] rounded-lg text-[11px] font-bold text-white",
              rankingIndex < 3 ? "bg-brand" : "bg-[#B0A890]",
            )}
          >
            {["🥇", "🥈", "🥉"][rankingIndex] ?? "✦"}
          </div>
        )}

        <Link href={`/product/${id}`} className="no-underline">
          <div className="flex items-center gap-3">
            {/* 썸네일 */}
            <div
              className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 60, height: 60, backgroundColor: "#F8F6F0" }}
            >
              {emoji ? (
                <span className="text-[28px]">{emoji}</span>
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={60}
                  height={60}
                  className="object-cover rounded-xl"
                />
              ) : (
                <span className="text-xl">🧴</span>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-xs text-text-muted">{brand}</span>
                {categoryColor && (
                  <span
                    className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium"
                    style={{
                      backgroundColor: categoryColor.chip,
                      color: categoryColor.accent,
                    }}
                  >
                    {category}
                  </span>
                )}
                {(isRecommended || reason) && (
                  <span className="text-[10px] px-1.5 py-[1px] rounded-[4px] bg-brand-bg text-brand font-semibold">
                    추천
                  </span>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-[#2A2A2A]">
                {name}
              </p>

              {/* 피부 타입 태그 */}
              {skinTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {skinTypes.map((skinType) => {
                    const skinTypeColor = SKIN_TYPE_TAG_COLORS[skinType] ?? {
                      bg: "#F0EDE8",
                      text: "#7A7060",
                    };
                    return (
                      <span
                        key={skinType}
                        className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-semibold"
                        style={{
                          backgroundColor: skinTypeColor.bg,
                          color: skinTypeColor.text,
                        }}
                      >
                        {skinType}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 기능 태그 */}
              {effects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {effects.slice(0, 3).map((effect) => {
                    const effectColor = SKIN_FUNCTION_COLORS[effect];
                    return effectColor ? (
                      <span
                        key={effect}
                        className="text-[10px] px-[5px] py-[1px] rounded-[4px] font-medium"
                        style={{
                          backgroundColor: effectColor.chip,
                          color: effectColor.accent,
                        }}
                      >
                        {effect}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-2.5">
          {actions?.onAddRoutine && (
            <button
              onClick={(e) => handleActionClick(e, actions.onAddRoutine)}
              disabled={actions.inRoutine}
              className={cn(
                "flex items-center justify-center gap-1 flex-1 h-8 rounded-[40px] border-none cursor-pointer transition-all active:scale-[0.97] text-xs font-bold",
                actions.inRoutine
                  ? "bg-brand-bg text-brand"
                  : "bg-brand text-white",
              )}
            >
              {actions.inRoutine ? (
                <>
                  <Check size={11} /> 루틴추가됨
                </>
              ) : (
                <>
                  <Plus size={11} /> 루틴추가
                </>
              )}
            </button>
          )}
          {showDetailButton && (
            <button
              onClick={(e) => handleActionClick(e, onDetailClick)}
              className="flex items-center justify-center h-8 px-3 rounded-[40px] border border-border-warm bg-white text-xs text-text-muted font-medium cursor-pointer active:scale-[0.97]"
            >
              상세보기
            </button>
          )}
        </div>
      </div>
    );
  }

  // vertical 레이아웃 (확장됨)
  return (
    <div className="relative bg-bg-card rounded-card shadow-card overflow-hidden flex flex-col w-full">
      <Link href={`/product/${id}`} className="no-underline">
        {/* 랭킹 배지 (아이콘만) */}
        {rankingIndex !== undefined && showRanking && (
          <div
            className={cn(
              "absolute top-2 right-2 z-10 flex items-center justify-center px-2 py-[2px] rounded-lg text-[11px] font-bold text-white",
              rankingIndex < 3 ? "bg-brand" : "bg-[#B0A890]",
            )}
          >
            {["🥇", "🥈", "🥉"][rankingIndex] ?? "✦"}
          </div>
        )}

        {/* 이미지 */}
        <div className="relative h-[160px] bg-bg-surface">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : emoji ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[40px]">{emoji}</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-brand-pale flex items-center justify-center">
                <span className="text-3xl">🧴</span>
              </div>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          {/* 브랜드 & 카테고리 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted font-medium">{brand}</span>
            {categoryColor && (
              <span
                className="text-xs px-[7px] py-[1px] rounded-[4px] font-medium"
                style={{
                  backgroundColor: categoryColor.chip,
                  color: categoryColor.accent,
                }}
              >
                {category}
              </span>
            )}
            {(isRecommended || reason) && (
              <span className="text-xs px-[7px] py-[1px] rounded-[4px] bg-brand-bg text-brand font-semibold">
                추천
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
            {name}
          </p>

          {/* 피부 타입 태그 */}
          {skinTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {skinTypes.map((skinType) => {
                const skinTypeColor = SKIN_TYPE_TAG_COLORS[skinType] ?? {
                  bg: "#F0EDE8",
                  text: "#7A7060",
                };
                return (
                  <span
                    key={skinType}
                    className="text-xs px-[7px] py-[1px] rounded-[4px] font-semibold tracking-[0.2px]"
                    style={{
                      backgroundColor: skinTypeColor.bg,
                      color: skinTypeColor.text,
                    }}
                  >
                    {skinType}
                  </span>
                );
              })}
            </div>
          )}

          {/* 기능 태그 */}
          {effects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {effects.slice(0, 4).map((effect) => {
                const effectColor = SKIN_FUNCTION_COLORS[effect];
                return effectColor ? (
                  <span
                    key={effect}
                    className="text-xs px-[7px] py-[1px] rounded-[4px] font-medium"
                    style={{
                      backgroundColor: effectColor.chip,
                      color: effectColor.accent,
                    }}
                  >
                    {effect}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* EWG Indicator */}
          {(ewgSafe > 0 || ewgCaution > 0 || ewgDanger > 0) && (
            <EWGIndicator
              safe={ewgSafe}
              caution={ewgCaution}
              danger={ewgDanger}
              className="mt-1"
            />
          )}
        </div>
      </Link>

      {/* 추천 이유 (Link 밖에 배치) */}
      {reason && (
        <p className="text-[15px] text-brand mt-2 px-3 leading-[1.55] break-keep">
          {reason}
        </p>
      )}

      {/* 액션 버튼 */}
      {actions && (
        <div className="flex gap-1.5 mt-2.5 px-3 pb-3 flex-wrap">
          {actions.onAddRoutine && (
            <button
              onClick={(e) => handleActionClick(e, actions.onAddRoutine)}
              disabled={actions.inRoutine}
              className={cn(
                "flex items-center justify-center gap-1 flex-1 min-w-[80px] h-8 rounded-[40px] border-none cursor-pointer transition-all active:scale-[0.97] text-[15px] font-bold",
                actions.inRoutine
                  ? "bg-brand-bg text-brand"
                  : "bg-brand text-white",
              )}
            >
              {actions.inRoutine ? (
                <>
                  <Check size={11} /> 루틴추가됨
                </>
              ) : (
                <>
                  <Plus size={11} /> 루틴추가
                </>
              )}
            </button>
          )}

          {actions.onToggleOwned && (
            <button
              onClick={(e) => handleActionClick(e, actions.onToggleOwned)}
              className={cn(
                "flex items-center justify-center gap-1 h-8 px-[10px] rounded-[40px] cursor-pointer transition-all active:scale-[0.97] text-[15px] font-semibold border",
                actions.isOwned
                  ? "border-brand-light bg-brand-bg text-brand"
                  : "border-border-warm bg-white text-text-muted",
              )}
            >
              <Package size={11} /> {actions.isOwned ? "보유 중" : "보유추가"}
            </button>
          )}

          {actions.onToggleLike && !onLike && (
            <button
              onClick={(e) => handleActionClick(e, actions.onToggleLike)}
              className={cn(
                "flex items-center justify-center h-8 px-[10px] rounded-[40px] cursor-pointer transition-all active:scale-[0.97] border",
                actions.isLiked
                  ? "border-[#FFCDD2] bg-[#FFF0F3]"
                  : "border-border-warm bg-white",
              )}
            >
              <Heart
                size={16}
                color={actions.isLiked ? "#E57373" : "var(--color-text-muted)"}
                fill={actions.isLiked ? "#E57373" : "none"}
              />
            </button>
          )}

          {actions.showCompare && actions.onCompare && (
            <button
              onClick={(e) => handleActionClick(e, actions.onCompare)}
              className="flex items-center justify-center h-8 px-[10px] rounded-[40px] border border-border-warm bg-white cursor-pointer transition-all active:scale-[0.97]"
            >
              <GitCompareArrows size={16} className="text-text-muted" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
