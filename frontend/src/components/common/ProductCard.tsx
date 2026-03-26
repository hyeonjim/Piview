"use client";

import React, { useState } from "react";
import { Heart, Check, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EWGIndicator from "./EWGIndicator";
import CompareIcon from "./CompareIcon";
import { useLike } from "@/hooks";

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
  /** 상세페이지 링크 override — 미지정 시 /product/{id} */
  href?: string;
  /** 액션 버튼 영역 표시 여부 — true 일 때 보유추가/비교 버튼 노출 */
  showActions?: boolean;
  /** 카테고리 칩 표시 여부 — false 시 칩 숨김, URL 파라미터는 유지 */
  showCategory?: boolean;
  /** grid 레이아웃에서 카테고리를 브랜드와 같은 줄에 표시 — true 시 인라인, false(기본) 시 다음 줄 */
  categoryInline?: boolean;
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
  /** 좋아요 토글 외부 핸들러 — 넘기면 내부 useLike 대신 사용 */
  onToggleLike?: () => void;
  /** EWG 지표 표시 여부 — false 시 피부타입·기능 태그로 대체 (기본값 true, horizontal 전용) */
  showEwg?: boolean;
  /** LCP 최적화 — 화면 상단 첫 카드에만 true (기본값 false) */
  priority?: boolean;
  /** modal variant 이미지 컨테이너 추가 클래스 — 페이지별 이미지 정렬 override용 */
  imageContainerClassName?: string;
}

// ── 피부타입 태그 — 미니멀 스타일
// export: CompareModal 등 공통 사용
// label은 매핑 단계(productMapper)에서 이미 한글 변환 완료 상태로 전달됨
export function SkinTypeTag({ label }: { label: string }) {
  return (
    <span className="inline-block mb-1 mr-1.5 text-[11px] font-medium px-1 rounded bg-[#f5ecdf] text-[#514a42]">
      {label}
    </span>
  );
}

// ── 피부기능 태그 — 미니멀 스타일
function EffectTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] mb-1 mr-1 font-medium px-1.5 py-px border rounded-3xl bg-[#fcfcfc] text-[#7a664e]">
      {label}
    </span>
  );
}

// ── PICK 배지 — RoutineAddModal의 분홍 스타일로 통일
function PickBadge() {
  return (
    <span className="text-[12px] font-semibold px-1.5 py-0.5 rounded-[10px] tracking-[0.06em] bg-[#faebf2] text-[#707173]">
      PICK
    </span>
  );
}

// ── 브랜드 라벨 — 작고 연한 스타일
function BrandLabel({ brand }: { brand: string }) {
  return (
    <span className="text-[12px] font-semibold text-[#604e36]">{brand}</span>
  );
}

