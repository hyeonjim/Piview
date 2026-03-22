"use client";

import React, { useState } from "react";
import { Heart, Plus, Check, ShoppingBag, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EWGIndicator from "./EWGIndicator";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import { useLike } from "@/hooks";

// ── 그림자 — border 없이 입체감을 주는 자연스러운 레이어드 shadow
const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.16)";

// ── 비교/보유 버튼 공통 활성/비활성 스타일
const ACTION_BUTTON_ACTIVE = {
  border: "1px solid #A69D92",
  backgroundColor: "#F2EFE9",
  color: "#6B6258",
};
const ACTION_BUTTON_INACTIVE = {
  border: "1px solid #E8E4DF",
  backgroundColor: "#FFFFFF",
  color: "#C4BEB7",
};

// ── 인터페이스 ──────────────────────────────────────────────────────
interface ProductCardProps {
  id: number | string;
  name: string;
  brand: string;
  imageUrl?: string;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
  layout?: "vertical" | "horizontal" | "grid";
  category?: string;
  emoji?: string;
  skinTypes?: string[];
  effects?: string[];
  /** 피부기능별 수치 점수 0~100 — ⚠️ API 연동 시 서버 값으로 교체 */
  effectScores?: Record<string, number>;
  price?: number;
  reason?: string;
  isRecommended?: boolean;
  variant?: "default" | "modal";
  /** 상세보기 버튼 표시 여부 (modal variant) */
  showDetailButton?: boolean;
  onDetailClick?: () => void;
  /** 상세페이지 링크 override — 미지정 시 /product/{id} */
  href?: string;
  /** 액션 버튼 영역 표시 여부 — true 일 때 루틴추가/보유추가/비교 버튼 노출 */
  showActions?: boolean;
  /** 루틴추가 콜백 */
  onAddRoutine?: () => void;
  /** 루틴 추가 상태 */
  inRoutine?: boolean;
  /** 보유추가 토글 콜백 */
  onToggleOwned?: () => void;
  /** 보유 상태 */
  isOwned?: boolean;
  /** 비교 선택 상태 */
  isInCompare?: boolean;
  /** 비교 토글 콜백 */
  onToggleCompare?: () => void;
  /** 좋아요 버튼 표시 여부 — false 시 heart 버튼 숨김 (기본값 true) */
  showLike?: boolean;
  /** EWG 지표 표시 여부 — false 시 피부타입·기능 태그로 대체 (기본값 true, horizontal 전용) */
  showEwg?: boolean;
}

// ── 피부타입 태그 — 색상이 동적(상수 맵)이므로 색상만 inline style 유지
// export: CompareModal 등 공통 사용
export function SkinTypeTag({ label }: { label: string }) {
  const color = SKIN_TYPE_TAG_COLORS[label] ?? {
    bg: "#F0EDE8",
    text: "#7A7060",
  };
  return (
    <span
      className="inline-block mb-2 text-[12px] font-semibold px-1.5 py-0.5 rounded-[3px]"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {label}
    </span>
  );
}

// ── 피부기능 태그 — 색상이 동적(상수 맵)이므로 색상만 inline style 유지
function EffectTag({ label }: { label: string }) {
  const color = SKIN_FUNCTION_COLORS[label];
  if (!color) return null;
  return (
    <span
      className="inline-block text-[12px] mb-2 font-semibold px-1.5 py-0.5 rounded-[3px]"
      style={{ backgroundColor: color.chip, color: color.accent }}
    >
      {label}
    </span>
  );
}

// ── PICK 배지 — 고정 색상이므로 Tailwind만 사용
function PickBadge() {
  return (
    <span className="text-[11px] font-semibold px-[7px] py-[3px] rounded-[10px] uppercase tracking-[0.06em] bg-[#3D3028] text-[#F2EFE9]">
      PICK
    </span>
  );
}

// ── 브랜드 라벨 — 공통 스타일
function BrandLabel({ brand }: { brand: string }) {
  return (
    <span className="text-[12px] font-bold text-[#BFB6AA] uppercase tracking-[0.08em]">
      {brand}
    </span>
  );
}

// ── 카테고리 칩 — 색상이 동적이므로 색상만 inline style 유지
function CategoryChip({
  category,
  categoryColor,
}: {
  category: string;
  categoryColor: { chip: string; accent: string };
}) {
  return (
    <span
      className="text-[12px] px-1.5 py-[1px] rounded-[3px] font-semibold"
      style={{
        backgroundColor: categoryColor.chip,
        color: categoryColor.accent,
      }}
    >
      {category}
    </span>
  );
}

