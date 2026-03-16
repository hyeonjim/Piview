"use client";

import { Heart, Plus, Check, ShoppingBag, Scale } from "lucide-react";
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

// ── 스타일 상수 ──────────────────────────────────────────────────────
const MODAL_THUMB_STYLE = { width: 60, height: 60, backgroundColor: "#F5F2EC" };

interface ProductCardProps {
  id: number | string;
  name: string;
  brand: string;
  imageUrl?: string;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
  liked?: boolean;
  onLike?: (id: number | string) => void;
  layout?: "vertical" | "horizontal" | "grid";
  category?: string;
  emoji?: string;
  skinTypes?: string[];
  effects?: string[];
  reason?: string;
  isRecommended?: boolean;
  rankingIndex?: number;
  showRanking?: boolean;
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
  variant?: "default" | "modal";
  showDetailButton?: boolean;
  onDetailClick?: () => void;
}

// ── 공용 태그 컴포넌트 ──────────────────────────────────────────────
function SkinTypeTag({ label }: { label: string }) {
  const color = SKIN_TYPE_TAG_COLORS[label] ?? { bg: "#F0EDE8", text: "#7A7060" };
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: color.bg,
        color: color.text,
        fontSize: "10px",
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: "3px",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

function EffectTag({ label }: { label: string }) {
  const color = SKIN_FUNCTION_COLORS[label];
  if (!color) return null;
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: color.chip,
        color: color.accent,
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 6px",
        borderRadius: "3px",
      }}
    >
      {label}
    </span>
  );
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
    setIsLiked((prev) => !prev);
    onLike?.(id);
  };

  const handleAction = (e: React.MouseEvent, callback?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    callback?.();
  };

  const categoryColor = category ? CATEGORY_COLORS[category] : undefined;

  // ── 1. GRID — 2열 제품 카드 ────────────────────────────────────────
  if (layout === "grid") {
    return (
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid #E2DDD8",
          // 세련된 그림자 — 가볍고 선명
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Link href={`/product/${id}`} className="no-underline flex flex-col">
          {/* 이미지 — 가로:세로 3:2 (기존 1:1의 2/3 높이) */}
          <div
            className="relative w-full"
            style={{ aspectRatio: "3/2", backgroundColor: "#F5F2EC" }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: "24px" }}>{emoji || "🧴"}</span>
              </div>
            )}

            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              className="absolute top-2 right-2 flex items-center justify-center cursor-pointer border-none"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(4px)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <Heart
                size={13}
                style={{
                  color: isLiked ? "#E8715A" : "#C4BEB7",
                  fill: isLiked ? "#E8715A" : "none",
                  transition: "all 0.15s",
                }}
              />
            </button>

            {/* 추천 배지 */}
            {(isRecommended || reason) && (
              <div
                className="absolute top-2 left-2"
                style={{
                  /* 베이지 팔레트 — 검정 대신 따뜻한 다크 브라운 */
                  backgroundColor: "#3D3028",
                  color: "#F2EFE9",
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "3px 7px",
                  borderRadius: "3px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-pretendard), sans-serif",
                }}
              >
                PICK
              </div>
            )}

            {/* 랭킹 */}
            {rankingIndex !== undefined && showRanking && (
              <div className="absolute top-2 left-2" style={{ fontSize: "16px" }}>
                {["🥇", "🥈", "🥉"][rankingIndex] ?? "✦"}
              </div>
            )}
          </div>

          {/* 텍스트 영역 */}
          <div style={{ padding: "10px 12px 12px" }}>
            {/* 브랜드 */}
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 500,
                color: "#BFB6AA",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              {brand}
            </p>

            {/* 제품명 */}
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "13px",
                fontWeight: 500,
                color: "#2A2118",
                lineHeight: 1.4,
                // 2줄 말줄임
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              {name}
            </p>

            {/* 태그 */}
            {(skinTypes.length > 0 || effects.length > 0) && (
              <div
                className="flex flex-wrap"
                style={{ gap: "3px", marginTop: "6px" }}
              >
                {skinTypes.slice(0, 1).map((st) => (
                  <SkinTypeTag key={st} label={st} />
                ))}
                {effects.slice(0, 1).map((ef) => (
                  <EffectTag key={ef} label={ef} />
                ))}
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }

  // ── 2. HORIZONTAL ─────────────────────────────────────────────────
  if (layout === "horizontal") {
    return (
      <Link href={`/product/${id}`}>
        <div
          className="flex items-center overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            border: "1px solid #E2DDD8",
            height: "88px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="relative shrink-0 h-full"
            style={{ width: "88px", backgroundColor: "#F5F2EC" }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: "28px" }}>{emoji || "🧴"}</span>
              </div>
            )}
          </div>
          <div className="flex-1 px-3 py-2 min-w-0">
            <p style={{ margin: 0, fontSize: "10px", color: "#BFB6AA", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {brand}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "13px", fontWeight: 500, color: "#2A2118", lineHeight: 1.4 }}>
              {name}
            </p>
            <EWGIndicator safe={ewgSafe} caution={ewgCaution} danger={ewgDanger} className="mt-1.5" />
          </div>
          <button onClick={handleLike} className="p-3 shrink-0">
            <Heart
              size={17}
              style={{
                color: isLiked ? "#E8715A" : "#C4BEB7",
                fill: isLiked ? "#E8715A" : "none",
              }}
            />
          </button>
        </div>
      </Link>
    );
  }

  // ── 3. MODAL VARIANT ──────────────────────────────────────────────
  if (variant === "modal") {
    return (
      <div
        style={{
          borderRadius: "10px",
          padding: "12px",
          border: `1px solid ${actions?.inRoutine ? "#D9D5D0" : "#EDEBE8"}`,
          backgroundColor: actions?.inRoutine ? "#F2EFE9" : "#FFFFFF",
        }}
      >
        {rankingIndex !== undefined && showRanking && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            {["🥇", "🥈", "🥉"][rankingIndex] ?? "✦"}
          </div>
        )}

        <Link href={`/product/${id}`} className="no-underline">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 60,
                height: 60,
                borderRadius: "8px",
                backgroundColor: "#F5F2EC",
              }}
            >
              {emoji ? (
                <span style={{ fontSize: "26px" }}>{emoji}</span>
              ) : imageUrl ? (
                <Image src={imageUrl} alt={name} width={60} height={60} className="object-cover rounded-lg" />
              ) : (
                <span style={{ fontSize: "22px" }}>🧴</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: "2px" }}>
                <span style={{ fontSize: "10px", color: "#BFB6AA", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {brand}
                </span>
                {categoryColor && (
                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", backgroundColor: categoryColor.chip, color: categoryColor.accent, fontWeight: 500 }}>
                    {category}
                  </span>
                )}
                {(isRecommended || reason) && (
                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", backgroundColor: "#3D3028", color: "#F2EFE9", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    PICK
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#2A2118", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </p>
              <div className="flex flex-wrap" style={{ gap: "3px", marginTop: "5px" }}>
                {skinTypes.map((st) => <SkinTypeTag key={st} label={st} />)}
                {effects.slice(0, 3).map((ef) => <EffectTag key={ef} label={ef} />)}
              </div>
            </div>
          </div>
        </Link>

        <div className="flex gap-2" style={{ marginTop: "10px" }}>
          {actions?.onAddRoutine && (
            <button
              onClick={(e) => handleAction(e, actions.onAddRoutine)}
              disabled={actions.inRoutine}
              className="flex items-center justify-center gap-1 flex-1 cursor-pointer border-none transition-all active:scale-[0.97]"
              style={{
                height: "32px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                ...(actions.inRoutine
                  ? { /* 루틴추가됨/보유중 상태 — 베이지 팔레트 */
                  backgroundColor: "#F2EFE9", color: "#A69D92" }
                  : { backgroundColor: "#3D3028", color: "#F2EFE9" }),
              }}
            >
              {actions.inRoutine ? <><Check size={11} /> 추가됨</> : <><Plus size={11} /> 루틴추가</>}
            </button>
          )}
          {showDetailButton && (
            <button
              onClick={(e) => handleAction(e, onDetailClick)}
              className="flex items-center justify-center cursor-pointer border active:scale-[0.97]"
              style={{
                height: "32px",
                padding: "0 12px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#8A8278",
                backgroundColor: "#FFFFFF",
                borderColor: "#E8E4DF",
              }}
            >
              상세보기
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 4. VERTICAL — 기본값 ──────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col overflow-hidden w-full"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E2DDD8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <Link href={`/product/${id}`} className="no-underline">
        {rankingIndex !== undefined && showRanking && (
          <div className="absolute top-2 right-2 z-10" style={{ fontSize: "16px" }}>
            {["🥇", "🥈", "🥉"][rankingIndex] ?? "✦"}
          </div>
        )}

        {/* 이미지 — 기존 160px의 2/3인 108px */}
        <div className="relative" style={{ height: "108px", backgroundColor: "#F5F2EC" }}>
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: "30px" }}>{emoji || "🧴"}</span>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 14px 14px" }}>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "#BFB6AA", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {brand}
            </span>
            {categoryColor && (
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", backgroundColor: categoryColor.chip, color: categoryColor.accent }}>
                {category}
              </span>
            )}
            {(isRecommended || reason) && (
              <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", backgroundColor: "#3D3028", color: "#F2EFE9", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                PICK
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#2A2118", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {name}
          </p>

          <div className="flex flex-wrap" style={{ gap: "3px", marginTop: "7px" }}>
            {skinTypes.map((st) => <SkinTypeTag key={st} label={st} />)}
            {effects.slice(0, 3).map((ef) => <EffectTag key={ef} label={ef} />)}
          </div>

          {(ewgSafe > 0 || ewgCaution > 0 || ewgDanger > 0) && (
            <EWGIndicator safe={ewgSafe} caution={ewgCaution} danger={ewgDanger} className="mt-2" />
          )}
        </div>
      </Link>

      {reason && (
        <p style={{ fontSize: "13px", color: "#A69D92", margin: 0, padding: "0 14px 8px", lineHeight: 1.55 }}>
          {reason}
        </p>
      )}

      {actions && (
        <div className="flex gap-1.5 flex-wrap" style={{ padding: "0 12px 12px" }}>
          {actions.onAddRoutine && (
            <button
              onClick={(e) => handleAction(e, actions.onAddRoutine)}
              disabled={actions.inRoutine}
              className="flex items-center justify-center gap-1 flex-1 cursor-pointer border-none transition-all active:scale-[0.97]"
              style={{
                height: "32px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                minWidth: "80px",
                ...(actions.inRoutine
                  ? { /* 루틴추가됨/보유중 상태 — 베이지 팔레트 */
                  backgroundColor: "#F2EFE9", color: "#A69D92" }
                  : { backgroundColor: "#3D3028", color: "#F2EFE9" }),
              }}
            >
              {actions.inRoutine ? <><Check size={11} /> 추가됨</> : <><Plus size={11} /> 루틴추가</>}
            </button>
          )}
          {actions.onToggleOwned && (
            <button
              onClick={(e) => handleAction(e, actions.onToggleOwned)}
              className="flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.97]"
              style={{
                height: "32px",
                padding: "0 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                border: `1px solid ${actions.isOwned ? "#D9D5D0" : "#E8E4DF"}`,
                backgroundColor: actions.isOwned ? "#F2EFE9" : "#FFFFFF",
                color: actions.isOwned ? "#A69D92" : "#8A8278",
              }}
            >
              <ShoppingBag size={11} /> {actions.isOwned ? "보유중" : "보유추가"}
            </button>
          )}
          {actions.onToggleLike && !onLike && (
            <button
              onClick={(e) => handleAction(e, actions.onToggleLike)}
              className="flex items-center justify-center cursor-pointer transition-all active:scale-[0.97]"
              style={{
                height: "32px",
                padding: "0 10px",
                borderRadius: "6px",
                border: `1px solid ${actions.isLiked ? "#F5C5BB" : "#E8E4DF"}`,
                backgroundColor: actions.isLiked ? "#FEF2EF" : "#FFFFFF",
              }}
            >
              <Heart size={15} style={{ color: actions.isLiked ? "#E8715A" : "#C4BEB7", fill: actions.isLiked ? "#E8715A" : "none" }} />
            </button>
          )}
          {actions.showCompare && actions.onCompare && (
            <button
              onClick={(e) => handleAction(e, actions.onCompare)}
              className="flex items-center justify-center cursor-pointer transition-all active:scale-[0.97]"
              style={{
                height: "32px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid #E8E4DF",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Scale size={15} style={{ color: "#C4BEB7" }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
