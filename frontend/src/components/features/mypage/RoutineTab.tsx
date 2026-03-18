"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, RotateCcw, ArrowUpDown } from "lucide-react";
import {
  getRoutineEvaluation,
  getScoreBarColor,
} from "@/constants/routineEvaluation";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import {
  useLocalRoutineStore,
  type LocalProduct,
  type SavedRoutine,
} from "@/stores/useLocalRoutineStore";
import {
  CATEGORY_COLORS,
  SKIN_TYPE_TAG_COLORS,
  SKIN_FUNCTION_COLORS,
} from "@/constants/categoryColors";
import { useToast } from "@/hooks";
import { Toast } from "@/components/common/Toast";

// ── 스타일 상수 ───────────────────────────────────────────────────────
const SCORE_RING_TRACK_COLOR = "var(--color-border-subtle)";
const SCORE_RING_SIZE = { width: 56, height: 56 };
const ROUTINE_HEADER_BTN_STYLE = {
  fontSize: "12px",
  padding: "5px 10px",
  borderRadius: "20px",
  backgroundColor: "transparent",
};
const CIRCUMFERENCE = 138;

// 드래그 상태 타입 — 스텝 간 이동 지원
interface DragState {
  fromStepCode: string;
  fromIndex: number;
  toStepCode: string;
  toIndex: number;
}

interface RoutineTabProps {
  routine: Record<string, LocalProduct[]>;
  onOpenModal: (code: string) => void;
  // productId 추가: 같은 스텝 내 특정 제품 제거
  onRemove: (code: string, productId: string) => void;
  // 마이페이지 레벨 토스트 — 저장 성공 등 알림
  showToast?: (msg: string) => void;
}