// ── 루틴추가 버튼 — 상태에 따른 색상이 고정값이므로 Tailwind 조건부 클래스 사용
function RoutineButton({
  inRoutine,
  onAdd,
  className = "",
}: {
  inRoutine?: boolean;
  onAdd: (event: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onAdd}
      disabled={inRoutine}
      className={`flex items-center justify-center gap-1 h-6 rounded-[6px] text-xs font-semibold border-none cursor-pointer transition-all active:scale-[0.97] ${
        inRoutine
          ? "bg-[#F2EFE9] text-[#A69D92]"
          : "bg-[#3D3028] text-[#F2EFE9]"
      } ${className}`}
    >
      {inRoutine ? (
        <>
          <Check size={11} /> 추가됨
        </>
      ) : (
        <>
          <Plus size={11} /> 루틴추가
        </>
      )}
    </button>
  );
}

// ── 보유추가 버튼 — 상태에 따라 색상이 바뀌므로 inline style 유지
function OwnedButton({
  isOwned,
  onToggle,
  size = "sm",
}: {
  isOwned?: boolean;
  onToggle: (event: React.MouseEvent) => void;
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center cursor-pointer transition-all active:scale-[0.97] shrink-0 ${
        isSmall
          ? "h-7 w-9 rounded-[6px]"
          : "gap-1 h-8 px-2.5 rounded-[6px] text-xs font-bold"
      }`}
      style={isOwned ? ACTION_BUTTON_ACTIVE : ACTION_BUTTON_INACTIVE}
      title={isOwned ? "보유 중" : "보유추가"}
    >
      <ShoppingBag size={isSmall ? 14 : 11} />
      {!isSmall && (isOwned ? "보유중" : "보유추가")}
    </button>
  );
}

// ── 비교 버튼 — 선택 여부에 따라 색상이 바뀌므로 inline style 유지
function CompareButton({
  isInCompare,
  onToggle,
  size = "sm",
}: {
  isInCompare?: boolean;
  onToggle: (event: React.MouseEvent) => void;
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center cursor-pointer transition-all active:scale-[0.97] shrink-0 ${
        isSmall ? "h-7 w-9 rounded-[6px]" : "h-8 px-2.5 rounded-[6px]"
      }`}
      style={isInCompare ? ACTION_BUTTON_ACTIVE : ACTION_BUTTON_INACTIVE}
      title={isInCompare ? "비교 선택됨" : "비교하기"}
    >
      <Scale size={isSmall ? 14 : 15} />
    </button>
  );
}

// ── 제품 이미지 — onError로 broken 이미지 fallback 처리
// fill 모드와 fixed 모드를 모두 지원
function ProductImage({
  imageUrl,
  name,
  emoji,
  sizes,
  className,
  width,
  height,
}: {
  imageUrl?: string | null;
  name: string;
  emoji?: string;
  sizes?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (!imageUrl || imgError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-3xl bg-[#F5F2EC]">
        {emoji || "🧴"}
      </div>
    );
  }

  // fixed size 모드 (modal variant 썸네일)
  if (width && height) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={width}
        height={height}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  // fill 모드
  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      sizes={sizes}
      className={className}
      onError={() => setImgError(true)}
    />
  );
}

