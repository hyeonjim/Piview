"use client";

import { toast } from "sonner";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, X, RotateCcw, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import OcrModal from "@/components/features/mypage/OcrModal";
import { getRoutineSteps } from "@/constants/routineSteps";
import { useUserStore, selectGender } from "@/stores";
import {
  CATEGORY_COLORS,
  SKIN_TYPE_TAG_COLORS,
  SKIN_FUNCTION_COLORS,
} from "@/constants/categoryColors";
import {
  useDraftQuery,
  useRoutineListQuery,
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useSetMainRoutineMutation,
  useClearDraftMutation,
  useRemoveProductFromDraftMutation,
  useSyncDraftMutation,
} from "@/hooks";
import type { DraftItemDto, RoutineListResponse, DraftItem } from "@/types/routine";
import type { ProductSummaryResponse } from "@/types/product/product";

// SVG 점수 링 둘레 상수
const CIRCUMFERENCE = 138;

// 드래그 상태 타입 — 스텝 간 이동 지원
interface DragState {
  fromStepCode: string;
  fromIndex: number;
  toStepCode: string;
  toIndex: number;
}

interface RoutineTabProps {
  /** + 추가 버튼 클릭 시 호출 — stepCode와 columnId를 page.tsx에 전달해 모달 오픈 */
  onOpenModal: (stepCode: string, columnId: number) => void;
}

/**
 * DraftItemDto[] → 스텝별 제품 맵 변환
 * columnId 기준으로 그룹화, stepOrder 오름차순 정렬
 */
function groupDraftByStep(
  draftItems: DraftItemDto[],
  steps: ReturnType<typeof getRoutineSteps>,
): Record<string, ProductSummaryResponse[]> {
  const result: Record<string, ProductSummaryResponse[]> = {};
  for (const step of steps) {
    result[step.code] = draftItems
      .filter((item) => item.columnId === step.columnId && item.product)
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((item) => item.product);
  }
  return result;
}

/**
 * 스텝별 제품 맵 → DraftItem[] 변환 (PUT /api/v1/routines/draft 요청 body)
 * 스텝 순서 기준으로 stepOrder를 1부터 채번
 */
function buildDraftItems(
  draftByStep: Record<string, ProductSummaryResponse[]>,
  steps: ReturnType<typeof getRoutineSteps>,
): DraftItem[] {
  const items: DraftItem[] = [];
  let stepOrder = 1;
  for (const step of steps) {
    for (const product of draftByStep[step.code] ?? []) {
      items.push({
        columnId: step.columnId,
        productId: product.productId,
        stepOrder: stepOrder++,
      });
    }
  }
  return items;
}