export default function RoutineTab({
  routine,
  onOpenModal,
  onRemove,
  showToast: showParentToast,
}: RoutineTabProps) {
  const {
    isMainRoutine,
    toggleMainRoutine,
    clearRoutine,
    setRoutine,
    reorderStepProducts,
    saveRoutine,
    loadSavedRoutine,
    deleteSavedRoutine,
    savedRoutines,
    currentRoutineName,
  } = useLocalRoutineStore();

  // 저장 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");

  // 드래그 상태 — 스텝 코드 + 이동 전/후 인덱스
  const [dragState, setDragState] = useState<DragState | null>(null);

  // 로컬 토스트 (저장 완료 등)
  const { toastMessage, showToast: showLocalToast } = useToast();
  const notify = (msg: string) => {
    if (showParentToast) showParentToast(msg);
    else showLocalToast(msg);
  };

  // 1개 이상 제품이 있는 스텝 수 — null 방어 (localStorage 구버전 호환)
  const filledCount = useMemo(
    () =>
      Object.values(routine).filter(
        (products) => Array.isArray(products) && products.length > 0,
      ).length,
    [routine],
  );

  // 루틴 전체 제품 flat 배열 (점수 계산용)
  const allProducts = useMemo(
    () => Object.values(routine).flatMap((products) => products ?? []),
    [routine],
  );

  const routineScores = useMemo(
    () =>
      allProducts
        .filter((product) => product.matchScore > 0)
        .map((product) => product.matchScore),
    [allProducts],
  );

  const averageScore =
    routineScores.length > 0
      ? Math.round(
          routineScores.reduce((acc, score) => acc + score, 0) /
            routineScores.length,
        )
      : 0;

  const evaluation = getRoutineEvaluation(averageScore, routineScores.length);
  const scoreColor = getScoreBarColor(averageScore);
  const strokeDash =
    routineScores.length > 0 ? (averageScore / 100) * CIRCUMFERENCE : 0;

  // ── 드래그 핸들러 (포인터 이벤트 — 데스크톱+모바일 통합) ──────────────
  // pointerDown — 드래그 핸들에서 포인터 캡처 시작, 드래그 상태 확정
  const handleDragHandlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    stepCode: string,
    index: number,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ fromStepCode: stepCode, fromIndex: index, toStepCode: stepCode, toIndex: index });
  };

  // pointerMove — 포인터 아래 대상 추적
  const handleDragHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const elementUnder = document.elementFromPoint(event.clientX, event.clientY);

    // 다른 아이템 위에 있는 경우 — 스텝 간 이동 허용
    const itemElement = elementUnder?.closest("[data-drag-item]") as HTMLElement | null;
    if (itemElement) {
      const toStepCode = itemElement.getAttribute("data-step-code");
      const indexStr = itemElement.getAttribute("data-item-index");
      if (!toStepCode || indexStr === null) return;
      const toIndex = parseInt(indexStr, 10);
      if (toStepCode !== dragState.toStepCode || toIndex !== dragState.toIndex) {
        setDragState((prev) => (prev ? { ...prev, toStepCode, toIndex } : null));
      }
      return;
    }

    // 빈 스텝 드롭존 위에 있는 경우
    const dropZone = elementUnder?.closest("[data-drop-zone]") as HTMLElement | null;
    if (dropZone) {
      const toStepCode = dropZone.getAttribute("data-step-code");
      const toIndex = parseInt(dropZone.getAttribute("data-drop-index") ?? "0", 10);
      if (toStepCode && (toStepCode !== dragState.toStepCode || toIndex !== dragState.toIndex)) {
        setDragState((prev) => (prev ? { ...prev, toStepCode, toIndex } : null));
      }
    }
  };

  // pointerUp / pointerCancel — 순서 변경 커밋
  const handleDragHandlePointerUp = () => {
    if (!dragState) return;

    const { fromStepCode, fromIndex, toStepCode, toIndex } = dragState;

    if (fromStepCode === toStepCode) {
      // 같은 스텝 내 순서 변경
      if (fromIndex !== toIndex) {
        const products = [...(routine[fromStepCode] ?? [])];
        const [removed] = products.splice(fromIndex, 1);
        products.splice(toIndex, 0, removed);
        reorderStepProducts(fromStepCode, products);
      }
    } else {
      // 다른 스텝으로 이동 — setRoutine으로 원자적 업데이트
      const newRoutine = { ...routine };
      const fromProducts = [...(newRoutine[fromStepCode] ?? [])];
      const [removed] = fromProducts.splice(fromIndex, 1);
      newRoutine[fromStepCode] = fromProducts;
      const toProducts = [...(newRoutine[toStepCode] ?? [])];
      toProducts.splice(toIndex, 0, removed);
      newRoutine[toStepCode] = toProducts;
      setRoutine(newRoutine);
    }

    setDragState(null);
  };

  // ── 저장 루틴 핸들러 ─────────────────────────────────────────────────
  const handleOpenSaveModal = () => {
    setSaveModalName(currentRoutineName === "내 루틴" ? "" : currentRoutineName);
    setShowSaveModal(true);
  };

  const handleSaveRoutine = () => {
    const trimmedName = saveModalName.trim();
    if (!trimmedName) return;
    saveRoutine(trimmedName);
    setShowSaveModal(false);
    setSaveModalName("");
    notify(`"${trimmedName}" 루틴이 저장되었습니다!`);
  };

  const handleLoadRoutine = (id: string) => {
    const found = savedRoutines.find((r) => r.id === id);
    if (!found) return;
    loadSavedRoutine(id);
    notify(`"${found.name}" 루틴을 불러왔습니다.`);
  };

  const handleDeleteRoutine = (id: string) => {
    const found = savedRoutines.find((r) => r.id === id);
    deleteSavedRoutine(id);
    if (found) notify(`"${found.name}" 루틴이 삭제되었습니다.`);
  };


  return (
    <div className="px-5 pt-4 flex flex-col gap-2 pb-10">

      {/* ── 저장된 루틴 슬라이더 — 3개씩 가로 스와이프 ── */}
      {savedRoutines.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-text-muted mb-2">저장된 루틴</p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
          >
            {savedRoutines.map((saved) => (
              <SavedRoutineCard
                key={saved.id}
                saved={saved}
                isActive={currentRoutineName === saved.name}
                onLoad={() => handleLoadRoutine(saved.id)}
                onDelete={() => handleDeleteRoutine(saved.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {/* 현재 루틴 이름 — 저장 후 갱신됨, 기본값 "내 루틴" */}
            <p className="text-base font-bold text-text-primary truncate max-w-[140px]">
              {currentRoutineName}
            </p>
            {/* ⚠️ API 연동 시 서버 루틴 메인 설정 API로 교체 */}
            <button
              onClick={toggleMainRoutine}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[12px] font-semibold cursor-pointer transition-all active:scale-95 shrink-0 ${
                isMainRoutine
                  ? "bg-amber-200 border-amber-200 text-[#8a827a]"
                  : "bg-transparent border-[#D9D5D0] text-[#B8A99A]"
              }`}
            >
              {isMainRoutine ? "★" : "☆"} 메인
            </button>
          </div>
          {/* 동적 단계 수 — ROUTINE_STEPS.length 기반 (6단계 고정 아님) */}
          <p className="text-xs text-text-muted mt-0.5">
            {filledCount}/{ROUTINE_STEPS.length}단계 완성 · 드래그로 순서 변경
          </p>
        </div>
        <div className="flex gap-1.5">
          {/* 초기화 — ⚠️ API 연동 시 루틴 초기화 API 호출로 교체 */}
          <button
            onClick={clearRoutine}
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            <RotateCcw size={12} /> 초기화
          </button>
          {/* OCR */}
          <button
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            ⇄ OCR
          </button>
          {/* 저장 — 클릭 시 루틴 이름 입력 모달 */}
          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            📋 저장
          </button>
        </div>
      </div>

      {/* ── 루틴 스텝별 섹션 ── */}
      {ROUTINE_STEPS.map((step) => {
        const products = routine[step.code] ?? [];
        return (
          <div key={step.code} className="mt-3">
            {/* 스텝 섹션 헤더 — 아이콘, 라벨, + 추가 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{step.icon}</span>
                <span className="text-sm font-semibold text-text-primary">
                  {step.label}
                </span>
              </div>
              <button
                onClick={() => onOpenModal(step.code)}
                className="flex items-center gap-1 text-xs font-medium text-brand cursor-pointer border-none bg-transparent"
              >
                <Plus size={13} /> 추가
              </button>
            </div>

            {products.length === 0 ? (
              // 빈 상태 플레이스홀더 — 클릭 시 추가 모달 오픈, 드래그 드롭존
              <button
                data-drop-zone
                data-step-code={step.code}
                data-drop-index="0"
                onClick={() => onOpenModal(step.code)}
                className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer border-none text-left transition-colors"
                style={{
                  backgroundColor: dragState?.toStepCode === step.code
                    ? "rgba(166,157,146,0.12)"
                    : "var(--color-warm-bg)",
                  border: dragState?.toStepCode === step.code
                    ? "2px dashed #A69D92"
                    : "1px solid var(--color-border-subtle)",
                  transition: "background-color 0.1s, border 0.1s",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-text-muted shrink-0"
                  style={{ backgroundColor: "var(--color-bg-muted-warm)" }}
                >
                  {step.code}
                </div>
                <p className="flex-1 text-sm font-medium text-text-muted">
                  아직 추가된 제품이 없어요
                </p>
                <Plus size={14} color="#A69D92" className="shrink-0" />
              </button>
            ) : (
              // 드래그 정렬 가능한 제품 목록
              <div className="flex flex-col gap-2">
                {products.map((product, index) => {
                  const isDraggingThis =
                    dragState?.fromStepCode === step.code &&
                    dragState.fromIndex === index;
                  const isDropTarget =
                    !!dragState &&
                    dragState.toStepCode === step.code &&
                    dragState.toIndex === index &&
                    !(dragState.fromStepCode === step.code && dragState.fromIndex === index);
                  const categoryColor = product.category
                    ? CATEGORY_COLORS[product.category]
                    : undefined;

                  return (
                    <div
                      key={product.id}
                      data-drag-item
                      data-step-code={step.code}
                      data-item-index={index}
                      className="flex items-stretch h-25 rounded-[10px] overflow-hidden"
                      style={{
                        opacity: isDraggingThis ? 0.4 : 1,
                        border: isDropTarget ? "2px solid #A69D92" : "1px solid #E2DDD8",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        backgroundColor: "#FFFFFF",
                        transition: "opacity 0.15s, border-color 0.1s",
                      }}
                    >
                      {/* 제품 이미지 — 이미지 영역 전체가 드래그 핸들 */}
                      <div
                        className="relative w-25 h-full shrink-0 bg-[#F5F2EC] cursor-grab active:cursor-grabbing select-none"
                        style={{ touchAction: "none" }}
                        onPointerDown={(event) =>
                          handleDragHandlePointerDown(event, step.code, index)
                        }
                        onPointerMove={handleDragHandlePointerMove}
                        onPointerUp={handleDragHandlePointerUp}
                        onPointerCancel={handleDragHandlePointerUp}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-[26px]">
                          {product.emoji || "🧴"}
                        </div>
                        {/* 드래그 힌트 — 좌상단 ArrowUpDown 아이콘 */}
                        <div className="absolute top-1 left-1">
                          <ArrowUpDown size={10} className="text-[#C4BEB7] opacity-70" />
                        </div>
                      </div>

                      {/* 제품 정보 — 브랜드, 카테고리 태그, 이름 */}
                      <Link
                        href={`/product/${product.id}`}
                        className="flex-1 min-w-0 px-3 py-2 no-underline flex flex-col justify-start"
                        onClick={(event) => {
                          // 드래그 중에는 링크 이동 차단
                          if (dragState) event.preventDefault();
                        }}
                      >
                        {/* 브랜드 + 카테고리 태그 한 줄 */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-[12px] font-medium text-[#BFB6AA] uppercase tracking-[0.08em]">
                            {product.brand}
                          </span>
                          {product.category && categoryColor && (
                            <span
                              className="text-[11px] px-1.5 py-[1px] rounded-[3px] font-semibold"
                              style={{
                                backgroundColor: categoryColor.chip,
                                color: categoryColor.accent,
                              }}
                            >
                              {product.category}
                            </span>
                          )}
                        </div>
                        <p className="m-0 text-[16px] font-medium text-[#2A2118] leading-[1.4] line-clamp-2">
                          {product.name}
                        </p>
                        {/* 피부타입 태그 */}
                        {(product.skinTypes ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(product.skinTypes ?? []).map((skinType) => {
                              const tc = SKIN_TYPE_TAG_COLORS[skinType];
                              return tc ? (
                                <span
                                  key={skinType}
                                  className="text-[11px] px-1.5 py-px rounded-[3px] font-semibold"
                                  style={{ backgroundColor: tc.bg, color: tc.text }}
                                >
                                  {skinType}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        {/* 기능 태그 */}
                        {(product.effects ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(product.effects ?? []).slice(0, 3).map((fn) => {
                              const fc = SKIN_FUNCTION_COLORS[fn];
                              return fc ? (
                                <span
                                  key={fn}
                                  className="text-[11px] px-1.5 py-px rounded-[3px] font-medium"
                                  style={{ backgroundColor: fc.chip, color: fc.accent }}
                                >
                                  {fn}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </Link>

                      {/* 제거 버튼 — 상단 배치 */}
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onRemove(step.code, product.id);
                        }}
                        className="shrink-0 flex items-start justify-center w-9 pt-2 border-none bg-transparent cursor-pointer"
                      >
                        <X size={14} color="#C4BEB7" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── 루틴 종합 점수 카드 ── */}
      <div
        className="mt-10 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--color-warm-bg)",
          border: `1px solid ${filledCount > 0 ? scoreColor + "40" : "var(--color-border-subtle)"}`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* 점수 링 */}
          <div
            className="relative shrink-0 flex items-center justify-center"
            style={SCORE_RING_SIZE}
          >
            <svg width="56" height="56" className="absolute">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={SCORE_RING_TRACK_COLOR}
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={filledCount > 0 ? scoreColor : SCORE_RING_TRACK_COLOR}
                strokeWidth="4"
                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <span
              className="relative z-[1] text-[13px] font-bold"
              style={{
                color: filledCount > 0 ? scoreColor : "var(--color-text-muted)",
              }}
            >
              {averageScore}
            </span>
          </div>
          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-bold text-text-primary">
                내 루틴 종합 점수
              </span>
            </div>
            <p className="text-xs text-text-muted leading-[1.6] break-keep">
              {evaluation.text}
            </p>
          </div>
        </div>
      </div>

      {/* 로컬 토스트 (부모 showToast 없을 때 fallback) */}
      {!showParentToast && <Toast msg={toastMessage} />}

      {/* ── 루틴 저장 이름 입력 모달 ── */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              className="text-base font-bold text-[#2A2118] mb-1"
              style={{ fontFamily: "var(--font-pretendard), sans-serif" }}
            >
              루틴 이름 저장
            </h3>
            <p className="text-xs text-[#A69D92] mb-4">
              저장하면 목록에서 불러올 수 있어요
            </p>
            <input
              type="text"
              value={saveModalName}
              onChange={(event) => setSaveModalName(event.target.value)}
              placeholder="예) 아침 루틴, 데일리 케어"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E2DDD8] outline-none mb-4"
              style={{
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSaveRoutine();
                if (event.key === "Escape") setShowSaveModal(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[#E2DDD8] text-[#8A8278] bg-transparent cursor-pointer"
                style={{ fontFamily: "var(--font-pretendard), sans-serif" }}
              >
                취소
              </button>
              <button
                onClick={handleSaveRoutine}
                disabled={!saveModalName.trim()}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: "#A69D92",
                  fontFamily: "var(--font-pretendard), sans-serif",
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 저장된 루틴 카드 — 3개씩 가로로 나열, 스와이프 ──────────────────────
function SavedRoutineCard({
  saved,
  isActive,
  onLoad,
  onDelete,
}: {
  saved: SavedRoutine;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="relative shrink-0 flex flex-col gap-1 p-2.5 rounded-xl"
      style={{
        // 3개 동시 표시 — 양쪽 gap(8px)을 고려한 너비
        minWidth: "calc(33.33% - 5.5px)",
        maxWidth: "calc(33.33% - 5.5px)",
        scrollSnapAlign: "start",
        border: isActive ? "1.5px solid #A69D92" : "1px solid #E2DDD8",
        backgroundColor: isActive ? "#F5F2EC" : "#FFFFFF",
      }}
    >
      {/* 삭제 버튼 — 우측 상단 */}
      <button
        onClick={onDelete}
        className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer"
        style={{ backgroundColor: "#E8E4DF" }}
      >
        <X size={9} color="#8A8278" />
      </button>

      {/* 루틴 이모지 */}
      <div className="text-base text-center mt-0.5">📋</div>

      {/* 루틴 이름 */}
      <p
        className="text-[11px] font-bold text-[#2A2118] truncate text-center leading-tight"
        style={{ fontFamily: "var(--font-pretendard), sans-serif" }}
      >
        {saved.name}
      </p>

      {/* 제품 수 */}
      <p
        className="text-[10px] text-[#A69D92] text-center"
        style={{ fontFamily: "var(--font-pretendard), sans-serif" }}
      >
        {saved.productCount}개 제품
      </p>

      {/* 불러오기 버튼 */}
      <button
        onClick={onLoad}
        className="w-full text-[11px] font-semibold py-1 rounded-lg cursor-pointer border-none mt-0.5"
        style={{
          backgroundColor: isActive ? "#D9D5D0" : "#F2EFE9",
          color: "#6B6258",
          fontFamily: "var(--font-pretendard), sans-serif",
        }}
      >
        {isActive ? "현재 루틴" : "불러오기"}
      </button>
    </div>
  );
}
