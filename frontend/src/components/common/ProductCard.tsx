"use client";

import { Heart, Plus, Check, ShoppingBag, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EWGIndicator from "./EWGIndicator";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import { useLikeStore } from "@/stores/useLikeStore";

// ── 복잡한 그림자 — Tailwind 임의값으로 표현하기 번거로운 경우만 상수로 분리
const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)";

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
  /** grid 레이아웃에서 루틴추가/보유추가/비교 버튼 표시 여부 */
  showActions?: boolean;
  /** grid 레이아웃에서 루틴추가 콜백 */
  onAddRoutine?: () => void;
  /** grid 레이아웃에서 루틴추가 상태 */
  inRoutine?: boolean;
  /** grid 레이아웃에서 보유추가 콜백 */
  onToggleOwned?: () => void;
  /** grid 레이아웃에서 보유 상태 */
  isOwned?: boolean;
  /** grid 레이아웃에서 비교 선택 상태 */
  isInCompare?: boolean;
  /** grid 레이아웃에서 비교 토글 콜백 */
  onToggleCompare?: () => void;
}

// ── 피부타입 태그 — 색상이 동적(상수 맵)이므로 색상만 inline style 유지
// export: CompareModal 등 공통 사용
export function SkinTypeTag({ label }: { label: string }) {
  const color = SKIN_TYPE_TAG_COLORS[label] ?? { bg: "#F0EDE8", text: "#7A7060" };
  return (
    <span
      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px] tracking-[0.02em]"
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
      className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]"
      style={{ backgroundColor: color.chip, color: color.accent }}
    >
      {label}
    </span>
  );
}

// ── PICK 배지 — 고정 색상이므로 Tailwind만 사용
function PickBadge() {
  return (
    <span className="text-[9px] font-semibold px-[7px] py-[3px] rounded-[3px] uppercase tracking-[0.06em] bg-[#3D3028] text-[#F2EFE9]">
      PICK
    </span>
  );
}