export default function RoutineTab({ onOpenModal }: RoutineTabProps) {
  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
  const user = useUserStore((state) => state.user);
  const routineSteps = getRoutineSteps(currentGender);

  // ── 서버 데이터 ────────────────────────────────────────────────────
  const { data: draftItems = [], isLoading: isDraftLoading } = useDraftQuery();
  const { data: routineList = [] } = useRoutineListQuery();
  const { mutate: createRoutine, isPending: isCreating } = useCreateRoutineMutation();
  const { mutate: deleteRoutine } = useDeleteRoutineMutation();
  const { mutate: setMainRoutine } = useSetMainRoutineMutation();
  const { mutate: clearDraft } = useClearDraftMutation();
  const { mutate: removeProduct } = useRemoveProductFromDraftMutation();
  const { mutate: syncDraft } = useSyncDraftMutation();

  // ── 로컬 드래그용 상태 (서버 데이터 기반으로 초기화) ──────────────────
  // 드래그 중 UI 반영을 위해 서버 상태를 로컬 React 상태로 미러링
  const [localDraftByStep, setLocalDraftByStep] = useState<
    Record<string, ProductSummaryResponse[]>
  >({});

  // 서버 draft 데이터가 바뀌면 로컬 상태 동기화
  useEffect(() => {
    setLocalDraftByStep(groupDraftByStep(draftItems, routineSteps));
  // routineSteps는 gender에 의존하므로 currentGender를 deps에 포함
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftItems, currentGender]);

  // ── UI 상태 ────────────────────────────────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showMainRoutineModal, setShowMainRoutineModal] = useState(false);

  // 메인 루틴 찾기
  const mainRoutine = useMemo(
    () => routineList.find((routine) => routine.isMain),
    [routineList],
  );

  // 저장된 루틴 슬라이더 스크롤 상태 — 도트 인디케이터 연동
  const savedRoutineScrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // 슬라이더 마우스 드래그 전용 ref
  const sliderDragStartXRef = useRef<number>(0);
  const sliderDragStartScrollLeftRef = useRef<number>(0);
  const isSliderDraggingRef = useRef<boolean>(false);
  const sliderDragMovedRef = useRef<boolean>(false);

  // 스크롤 위치 기준으로 활성 카드 인덱스 갱신
  const handleSavedRoutineScroll = () => {
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    const firstCard = container.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth + 8;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, routineList.length - 1));
  };

  // ── 슬라이더 마우스 드래그 핸들러 ─────────────────────────────────────
  const handleSliderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    isSliderDraggingRef.current = true;
    sliderDragMovedRef.current = false;
    sliderDragStartXRef.current = event.clientX;
    sliderDragStartScrollLeftRef.current = container.scrollLeft;
  };

  const handleSliderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSliderDraggingRef.current || event.pointerType === "touch") return;
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    const deltaX = event.clientX - sliderDragStartXRef.current;
    if (Math.abs(deltaX) > 5) {
      sliderDragMovedRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      container.style.cursor = "grabbing";
    }
    container.scrollLeft = sliderDragStartScrollLeftRef.current - deltaX;
  };

  const handleSliderPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    isSliderDraggingRef.current = false;
    container.style.cursor = "grab";
  };

  const handleSliderClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (sliderDragMovedRef.current) {
      event.stopPropagation();
      sliderDragMovedRef.current = false;
    }
  };

  // 드래그 상태 — 스텝 코드 + 이동 전/후 인덱스
  const [dragState, setDragState] = useState<DragState | null>(null);

  const notify = (msg: string) => toast(msg);

  // 1개 이상 제품이 있는 스텝 수
  const filledCount = useMemo(
    () =>
      Object.values(localDraftByStep).filter(
        (products) => Array.isArray(products) && products.length > 0,
      ).length,
    [localDraftByStep],
  );

  // ── 드래그 핸들러 ────────────────────────────────────────────────────
  const handleDragHandlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    stepCode: string,
    index: number,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      fromStepCode: stepCode,
      fromIndex: index,
      toStepCode: stepCode,
      toIndex: index,
    });
  };

  const handleDragHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const elementUnder = document.elementFromPoint(event.clientX, event.clientY);

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

    const dropZone = elementUnder?.closest("[data-drop-zone]") as HTMLElement | null;
    if (dropZone) {
      const toStepCode = dropZone.getAttribute("data-step-code");
      const toIndex = parseInt(dropZone.getAttribute("data-drop-index") ?? "0", 10);
      if (
        toStepCode &&
        (toStepCode !== dragState.toStepCode || toIndex !== dragState.toIndex)
      ) {
        setDragState((prev) => (prev ? { ...prev, toStepCode, toIndex } : null));
      }
    }
  };

  /**
   * 드래그 종료 — 순서 변경 후 PUT /api/v1/routines/draft 호출
   * 로컬 상태를 즉시 반영하고, 서버에 전체 배열을 동기화
   */
  const handleDragHandlePointerUp = () => {
    if (!dragState) return;

    const { fromStepCode, fromIndex, toStepCode, toIndex } = dragState;
    let newDraftByStep = { ...localDraftByStep };

    if (fromStepCode === toStepCode) {
      if (fromIndex !== toIndex) {
        const products = [...(newDraftByStep[fromStepCode] ?? [])];
        const [removed] = products.splice(fromIndex, 1);
        products.splice(toIndex, 0, removed);
        newDraftByStep = { ...newDraftByStep, [fromStepCode]: products };
      }
    } else {
      const fromProducts = [...(newDraftByStep[fromStepCode] ?? [])];
      const [removed] = fromProducts.splice(fromIndex, 1);
      newDraftByStep[fromStepCode] = fromProducts;
      const toProducts = [...(newDraftByStep[toStepCode] ?? [])];
      toProducts.splice(toIndex, 0, removed);
      newDraftByStep[toStepCode] = toProducts;
    }

    setLocalDraftByStep(newDraftByStep);
    setDragState(null);

    // 서버에 전체 순서 동기화 — PUT /api/v1/routines/draft
    const items = buildDraftItems(newDraftByStep, routineSteps);
    syncDraft(items, {
      onError: () => notify("순서 변경 저장에 실패했습니다."),
    });
  };

  // ── 루틴 저장 핸들러 ──────────────────────────────────────────────────
  const handleOpenSaveModal = () => {
    setSaveModalName("");
    setShowSaveModal(true);
  };

  /**
   * 루틴 저장 — POST /api/v1/routines
   * Redis draft를 읽어 새 루틴 생성
   */
  const handleSaveRoutine = () => {
    const trimmedName = saveModalName.trim();
    if (!trimmedName) return;

    console.log("🔍 루틴 저장 디버깅:", { user, userId: user?.userId });
    console.log("🔍 user 전체 객체 (JSON):", JSON.stringify(user, null, 2));
    console.log("🔍 user의 모든 키:", user ? Object.keys(user) : "user is null");

    if (!user?.userId) {
      console.error("❌ user.userId가 없습니다:", user);
      notify("사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const payload = { userId: user.userId, title: trimmedName };
    console.log("📤 루틴 생성 payload:", payload);

    createRoutine(payload, {
      onSuccess: () => {
        setShowSaveModal(false);
        setSaveModalName("");
        notify(`"${trimmedName}" 루틴이 저장되었습니다!`);
      },
      onError: (error) => {
        console.error("❌ 루틴 저장 실패:", error);
        notify("루틴 저장에 실패했습니다. 다시 시도해주세요.");
      },
    });
  };

  /**
   * 루틴 삭제 — DELETE /api/v1/routines/{routineId}
   */
  const handleDeleteRoutine = (routineId: number, title: string) => {
    deleteRoutine(routineId, {
      onSuccess: () => notify(`"${title}" 루틴이 삭제되었습니다.`),
      onError: () => notify("루틴 삭제에 실패했습니다."),
    });
  };

  /**
   * 메인 루틴 선택 — PATCH /api/v1/routines/{routineId}/main
   */
  const handleSetMainRoutine = (routineId: number) => {
    setMainRoutine(routineId, {
      onSuccess: () => notify("메인 루틴이 변경되었습니다."),
      onError: () => notify("메인 루틴 변경에 실패했습니다."),
    });
  };

  /**
   * 루틴 초기화 — DELETE /api/v1/routines/draft (Redis 초기화)
   */
  const handleClearRoutine = () => {
    clearDraft({
      onSuccess: () => notify("루틴이 초기화되었습니다."),
      onError: () => notify("초기화에 실패했습니다."),
    });
  };

  /**
   * 제품 삭제 — DELETE /api/v1/routines/draft/{productId}
   */
  const handleRemoveProduct = (productId: number) => {
    removeProduct(productId, {
      onError: () => notify("제품 삭제에 실패했습니다."),
    });
  };

  // 드래프트 로딩 중 스켈레톤
  if (isDraftLoading) {
    return (
      <div className="px-5 pt-4 flex flex-col gap-4">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-24 rounded-2xl bg-[#EFECE8] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 flex flex-col gap-2 pb-10">
      {/* OCR 모달 */}
      {showOcrModal && <OcrModal onClose={() => setShowOcrModal(false)} />}

      {/* ── 저장된 루틴 슬라이더 ── */}
      {routineList.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-bold text-text-muted mb-2">저장된 루틴</p>
          <div
            ref={savedRoutineScrollRef}
            className="flex gap-2 overflow-x-auto pb-1"
            onScroll={handleSavedRoutineScroll}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={handleSliderPointerUp}
            onClickCapture={handleSliderClickCapture}
            style={{
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory",
              overscrollBehaviorX: "contain",
              cursor: "grab",
              userSelect: "none",
            }}
          >
            {routineList.map((saved) => (
              <SavedRoutineCard
                key={saved.routineId}
                saved={saved}
                onDelete={() => handleDeleteRoutine(saved.routineId, saved.title)}
                onSetMain={() => handleSetMainRoutine(saved.routineId)}
              />
            ))}
          </div>

          {/* 스크롤 도트 인디케이터 */}
          {routineList.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {routineList.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all duration-200 ${
                    index === activeCardIndex
                      ? "w-3 h-1.5 bg-[#A69D92]"
                      : "w-1.5 h-1.5 bg-[#D9D5D0]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 헤더 ── */}
      <div className="flex flex-col gap-2 mb-1">
        {/* 루틴 이름 & 메인 루틴 설정 버튼 */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-text-primary">
            {mainRoutine?.title || "메인루틴"}
          </h2>
          <button
            onClick={() => setShowMainRoutineModal(true)}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent"
          >
            변경
          </button>
        </div>

        {/* 진행 상황 & 액션 버튼 */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-text-muted mt-0.5">
              {filledCount}/{routineSteps.length}단계 완성 · 드래그로 순서 변경
            </p>
          </div>
          <div className="flex gap-1.5 text-[14px]">
            <button
              onClick={handleClearRoutine}
              className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={() => setShowOcrModal(true)}
              className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent"
            >
              OCR
            </button>
            <button
              onClick={handleOpenSaveModal}
              disabled={isCreating || filledCount === 0}
              className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent disabled:opacity-50"
            >
              {isCreating ? "저장 중..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 루틴 스텝별 섹션 ── */}
      {routineSteps.map((step) => {
        const products = localDraftByStep[step.code] ?? [];
        const isDropTarget = dragState?.toStepCode === step.code;

        return (
          <div key={step.code} className="mt-3">
            {/* 스텝 섹션 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{step.icon}</span>
                <span className="text-[16px] font-semibold text-text-primary">
                  {step.label}
                </span>
              </div>
              <button
                onClick={() => onOpenModal(step.code, step.columnId)}
                className="flex items-center gap-1 text-xs font-bold text-brand cursor-pointer border-none bg-transparent"
              >
                <Plus size={13} /> 추가
              </button>
            </div>

            {products.length === 0 ? (
              <button
                data-drop-zone
                data-step-code={step.code}
                data-drop-index="0"
                onClick={() => onOpenModal(step.code, step.columnId)}
                className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer border-none text-left"
                style={{
                  backgroundColor: isDropTarget
                    ? "rgba(166,157,146,0.12)"
                    : "var(--color-warm-bg)",
                  border: isDropTarget
                    ? "2px dashed #A69D92"
                    : "1px solid var(--color-border-subtle)",
                  transition: "background-color 0.1s, border 0.1s",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-text-muted shrink-0 bg-[#fbfaf8]">
                  {step.code}
                </div>
                <p className="flex-1 text-sm font-semibold text-text-muted">
                  제품을 추가해 주세요
                </p>
                <Plus size={14} className="shrink-0 text-[#A69D92]" />
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map((product, index) => {
                  const isDraggingThis =
                    dragState?.fromStepCode === step.code &&
                    dragState.fromIndex === index;
                  const isProductDropTarget =
                    !!dragState &&
                    dragState.toStepCode === step.code &&
                    dragState.toIndex === index &&
                    !(
                      dragState.fromStepCode === step.code &&
                      dragState.fromIndex === index
                    );

                  return (
                    <RoutineProductCard
                      key={`${product.productId}-${index}`}
                      product={product}
                      stepCode={step.code}
                      index={index}
                      isDragging={isDraggingThis}
                      isDropTarget={isProductDropTarget}
                      onDragHandlePointerDown={handleDragHandlePointerDown}
                      onDragHandlePointerMove={handleDragHandlePointerMove}
                      onDragHandlePointerUp={handleDragHandlePointerUp}
                      onRemove={handleRemoveProduct}
                      stepIcon={step.icon}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── 루틴 종합 점수 ── */}
      <div className="mt-10 p-4 rounded-2xl bg-(--color-warm-bg) border border-[#E2DDD8]">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg width="56" height="56" className="absolute">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={filledCount > 0 ? "#A69D92" : "var(--color-border-subtle)"}
                strokeWidth="4"
                strokeDasharray={`${(filledCount / routineSteps.length) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <span className="relative z-10 text-[13px] font-semibold text-text-muted">
              85점
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-1">
              루틴 종합 점수
            </p>
            <p className="text-xs font-bold text-text-muted leading-relaxed break-keep">
              {filledCount === 0
                ? "아직 루틴에 제품이 없어요. 추가 버튼으로 시작해보세요!"
                : filledCount < routineSteps.length
                  ? `${routineSteps.length - filledCount}단계를 더 채우면 루틴이 완성돼요.`
                  : "모든 단계가 완성된 루틴이에요! 저장 버튼으로 보관하세요."}
            </p>
          </div>
        </div>
      </div>

      {/* ── 루틴 저장 이름 입력 모달 ── */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#2A2118] mb-1">
              루틴 저장
            </h3>
            <input
              type="text"
              value={saveModalName}
              onChange={(event) => setSaveModalName(event.target.value)}
              placeholder="예) 루틴1, 루틴2"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E2DDD8] outline-none my-4"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSaveRoutine();
                if (event.key === "Escape") setShowSaveModal(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-[#E2DDD8] text-[#8A8278] bg-transparent cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveRoutine}
                disabled={!saveModalName.trim() || isCreating}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#A69D92] cursor-pointer disabled:opacity-40"
              >
                {isCreating ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메인 루틴 설정 모달 ── */}
      {showMainRoutineModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
          onClick={() => setShowMainRoutineModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#2A2118] mb-4">
              메인 루틴 선택
            </h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {routineList.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  저장된 루틴이 없습니다.
                </p>
              ) : (
                routineList.map((routine) => (
                  <button
                    key={routine.routineId}
                    onClick={() => {
                      handleSetMainRoutine(routine.routineId);
                      setShowMainRoutineModal(false);
                    }}
                    className={`w-full px-4 py-3 text-left rounded-xl border cursor-pointer transition-colors ${
                      routine.isMain
                        ? "border-[#C8A96E] bg-[#FBF7EF] text-[#2A2118]"
                        : "border-[#E2DDD8] bg-white hover:bg-[#F8F6F2] text-text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{routine.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {routine.productCount}개 제품
                        </p>
                      </div>
                      {routine.isMain && (
                        <span className="text-xs font-bold text-[#C8A96E]">★ 메인</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowMainRoutineModal(false)}
              className="w-full mt-4 py-2.5 text-sm font-semibold rounded-xl border border-[#E2DDD8] text-[#8A8278] bg-transparent cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 루틴 제품 카드 ────────────────────────────────────────────────────────
interface RoutineProductCardProps {
  product: ProductSummaryResponse;
  stepCode: string;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragHandlePointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    stepCode: string,
    index: number,
  ) => void;
  onDragHandlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDragHandlePointerUp: () => void;
  onRemove: (productId: number) => void;
  stepIcon: string;
}

function RoutineProductCard({
  product,
  stepCode,
  index,
  isDragging,
  isDropTarget,
  onDragHandlePointerDown,
  onDragHandlePointerMove,
  onDragHandlePointerUp,
  onRemove,
  stepIcon,
}: RoutineProductCardProps) {
  const categoryColor = product.categoryName
    ? CATEGORY_COLORS[product.categoryName]
    : undefined;

  return (
    <div
      data-drag-item
      data-step-code={stepCode}
      data-item-index={index}
      className="relative h-22 rounded-[10px] overflow-hidden bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
      style={{
        opacity: isDragging ? 0.4 : 1,
        border: isDropTarget ? "2px solid #A69D92" : "1px solid #E2DDD8",
        transition: "opacity 0.15s, border-color 0.1s",
      }}
    >
      {/* 삭제 버튼 */}
      <button
        onClick={() => onRemove(product.productId)}
        className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center cursor-pointer bg-transparent border-none"
        aria-label="제품 삭제"
      >
        <X size={12} className="text-[#C4BEB7]" />
      </button>

      <div className="flex items-center h-full">
        {/* 드래그 가능한 이미지 영역 */}
        <div
          className="relative shrink-0 w-22 h-full cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "none" }}
          onPointerDown={(event) => onDragHandlePointerDown(event, stepCode, index)}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={onDragHandlePointerUp}
          onPointerCancel={onDragHandlePointerUp}
        >
          {/* 드래그 아이콘 */}
          <div className="absolute top-1 left-1 z-10">
            <ArrowUpDown size={10} className="text-[#C4BEB7] opacity-70" />
          </div>

          {/* 이미지 */}
          <div className="absolute inset-0 bg-[#F5F2EC]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name ?? ""}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[26px]">
                {stepIcon}
              </div>
            )}
          </div>
        </div>

        {/* 텍스트 영역 */}
        <Link
          href={`/product/${product.productId}`}
          className="flex-1 px-3 py-2 min-w-0 no-underline"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-bold text-[#BFB6AA] uppercase tracking-[0.08em]">
              {product.brandName}
            </span>
            {categoryColor && (
              <span
                className="text-[12px] px-1.5 py-[1px] rounded-[3px] font-semibold"
                style={{
                  backgroundColor: categoryColor.chip,
                  color: categoryColor.accent,
                }}
              >
                {product.categoryName}
              </span>
            )}
          </div>
          <p className="mt-0.75 m-0 text-[16px] font-bold text-[#2A2118] leading-[1.4] line-clamp-1">
            {product.name}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.skinTypes?.slice(0, 1).map((skinType) => (
              <span
                key={skinType}
                className="inline-block text-[12px] font-semibold px-1.5 py-0.5 rounded-[3px]"
                style={{
                  backgroundColor:
                    SKIN_TYPE_TAG_COLORS[skinType]?.bg ?? "#F0EDE8",
                  color: SKIN_TYPE_TAG_COLORS[skinType]?.text ?? "#7A7060",
                }}
              >
                {skinType}
              </span>
            ))}
            {product.tags?.slice(0, 2).map((effect) => {
              const color = SKIN_FUNCTION_COLORS[effect] ?? {
                chip: "#F0EDE8",
                accent: "#7A7060",
              };
              return (
                <span
                  key={effect}
                  className="inline-block text-[12px] font-semibold px-1.5 py-0.5 rounded-[3px]"
                  style={{
                    backgroundColor: color.chip,
                    color: color.accent,
                  }}
                >
                  {effect}
                </span>
              );
            })}
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── 저장된 루틴 카드 ────────────────────────────────────────────────────────
interface SavedRoutineCardProps {
  saved: RoutineListResponse;
  onDelete: () => void;
  onSetMain?: () => void;
}

function SavedRoutineCard({ saved, onDelete, onSetMain }: SavedRoutineCardProps) {
  return (
    <div
      className="relative shrink-0 flex flex-col gap-1 pt-7 pb-3 rounded-xl transition-all"
      style={{
        minWidth: "calc(38% - 4px)",
        maxWidth: "calc(38% - 4px)",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        border: saved.isMain ? "1.5px solid #C8A96E" : "1px solid #E2DDD8",
        backgroundColor: saved.isMain ? "#FBF7EF" : "#F8F6F2",
      }}
    >
      {/* 메인 배지 */}
      {saved.isMain && (
        <span
          className="absolute top-1.5 left-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] leading-none"
          style={{ backgroundColor: "#C8A96E", color: "#FFFFFF" }}
        >
          ★
        </span>
      )}

      {/* 삭제 버튼 */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer bg-[#E8E4DF]"
      >
        <X size={11} className="text-[#8A8278]" />
      </button>

      {/* 루틴 이름 */}
      <p className="text-sm font-semibold text-[#2A2118] truncate leading-tight px-2 text-center">
        {saved.title}
      </p>

      {/* 제품 수 */}
      <p className="text-[10px] font-bold text-[#A69D92] text-center">
        {saved.productCount}개 제품
      </p>

      {/* 메인으로 설정 버튼 */}
      {!saved.isMain && onSetMain && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onSetMain();
          }}
          className="mx-2 mt-1 py-1 text-[10px] font-bold rounded-full border border-[#D9D5D0] text-[#B8A99A] bg-transparent cursor-pointer"
        >
          메인 설정
        </button>
      )}
    </div>
  );
}