function LikeButton({
  isLiked,
  onToggle,
}: {
  isLiked: boolean;
  onToggle: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center h-8 px-2.5 rounded-[6px] cursor-pointer transition-all active:scale-[0.97]"
      style={{
        border: `1px solid ${isLiked ? "#F5C5BB" : "#E8E4DF"}`,
        backgroundColor: isLiked ? "#FEF2EF" : "#FFFFFF",
      }}
    >
      <Heart
        size={15}
        style={{
          color: isLiked ? "#E8715A" : "#C4BEB7",
          fill: isLiked ? "#E8715A" : "none",
        }}
      />
    </button>
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
  layout = "vertical",
  category,
  emoji,
  skinTypes = [],
  effects = [],
  reason,
  isRecommended = false,
  variant = "default",
  showDetailButton = false,
  onDetailClick,
  href,
  showActions = false,
  onAddRoutine,
  inRoutine,
  onToggleOwned,
  isOwned,
  isInCompare = false,
  onToggleCompare = () => {},
  showLike = true,
  showEwg = true,
}: ProductCardProps) {
  const { likeList, toggleLike } = useLike();
  const isLiked = !!likeList[String(id)];

  // 상세페이지 링크 — href prop 우선, 없으면 기본 경로
  const productHref = href ?? `/product/${id}`;

  const handleLike = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleLike(id);
  };

  const handleAction = (event: React.MouseEvent, callback?: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    callback?.();
  };

  const categoryColor = category ? CATEGORY_COLORS[category] : undefined;
  const showPickBadge = isRecommended || !!reason;

  // 좋아요 Heart 아이콘 스타일 — 색상이 동적이므로 inline style
  const heartStyle = {
    color: isLiked ? "#E8715A" : "#C4BEB7",
    fill: isLiked ? "#E8715A" : "none",
  };

  // ── 1. GRID — 2열 제품 카드 ────────────────────────────────────────
  if (layout === "grid") {
    return (
      <div
        className="relative flex flex-col overflow-hidden bg-white rounded-modal w-full min-w-0"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <Link href={productHref} className="no-underline flex flex-col flex-1">
          {/* 이미지 — 3/2 */}
          <div className="relative w-full aspect-3/2 overflow-hidden">
            <ProductImage
              imageUrl={imageUrl}
              name={name}
              emoji={emoji}
              sizes="(max-width: 500px) 50vw, 250px"
              className="object-contain"
            />

            {/* 좋아요 버튼 — showLike=false 시 숨김 */}
            {showLike && (
              <button
                onClick={handleLike}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border-none cursor-pointer backdrop-blur-xs"
                style={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <Heart
                  size={16}
                  className="transition-all duration-150"
                  style={heartStyle}
                />
              </button>
            )}

            {showPickBadge && (
              <div className="absolute top-2 left-2">
                <PickBadge />
              </div>
            )}
          </div>

          {/* 텍스트 영역 — 고정 높이로 카드 간 높이 통일 */}
          <div
            className="px-3 pt-2.5 pb-2 overflow-hidden"
            style={{ height: "96px" }}
          >
            {/* 브랜드명 + 비교 버튼 한 줄 */}
            <div className="flex items-center justify-between">
              <BrandLabel brand={brand} />
              {showActions && (
                <CompareButton
                  isInCompare={isInCompare}
                  onToggle={(event) => handleAction(event, onToggleCompare)}
                  size="sm"
                />
              )}
            </div>
            <p className="mt-0.75 m-0 text-[17px] font-semibold text-[#2A2118] leading-[1.4] line-clamp-2 overflow-hidden">
              {name}
            </p>
            {(skinTypes.length > 0 || effects.length > 0) && (
              <div className="flex flex-wrap gap-1.25 mt-1.5">
                {skinTypes.slice(0, 1).map((skinType) => (
                  <SkinTypeTag key={skinType} label={skinType} />
                ))}
                {effects.slice(0, 1).map((effect) => (
                  <EffectTag key={effect} label={effect} />
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* 액션 버튼 영역 — 루틴추가/보유추가 제거, 비교는 상단으로 이동 */}
      </div>
    );
  }

  // ── 2. HORIZONTAL ─────────────────────────────────────────────────
  if (layout === "horizontal") {
    return (
      <Link href={productHref}>
        <div className="flex items-center overflow-hidden h-22 bg-white rounded-[10px] border border-[#E2DDD8] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="relative shrink-0 w-22 h-full overflow-hidden">
            <ProductImage
              imageUrl={imageUrl}
              name={name}
              emoji={emoji}
              sizes="88px"
              className="object-cover"
            />
          </div>

          <div className="flex-1 px-3 py-2 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <BrandLabel brand={brand} />
              {categoryColor && (
                <CategoryChip
                  category={category!}
                  categoryColor={categoryColor}
                />
              )}
            </div>
            <p className="mt-0.75 m-0 text-[16px] font-bold text-[#2A2118] leading-[1.4]">
              {name}
            </p>
            {showEwg ? (
              // EWG 지표 표시 (기본값)
              <EWGIndicator
                safe={ewgSafe}
                caution={ewgCaution}
                danger={ewgDanger}
                className="mt-1.5"
              />
            ) : (
              // 피부타입·기능 태그로 대체
              <div className="flex flex-wrap gap-1 mt-1">
                {skinTypes.slice(0, 1).map((skinType) => (
                  <SkinTypeTag key={skinType} label={skinType} />
                ))}
                {effects.slice(0, 2).map((effect) => (
                  <EffectTag key={effect} label={effect} />
                ))}
              </div>
            )}
          </div>

          {/* 좋아요 버튼 — showLike=false 시 숨김 */}
          {showLike && (
            <button
              onClick={handleLike}
              className="p-3 shrink-0 bg-transparent border-none cursor-pointer"
            >
              <Heart size={17} style={heartStyle} />
            </button>
          )}
        </div>
      </Link>
    );
  }

  // ── 3. MODAL VARIANT ──────────────────────────────────────────────
  if (variant === "modal") {
    return (
      <div
        className="rounded-[10px] p-3"
        style={{
          // 루틴 추가 여부에 따라 배경/테두리 색이 바뀌므로 inline style 유지
          border: `1px solid ${inRoutine ? "#D9D5D0" : "#EDEBE8"}`,
          backgroundColor: inRoutine ? "#F2EFE9" : "#FFFFFF",
        }}
      >
        <Link href={productHref} className="no-underline">
          <div className="flex items-center gap-3">
            {/* 썸네일 */}
            <div className="relative shrink-0 w-15 h-15 overflow-hidden rounded-lg bg-[#F5F2EC]">
              <ProductImage
                imageUrl={imageUrl}
                name={name}
                emoji={emoji}
                width={60}
                height={60}
                className="object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <BrandLabel brand={brand} />
                {categoryColor && (
                  <CategoryChip
                    category={category!}
                    categoryColor={categoryColor}
                  />
                )}
                {showPickBadge && <PickBadge />}
              </div>
              <p className="m-0 text-[13px] font-bold text-[#2A2118] truncate">
                {name}
              </p>
              <div className="flex flex-wrap gap-0.75 mt-1.25">
                {skinTypes.map((skinType) => (
                  <SkinTypeTag key={skinType} label={skinType} />
                ))}
                {effects.slice(0, 3).map((effect) => (
                  <EffectTag key={effect} label={effect} />
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* 액션 버튼 영역 — showActions=true 일 때만 표시 */}
        {showActions && (
          <div className="flex gap-2 mt-2.5 mb-3">
            {onAddRoutine && (
              <RoutineButton
                inRoutine={inRoutine}
                onAdd={(event) => handleAction(event, onAddRoutine)}
                className="flex-1"
              />
            )}
            {showDetailButton && (
              <button
                onClick={(event) => handleAction(event, onDetailClick)}
                className="flex items-center justify-center h-8 px-3 rounded-[6px] text-xs text-[#8A8278] bg-white border border-[#E8E4DF] cursor-pointer active:scale-[0.97]"
              >
                상세보기
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── 4. VERTICAL — 기본값 ──────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col overflow-hidden w-full bg-white rounded-[10px] border border-[#E2DDD8]"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <Link href={productHref} className="no-underline">
        <div className="relative h-27 overflow-hidden">
          <ProductImage
            imageUrl={imageUrl}
            name={name}
            emoji={emoji}
            sizes="(max-width: 500px) 50vw, 250px"
            className="object-cover"
          />
        </div>

        <div className="px-3.5 pt-3 pb-3.5">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <BrandLabel brand={brand} />
            {categoryColor && (
              <CategoryChip
                category={category!}
                categoryColor={categoryColor}
              />
            )}
            {showPickBadge && <PickBadge />}
          </div>

          <p className="m-0 text-[18px] font-semibold text-[#2A2118] leading-[1.45] line-clamp-2 overflow-hidden">
            {name}
          </p>

          <div className="flex flex-wrap gap-0.75 mt-1.75">
            {skinTypes.map((skinType) => (
              <SkinTypeTag key={skinType} label={skinType} />
            ))}
            {effects.slice(0, 3).map((effect) => (
              <EffectTag key={effect} label={effect} />
            ))}
          </div>

          {(ewgSafe > 0 || ewgCaution > 0 || ewgDanger > 0) && (
            <EWGIndicator
              safe={ewgSafe}
              caution={ewgCaution}
              danger={ewgDanger}
              className="mt-2"
            />
          )}
        </div>
      </Link>

      {reason && (
        <p className="m-0 text-[13px] text-[#A69D92] px-3.5 pb-2 leading-[1.55]">
          {reason}
        </p>
      )}

      {/* 액션 버튼 영역 — showActions=true 일 때만 표시 */}
      {showActions && (
        <div className="flex gap-1.5 flex-wrap px-3 pb-3">
          {onAddRoutine && (
            <RoutineButton
              inRoutine={inRoutine}
              onAdd={(event) => handleAction(event, onAddRoutine)}
              className="flex-1 min-w-20"
            />
          )}
          {onToggleOwned && (
            <OwnedButton
              isOwned={isOwned}
              onToggle={(event) => handleAction(event, onToggleOwned)}
              size="md"
            />
          )}
          <LikeButton isLiked={isLiked} onToggle={handleLike} />
          {onToggleCompare && (
            <CompareButton
              isInCompare={isInCompare}
              onToggle={(event) => handleAction(event, onToggleCompare)}
              size="md"
            />
          )}
        </div>
      )}
    </div>
  );
}