// ── 브랜드 라벨 — 공통 스타일
function BrandLabel({ brand }: { brand: string }) {
  return (
    <span className="text-[10px] font-medium text-[#BFB6AA] uppercase tracking-[0.08em]">
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
      className="text-[10px] px-1.5 py-[1px] rounded-[3px] font-medium"
      style={{ backgroundColor: categoryColor.chip, color: categoryColor.accent }}
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
      className={`flex items-center justify-center gap-1 h-8 rounded-[6px] text-xs font-semibold border-none cursor-pointer transition-all active:scale-[0.97] ${
        inRoutine ? "bg-[#F2EFE9] text-[#A69D92]" : "bg-[#3D3028] text-[#F2EFE9]"
      } ${className}`}
    >
      {inRoutine ? <><Check size={11} /> 추가됨</> : <><Plus size={11} /> 루틴추가</>}
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
  actions,
  variant = "default",
  showDetailButton = false,
  onDetailClick,
  showActions = false,
  onAddRoutine,
  inRoutine,
  onToggleOwned,
  isOwned,
  isInCompare = false,
  onToggleCompare = () => {},
}: ProductCardProps) {
  // 전역 찜 스토어 사용 — 페이지 간 상태 공유
  const { isLiked: getIsLiked, toggleLike } = useLikeStore();
  const isLiked = getIsLiked(id);

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

  // 비교 버튼 스타일 — 선택 여부에 따라 변경
  const compareButtonStyle = isInCompare
    ? { border: "1px solid #A69D92", backgroundColor: "#F2EFE9", color: "#6B6258" }
    : { border: "1px solid #E8E4DF", backgroundColor: "#FFFFFF", color: "#C4BEB7" };

  // ── 1. GRID — 2열 제품 카드 ────────────────────────────────────────
  if (layout === "grid") {
    return (
      <div
        className="relative flex flex-col overflow-hidden bg-white rounded-[10px] border border-[#E2DDD8]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <Link href={`/product/${id}`} className="no-underline flex flex-col">
          {/* 이미지 — 3:2 비율 */}
          <div className="relative w-full aspect-[3/2] bg-[#F5F2EC]">
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {emoji || "🧴"}
              </div>
            )}

            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border-none cursor-pointer backdrop-blur-[4px]"
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <Heart size={14} className="transition-all duration-150" style={heartStyle} />
            </button>

            {showPickBadge && (
              <div className="absolute top-2 left-2">
                <PickBadge />
              </div>
            )}
          </div>

          {/* 텍스트 영역 */}
          <div className="px-3 pt-[10px] pb-2">
            <BrandLabel brand={brand} />
            <p className="mt-[3px] m-0 text-[13px] font-medium text-[#2A2118] leading-[1.4] line-clamp-2">
              {name}
            </p>
            {(skinTypes.length > 0 || effects.length > 0) && (
              <div className="flex flex-wrap gap-[5px] mt-1.5">
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

        {/* 액션 버튼 영역 — showActions=true 일 때만 표시 */}
        {showActions && (
          <div className="px-2.5 pb-2.5 flex gap-1.5">
            {/* 루틴추가 버튼 */}
            <RoutineButton
              inRoutine={inRoutine}
              onAdd={(event) => handleAction(event, onAddRoutine)}
              className="flex-1 text-[11px] h-7"
            />
            {/* 보유추가 버튼 */}
            <button
              onClick={(event) => handleAction(event, onToggleOwned)}
              className="flex items-center justify-center h-7 w-7 rounded-[6px] cursor-pointer transition-all active:scale-[0.97] shrink-0"
              style={{
                border: `1px solid ${isOwned ? "#D9D5D0" : "#E8E4DF"}`,
                backgroundColor: isOwned ? "#F2EFE9" : "#FFFFFF",
              }}
              title={isOwned ? "보유 중" : "보유추가"}
            >
              <ShoppingBag size={12} style={{ color: isOwned ? "#A69D92" : "#C4BEB7" }} />
            </button>
            {/* 비교 버튼 */}
            <button
              onClick={(event) => handleAction(event, onToggleCompare)}
              className="flex items-center justify-center h-7 w-7 rounded-[6px] cursor-pointer transition-all active:scale-[0.97] shrink-0"
              style={compareButtonStyle}
              title={isInCompare ? "비교 선택됨" : "비교하기"}
            >
              <Scale size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── 2. HORIZONTAL ─────────────────────────────────────────────────
  if (layout === "horizontal") {
    return (
      <Link href={`/product/${id}`}>
        <div className="flex items-center overflow-hidden h-[88px] bg-white rounded-[10px] border border-[#E2DDD8] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="relative shrink-0 w-[88px] h-full bg-[#F5F2EC]">
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[28px]">
                {emoji || "🧴"}
              </div>
            )}
          </div>

          <div className="flex-1 px-3 py-2 min-w-0">
            <BrandLabel brand={brand} />
            <p className="mt-[3px] m-0 text-[13px] font-medium text-[#2A2118] leading-[1.4]">
              {name}
            </p>
            <EWGIndicator safe={ewgSafe} caution={ewgCaution} danger={ewgDanger} className="mt-1.5" />
          </div>

          <button
            onClick={handleLike}
            className="p-3 shrink-0 bg-transparent border-none cursor-pointer"
          >
            <Heart size={17} style={heartStyle} />
          </button>
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
          border: `1px solid ${actions?.inRoutine ? "#D9D5D0" : "#EDEBE8"}`,
          backgroundColor: actions?.inRoutine ? "#F2EFE9" : "#FFFFFF",
        }}
      >
        <Link href={`/product/${id}`} className="no-underline">
          <div className="flex items-center gap-3">
            {/* 썸네일 */}
            <div className="shrink-0 w-[60px] h-[60px] flex items-center justify-center rounded-lg bg-[#F5F2EC]">
              {emoji ? (
                <span className="text-[26px]">{emoji}</span>
              ) : imageUrl ? (
                <Image src={imageUrl} alt={name} width={60} height={60} className="object-cover rounded-lg" />
              ) : (
                <span className="text-[22px]">🧴</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-[2px]">
                <BrandLabel brand={brand} />
                {categoryColor && <CategoryChip category={category!} categoryColor={categoryColor} />}
                {showPickBadge && <PickBadge />}
              </div>
              <p className="m-0 text-[13px] font-medium text-[#2A2118] truncate">
                {name}
              </p>
              <div className="flex flex-wrap gap-[3px] mt-[5px]">
                {skinTypes.map((skinType) => <SkinTypeTag key={skinType} label={skinType} />)}
                {effects.slice(0, 3).map((effect) => <EffectTag key={effect} label={effect} />)}
              </div>
            </div>
          </div>
        </Link>

        <div className="flex gap-2 mt-[10px]">
          {actions?.onAddRoutine && (
            <RoutineButton
              inRoutine={actions.inRoutine}
              onAdd={(event) => handleAction(event, actions.onAddRoutine)}
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
      </div>
    );
  }

  // ── 4. VERTICAL — 기본값 ──────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col overflow-hidden w-full bg-white rounded-[10px] border border-[#E2DDD8]"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <Link href={`/product/${id}`} className="no-underline">
        <div className="relative h-[108px] bg-[#F5F2EC]">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[30px]">
              {emoji || "🧴"}
            </div>
          )}
        </div>

        <div className="px-[14px] pt-3 pb-[14px]">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <BrandLabel brand={brand} />
            {categoryColor && <CategoryChip category={category!} categoryColor={categoryColor} />}
            {showPickBadge && <PickBadge />}
          </div>

          <p className="m-0 text-sm font-medium text-[#2A2118] leading-[1.45] line-clamp-2">
            {name}
          </p>

          <div className="flex flex-wrap gap-[3px] mt-[7px]">
            {skinTypes.map((skinType) => <SkinTypeTag key={skinType} label={skinType} />)}
            {effects.slice(0, 3).map((effect) => <EffectTag key={effect} label={effect} />)}
          </div>

          {(ewgSafe > 0 || ewgCaution > 0 || ewgDanger > 0) && (
            <EWGIndicator safe={ewgSafe} caution={ewgCaution} danger={ewgDanger} className="mt-2" />
          )}
        </div>
      </Link>

      {reason && (
        <p className="m-0 text-[13px] text-[#A69D92] px-[14px] pb-2 leading-[1.55]">
          {reason}
        </p>
      )}

      {actions && (
        <div className="flex gap-1.5 flex-wrap px-3 pb-3">
          {actions.onAddRoutine && (
            <RoutineButton
              inRoutine={actions.inRoutine}
              onAdd={(event) => handleAction(event, actions.onAddRoutine)}
              className="flex-1 min-w-[80px]"
            />
          )}
          {actions.onToggleOwned && (
            <button
              onClick={(event) => handleAction(event, actions.onToggleOwned)}
              className="flex items-center justify-center gap-1 h-8 px-[10px] rounded-[6px] text-xs font-medium cursor-pointer transition-all active:scale-[0.97]"
              style={{
                // 보유 여부에 따라 색상이 바뀌므로 inline style 유지
                border: `1px solid ${actions.isOwned ? "#D9D5D0" : "#E8E4DF"}`,
                backgroundColor: actions.isOwned ? "#F2EFE9" : "#FFFFFF",
                color: actions.isOwned ? "#A69D92" : "#8A8278",
              }}
            >
              <ShoppingBag size={11} />
              {actions.isOwned ? "보유중" : "보유추가"}
            </button>
          )}
          {actions.onToggleLike && (
            <button
              onClick={(event) => handleAction(event, actions.onToggleLike)}
              className="flex items-center justify-center h-8 px-[10px] rounded-[6px] cursor-pointer transition-all active:scale-[0.97]"
              style={{
                // 찜 여부에 따라 색상이 바뀌므로 inline style 유지
                border: `1px solid ${actions.isLiked ? "#F5C5BB" : "#E8E4DF"}`,
                backgroundColor: actions.isLiked ? "#FEF2EF" : "#FFFFFF",
              }}
            >
              <Heart
                size={15}
                style={{
                  color: actions.isLiked ? "#E8715A" : "#C4BEB7",
                  fill: actions.isLiked ? "#E8715A" : "none",
                }}
              />
            </button>
          )}
          {actions.showCompare && actions.onCompare && (
            <button
              onClick={(event) => handleAction(event, actions.onCompare)}
              className="flex items-center justify-center h-8 px-[10px] rounded-[6px] bg-white border border-[#E8E4DF] cursor-pointer transition-all active:scale-[0.97]"
            >
              <Scale size={15} className="text-[#C4BEB7]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