// ── 카테고리 칩 — 나중에 색상 적용 예정, 현재 기본 스타일 유지
function CategoryChip({ category }: { category: string }) {
  return (
    <span className="text-[10px] px-1 py-px rounded-[10px] font-medium bg-[#f1efea] text-[#6d6557]">
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
      className={`flex items-center justify-center cursor-pointer transition-all active:scale-[0.97] shrink-0 border rounded-[12px] ${
        isSmall ? "h-6 w-8" : "gap-1 h-5 px-2 text-[11px] font-semibold"
      } ${
        isInCompare
          ? "border-[#e9c8b3] bg-[#e9c8b3] text-white"
          : "border-[#c4c2c2] bg-white text-[#887a67]"
      }`}
      title={isInCompare ? "비교 선택됨" : "비교하기"}
    >
      <CompareIcon
        size={isSmall ? 16 : 14}
        color={isInCompare ? "white" : "#887a67"}
      />
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
          color: isLiked ? "#f58b78" : "var(--color-nav-inactive)",
          fill: isLiked ? "#f58b78" : "none",
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
  href,
  showActions = false,
  onAddRoutine,
  inRoutine,
  onToggleOwned,
  isOwned,
  isInCompare = false,
  onToggleCompare,
  showLike = true,
  showEwg = true,
  showCategory = true,
  categoryInline = false,
  priority = false,
  onToggleLike,
  imageContainerClassName,
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
    // 외부 핸들러가 있으면 우선 사용, 없으면 내부 useLike 사용
    if (onToggleLike) onToggleLike();
    else toggleLike(id);
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
        className="relative flex flex-col overflow-hidden bg-white rounded-2xl w-full h-full min-w-0 border border-[#ede8e0] transition-shadow duration-200"
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
              className="object-contain pt-3"
              priority={priority}
            />

            {/* 좋아요 버튼 */}
            {showLike && (
              <button
                onClick={handleLike}
                className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center border-none cursor-pointer"
              >
                <Heart
                  size={20}
                  className="transition-all duration-150"
                  style={{
                    color: isLiked ? "#f69d8d" : "#d9d5d0",
                    fill: isLiked ? "#f69d8d" : "none",
                  }}
                />
              </button>
            )}

            {/* 비교하기 버튼 — 이미지 우측 하단 절대위치 */}
            {showActions && (
              <div className="absolute bottom-1 right-2">
                <CompareButton
                  isInCompare={isInCompare}
                  onToggle={(event) => handleAction(event, onToggleCompare)}
                  size="sm"
                />
              </div>
            )}

            {showPickBadge && (
              <div className="absolute top-2 left-2.5">
                <PickBadge />
              </div>
            )}
          </div>

          {/* 텍스트 영역 — 같은 행 카드 높이 통일 (grid items-stretch) + 태그 전체 표시 */}
          <div className="px-3 pt-3 pb-2.5 flex-1">
            {categoryInline ? (
              /* 브랜드 + 카테고리 한 줄 (likes 페이지 등) */
              <div className="flex items-center gap-1.5">
                <BrandLabel brand={brand} />
                {showCategory && category && (
                  <CategoryChip category={category} />
                )}
              </div>
            ) : (
              /* 카테고리 위, 브랜드 아래 (OwnedTab 등) */
              <>
                {showCategory && category && (
                  <div>
                    <CategoryChip category={category} />
                  </div>
                )}
                <div className="mb-1">
                  <BrandLabel brand={brand} />
                </div>
              </>
            )}
            <p className="text-[14px] font-semibold text-[#4d4237] leading-[1.4] line-clamp-2">
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
              {showCategory && category && <CategoryChip category={category} />}
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
                  color: isLiked ? "#f27b66" : "var(--color-nav-inactive)",
                  fill: isLiked ? "#f27b66" : "none",
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
        className={[
          "relative rounded-2xl p-3 mx-2 bg-white transition-shadow duration-200",
          inRoutine ? "ring-1 ring-(--color-brand-light)" : "",
        ].join(" ")}
        style={{
          boxShadow: inRoutine
            ? "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(166,157,146,0.15), 0 7px 18px rgba(0,0,0,0.06)"
            : "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(180,155,120,0.09), 0 7px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(180,155,120,0.04)",
        }}
      >
        {/* PICK 배지 — 카드 좌측 상단 절대위치 */}
        {showPickBadge && (
          <div className="absolute top-2 left-2">
            <PickBadge />
          </div>
        )}

        {/* 제품 정보 행 — 클릭 시 상세 페이지 이동 */}
        <Link href={productHref} className="no-underline">
          <div className="flex items-center gap-2">
            {/* 이미지 */}
            <div className="relative w-20 h-20 shrink-0">
              <div
                className={`w-full h-full flex items-center rounded-xl bg-[#faf9f7] overflow-hidden${imageContainerClassName !== undefined && imageContainerClassName !== null ? (imageContainerClassName ? ` ${imageContainerClassName}` : "") : " mt-5"}`}
              >
                <ProductImage
                  imageUrl={imageUrl}
                  name={name}
                  emoji={emoji}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
            </div>

            {/* 텍스트 영역 */}
            <div className="flex-1 min-w-0">
              {/* 브랜드 + 카테고리 + 좋아요/비교 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BrandLabel brand={brand} />
                  {showCategory && category && (
                    <CategoryChip category={category} />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {showLike && (
                    <button
                      onClick={handleLike}
                      className="flex items-center justify-center w-7 h-7 rounded-full border-none cursor-pointer transition-all active:scale-[0.97] bg-transparent"
                    >
                      <Heart
                        size={16}
                        className="transition-all duration-150"
                        style={{
                          color: isLiked ? "#f27b66" : "#d9d5d0",
                          fill: isLiked ? "#f27b66" : "none",
                        }}
                      />
                    </button>
                  )}
                  {onToggleCompare && (
                    <button
                      onClick={(event) => handleAction(event, onToggleCompare)}
                      className={[
                        "flex items-center justify-center gap-1 h-5 px-1.5 rounded-[18px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97] shrink-0 border",
                        isInCompare
                          ? "border-[#e6aa84] bg-[#e6aa84] text-white"
                          : "border-category-pill-default-border bg-white text-[#887a67]",
                      ].join(" ")}
                    >
                      <CompareIcon
                        size={14}
                        color={isInCompare ? "white" : "#887a67"}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* 제품명 */}
              <p className="text-[14px] font-semibold text-[#61574e] leading-[1.4] line-clamp-2 mb-2">
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

              {/* 효과 태그 */}
              {effects.length > 0 && (
                <div className="flex flex-wrap mt-0.5">
                  {effects.map((effect) => (
                    <EffectTag key={effect} label={effect} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* 루틴추가 버튼 — 중앙 배치 */}
        {onAddRoutine && (
          <div className="flex justify-center mt-5">
            <button
              onClick={(event) => handleAction(event, onAddRoutine)}
              disabled={inRoutine}
              className={[
                "flex items-center justify-center gap-1 w-25 h-7 rounded-modal border-none cursor-pointer transition-all active:scale-[0.97] text-[13px] font-semibold",
                inRoutine
                  ? "bg-(--color-bg-beige) text-(--color-brand)"
                  : "bg-[#f1eae6] text-[#807d7d]",
              ].join(" ")}
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
          </div>
        )}
      </div>
    );
  }

  // ── 4. VERTICAL — 기본값 ──────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col overflow-hidden w-full bg-white rounded-[10px] border border-[var(--color-border)]"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.16)",
      }}
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
            {showCategory && category && <CategoryChip category={category} />}
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
                {effects.map((effect) => (
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
