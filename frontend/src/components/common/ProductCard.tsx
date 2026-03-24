"use client";

import React, { useState } from "react";
import { Heart, Check, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EWGIndicator from "./EWGIndicator";
import { useLike } from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";

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
  price?: number;
  reason?: string;
  isRecommended?: boolean;
  variant?: "default" | "modal";
  /** 상세보기 버튼 표시 여부 (modal variant) */
  showDetailButton?: boolean;
  onDetailClick?: () => void;
  /** 상세페이지 링크 override — 미지정 시 /product/{id} */
  href?: string;
  /** 액션 버튼 영역 표시 여부 — true 일 때 보유추가/비교 버튼 노출 */
  showActions?: boolean;
  /** 루틴추가 콜백 — 넘기면 버튼 표시, 안 넘기면 숨김 */
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
  /** LCP 최적화 — 화면 상단 첫 카드에만 true (기본값 false) */
  priority?: boolean;
}

// ── 피부타입 태그 — 미니멀 스타일
// export: CompareModal 등 공통 사용
export function SkinTypeTag({ label }: { label: string }) {
  // 영문 API 값("dry", "oily" 등)을 한글로 변환
  const koreanLabel = fromSkinTypeEnum(label);
  return (
    <span className="inline-block mb-1 mr-1 text-[11px] font-medium px-1.5 py-[1px] rounded bg-[#f4eddf] text-[#514a42]">
      {koreanLabel}
    </span>
  );
}

// ── 피부기능 태그 — 미니멀 스타일
function EffectTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[11px] mb-1 mr-1 font-medium px-1.5 py-[1px] rounded border bg-[#f8f8f6] text-[#7a664e]">
      {label}
    </span>
  );
}

// ── PICK 배지
function PickBadge() {
  return (
    <span className="text-[11px] font-semibold px-[7px] py-[3px] rounded-[10px] uppercase tracking-[0.06em] bg-[#3D3028] text-[var(--color-bg-beige)]">
      PICK
    </span>
  );
}

// ── 브랜드 라벨 — 작고 연한 스타일
function BrandLabel({ brand }: { brand: string }) {
  return (
    <span className="text-[12px] font-semibold text-[#88745a]">
      {brand}
    </span>
  );
}

// ── 카테고리 칩 — 나중에 색상 적용 예정, 현재 기본 스타일 유지
function CategoryChip({ category }: { category: string }) {
  return (
    <span className="text-[12px] px-1.5 py-[1px] rounded-[3px] font-semibold bg-[#EAE5DA] text-[#7A6F5C]">
      {category}
    </span>
  );
}

// ── 루틴추가 버튼
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
          ? "bg-[var(--color-bg-beige)] text-[var(--color-brand)]"
          : "bg-[#3D3028] text-[var(--color-bg-beige)]"
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

// ── 비교 버튼 — 미니멀 스타일
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
      className={`flex items-center justify-center cursor-pointer transition-all active:scale-[0.97] shrink-0 border rounded-[18px] ${
        isSmall ? "h-7 w-8" : "gap-1 h-6 px-1.5 text-[11px] font-medium"
      } ${
        isInCompare
          ? "border-[#e6aa84] bg-[#e6aa84] text-white"
          : "border-category-pill-default-border bg-white text-[#887a67]"
      }`}
      title={isInCompare ? "비교 선택됨" : "비교하기"}
    >
      {isInCompare ? "비교중" : "비교하기"}
    </button>
  );
}

// ── 보유추가 버튼 — 미니멀 스타일
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
  const activeStyle = {
    border: "1px solid #a69d92",
    backgroundColor: "#f5f3f0",
    color: "#6e6358",
  };
  const inactiveStyle = {
    border: "1px solid #e8e4e0",
    backgroundColor: "#fff",
    color: "#bfb6aa",
  };
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center cursor-pointer transition-all active:scale-[0.97] shrink-0 ${
        isSmall
          ? "h-7 w-9 rounded-[6px]"
          : "gap-1 h-8 px-2.5 rounded-[6px] text-xs font-bold"
      }`}
      style={isOwned ? activeStyle : inactiveStyle}
      title={isOwned ? "보유 중" : "보유추가"}
    >
      {!isSmall && (isOwned ? "보유중" : "보유추가")}
    </button>
  );
}


// ── 제품 이미지 — onError로 broken 이미지 fallback 처리
// fill 모드와 fixed size 모드를 모두 지원
function ProductImage({
  imageUrl,
  name,
  emoji,
  sizes,
  className,
  width,
  height,
  priority = false,
}: {
  imageUrl?: string | null;
  name: string;
  emoji?: string;
  sizes?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-3xl bg-[#faf9f7]">
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
        priority={priority}
        onError={() => setImageError(true)}
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
      priority={priority}
      onError={() => setImageError(true)}
    />
  );
}

// ── 좋아요 버튼
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
    >
      <Heart
        size={15}
        style={{
          color: isLiked ? "#E8715A" : "var(--color-nav-inactive)",
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
  priority = false,
}: ProductCardProps) {
  const { likeList, toggleLike } = useLike();
  const isLiked = !!likeList[String(id)];

  // 상세페이지 링크 — href prop 우선, 없으면 category searchParam 포함
  const productHref =
    href ??
    (category
      ? `/product/${id}?category=${encodeURIComponent(category)}`
      : `/product/${id}`);

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

  const showPickBadge = isRecommended || !!reason;

  // ── 1. GRID — 2열 제품 카드 (화이트 미니멀) ──────────────────────
  if (layout === "grid") {
    return (
      <div
        className="relative flex flex-col overflow-hidden bg-white rounded-2xl w-full min-w-0 border border-[#ede8e0] transition-shadow duration-200"
        style={{
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(180,155,120,0.09), 0 7px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(180,155,120,0.04)",
        }}
      >
        <Link href={productHref} className="no-underline flex flex-col flex-1">
          {/* 이미지 영역 — 밝은 배경 */}
          <div className="relative w-full aspect-[5/3] overflow-hidden">
            <ProductImage
              imageUrl={imageUrl}
              name={name}
              emoji={emoji}
              sizes="(max-width: 500px) 50vw, 250px"
              className="object-contain p-2"
              priority={priority}
            />

            {/* 좋아요 버튼 */}
            {showLike && (
              <button
                onClick={handleLike}
                className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center border-none cursor-pointer"
              >
                <Heart
                  size={16}
                  className="transition-all duration-150"
                  style={{
                    color: isLiked ? "#E8715A" : "#d9d5d0",
                    fill: isLiked ? "#E8715A" : "none",
                  }}
                />
              </button>
            )}

            {showPickBadge && (
              <div className="absolute top-2.5 left-2.5">
                <PickBadge />
              </div>
            )}
          </div>

          {/* 텍스트 영역 — 같은 행 카드 높이 통일 (grid items-stretch) + 태그 전체 표시 */}
          <div className="px-3 pt-3 pb-2.5 flex-1">
            {/* 브랜드명 + 비교 버튼 한 줄 */}
            <div className="flex items-center justify-between mb-1">
              <BrandLabel brand={brand} />
              {showActions && (
                <CompareButton
                  isInCompare={isInCompare}
                  onToggle={(event) => handleAction(event, onToggleCompare)}
                  size="md"
                />
              )}
            </div>
            <p className="text-[14px] font-semibold text-[#463a2e] leading-[1.4] line-clamp-2">
              {name}
            </p>
            {/* 피부타입 태그 */}
            {skinTypes.length > 0 && (
              <div className="flex flex-wrap mt-1.5">
                {skinTypes.map((skinType) => (
                  <SkinTypeTag key={skinType} label={skinType} />
                ))}
              </div>
            )}
            {/* 피부기능 태그 — 피부타입 다음 줄 */}
            {effects.length > 0 && (
              <div className="flex flex-wrap mt-0.5">
                {effects.map((effect) => (
                  <EffectTag key={effect} label={effect} />
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
      <Link href={productHref}>
        <div className="flex items-center overflow-hidden h-28 bg-white rounded-[10px] border border-[var(--color-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="relative shrink-0 w-22 h-full overflow-hidden">
            <ProductImage
              imageUrl={imageUrl}
              name={name}
              emoji={emoji}
              sizes="68px"
              className="object-cover"
            />
          </div>

          <div className="flex-1 px-3 py-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <BrandLabel brand={brand} />
              {category && <CategoryChip category={category} />}
            </div>
            <p className="mt-0.75 m-0 text-[16px] font-bold text-[var(--color-text-primary)] leading-[1.4]">
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
              <div className="mt-1">
                <div className="flex flex-wrap gap-1">
                  {skinTypes.slice(0, 1).map((skinType) => (
                    <SkinTypeTag key={skinType} label={skinType} />
                  ))}
                </div>
                {effects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {effects.map((effect) => (
                      <EffectTag key={effect} label={effect} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 좋아요 버튼 — showLike=false 시 숨김 */}
          {showLike && (
            <button
              onClick={handleLike}
              className="p-3 shrink-0 bg-transparent border-none cursor-pointer"
            >
              <Heart
                size={17}
                style={{
                  color: isLiked ? "#E8715A" : "var(--color-nav-inactive)",
                  fill: isLiked ? "#E8715A" : "none",
                }}
              />
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
        className="rounded-2xl p-3 bg-white"
        style={{
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(180,155,120,0.09), 0 7px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(180,155,120,0.04)",
        }}
      >
        <Link href={productHref} className="no-underline">
          <div className="flex items-center gap-3">
            {/* 썸네일 */}
            <div className="relative shrink-0 w-18 h-18 overflow-hidden rounded-lg">
              <ProductImage
                imageUrl={imageUrl}
                name={name}
                emoji={emoji}
                width={72}
                height={72}
                className="object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <BrandLabel brand={brand} />
                {category && <CategoryChip category={category} />}
                {showPickBadge && <PickBadge />}
              </div>
              <p className="m-0 text-[13px] font-bold text-[#463a2e] truncate">
                {name}
              </p>
              <div className="mt-1.25">
                <div className="flex flex-wrap gap-0.75">
                  {skinTypes.map((skinType) => (
                    <SkinTypeTag key={skinType} label={skinType} />
                  ))}
                </div>
                {effects.length > 0 && (
                  <div className="flex flex-wrap gap-0.75 mt-0.5">
                    {effects.map((effect) => (
                      <EffectTag key={effect} label={effect} />
                    ))}
                  </div>
                )}
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
                className="flex items-center justify-center h-8 px-3 rounded-[6px] text-xs text-[var(--color-text-hint)] bg-white border border-[#E8E4DF] cursor-pointer active:scale-[0.97]"
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
      className="relative flex flex-col overflow-hidden w-full bg-white rounded-[10px] border border-[var(--color-border)]"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.16)" }}
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
            {category && <CategoryChip category={category} />}
            {showPickBadge && <PickBadge />}
          </div>

          <p className="m-0 text-[16px] font-semibold text-[var(--color-text-primary)] leading-[1.45] line-clamp-2 overflow-hidden">
            {name}
          </p>

          <div className="mt-1.75">
            <div className="flex flex-wrap gap-0.75">
              {skinTypes.map((skinType) => (
                <SkinTypeTag key={skinType} label={skinType} />
              ))}
            </div>
            {effects.length > 0 && (
              <div className="flex flex-wrap gap-0.75 mt-0.5">
                {effects.slice(0, 3).map((effect) => (
                  <EffectTag key={effect} label={effect} />
                ))}
              </div>
            )}
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
        <p className="m-0 text-[13px] text-[var(--color-brand)] px-3.5 pb-2 leading-[1.55]">
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
            />
          )}
        </div>
      )}
    </div>
  );
}
