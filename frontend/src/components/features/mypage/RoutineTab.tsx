"use client";

import { toast } from "sonner";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, X, ArrowUpDown, ScanText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import OcrModal from "@/components/features/mypage/OcrModal";
import { getRoutineSteps } from "@/constants/routineSteps";
import { useUserStore, selectGender, useRoutineStore } from "@/stores";
import {
  useDraftQuery,
  useRoutineListQuery,
  useRoutineDetailQuery,
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useSetMainRoutineMutation,
  useClearDraftMutation,
  useRemoveProductFromDraftMutation,
  useSyncDraftMutation,
  useLoadRoutineToDraftMutation,
  useUpdateRoutineMutation,
} from "@/hooks";
import type {
  DraftItemDto,
  RoutineListResponse,
} from "@/types/routine";
import type { ProductSummaryResponse } from "@/types/product/product";
import { fromSkinTypeEnum } from "@/utils/enumConvert";

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
 * RoutineResponse.steps → 스텝별 제품 맵 변환 (저장된 루틴 읽기 전용 표시용)
 * columnId 기준으로 routineSteps와 매핑
 */
function groupRoutineDetailByStep(
  steps: { columnId: number; products: { stepOrder: number; product: ProductSummaryResponse }[] }[],
  routineSteps: ReturnType<typeof getRoutineSteps>,
): Record<string, ProductSummaryResponse[]> {
  const result: Record<string, ProductSummaryResponse[]> = {};
  for (const step of routineSteps) {
    const matchingStep = steps.find((s) => s.columnId === step.columnId);
    result[step.code] = matchingStep
      ? matchingStep.products
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((p) => p.product)
      : [];
  }
  return result;
}

/**
 * 스텝별 제품 맵 → DraftItemDto[] 변환 (PUT /api/v1/routines/draft 요청 body)
 * 스웨거 기준 요청 body는 DraftItemDto[] (product 전체 객체 포함)
 * 스텝 순서 기준으로 stepOrder를 1부터 채번
 */
function buildDraftItems(
  draftByStep: Record<string, ProductSummaryResponse[]>,
  steps: ReturnType<typeof getRoutineSteps>,
): DraftItemDto[] {
  const items: DraftItemDto[] = [];
  let stepOrder = 1;
  for (const step of steps) {
    for (const product of draftByStep[step.code] ?? []) {
      items.push({
        columnId: step.columnId,
        stepOrder: stepOrder++,
        product,
      });
    }
  }
  return items;
}

export default function RoutineTab({ onOpenModal }: RoutineTabProps) {
  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
  const user = useUserStore((state) => state.user);
  const routineSteps = useMemo(
    () => getRoutineSteps(currentGender),
    [currentGender],
  );

  // ── 서버 데이터 ────────────────────────────────────────────────────
  const { data: draftItems = [], isLoading: isDraftLoading } = useDraftQuery();
  const { data: routineList = [] } = useRoutineListQuery();
  const { mutate: createRoutine, isPending: isCreating } =
    useCreateRoutineMutation();
  const { mutate: deleteRoutine } = useDeleteRoutineMutation();
  const { mutate: setMainRoutine } = useSetMainRoutineMutation();
  const { mutate: clearDraft } = useClearDraftMutation();
  const { mutate: removeProduct } = useRemoveProductFromDraftMutation();
  const { mutate: syncDraft } = useSyncDraftMutation();
  const { mutate: loadRoutineToDraft, isPending: isLoadingToEdit } =
    useLoadRoutineToDraftMutation();
  const { mutate: updateRoutine, isPending: isUpdating } =
    useUpdateRoutineMutation();

  // ── 로컬 드래그용 상태 (서버 데이터 기반으로 초기화) ──────────────────
  // 드래그 중 UI 반영을 위해 서버 상태를 로컬 React 상태로 미러링
  const [localDraftByStep, setLocalDraftByStep] = useState<
    Record<string, ProductSummaryResponse[]>
  >({});

  // 서버 draft 데이터가 바뀌면 로컬 상태 동기화
  useEffect(() => {
    setLocalDraftByStep(groupDraftByStep(draftItems, routineSteps));
  }, [draftItems, routineSteps]);

  // ── UI 상태 ────────────────────────────────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");
  const [showOcrModal, setShowOcrModal] = useState(false);
  // 편집 중인 루틴 ID — null이면 새 루틴 생성 모드, 값이 있으면 기존 루틴 수정 모드
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);
  // 편집 시작 시점의 루틴 이름 — 수정 저장 모달에 미리 채워줄 기본값
  const [editingRoutineTitle, setEditingRoutineTitle] = useState<string>("");

  // 카드 클릭 시 상세 보기 대상 루틴 ID — store에서 관리해 재방문 시 복원
  const selectedRoutineId = useRoutineStore((state) => state.selectedRoutineId);
  const setSelectedRoutineId = useRoutineStore(
    (state) => state.setSelectedRoutineId,
  );

  // 루틴 상세 조회 — selectedRoutineId가 있을 때만 활성화
  const { data: selectedRoutineDetail } = useRoutineDetailQuery(
    selectedRoutineId ?? undefined,
  );

  // 저장된 루틴 보기 모드 여부
  const isViewingSavedRoutine =
    selectedRoutineId !== null && selectedRoutineDetail !== undefined;

  // 스텝 섹션에 표시할 제품 맵 — 보기 모드이면 저장된 루틴, 아니면 드래프트
  const viewByStep = useMemo<Record<string, ProductSummaryResponse[]>>(() => {
    if (isViewingSavedRoutine) {
      return groupRoutineDetailByStep(
        selectedRoutineDetail.steps,
        routineSteps,
      );
    }
    return localDraftByStep;
  }, [isViewingSavedRoutine, selectedRoutineDetail, routineSteps, localDraftByStep]);

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
  const handleSliderPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "touch") return;
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    isSliderDraggingRef.current = true;
    sliderDragMovedRef.current = false;
    sliderDragStartXRef.current = event.clientX;
    sliderDragStartScrollLeftRef.current = container.scrollLeft;
  };

  const handleSliderPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
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

  const handleSliderClickCapture = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (sliderDragMovedRef.current) {
      event.stopPropagation();
      sliderDragMovedRef.current = false;
    }
  };

  // 드래그 상태 — 스텝 코드 + 이동 전/후 인덱스
  const [dragState, setDragState] = useState<DragState | null>(null);

  const notify = (msg: string) => toast(msg);

  // 1개 이상 제품이 있는 스텝 수 — 보기 모드면 해당 루틴 기준, 아니면 드래프트 기준
  const filledCount = useMemo(
    () =>
      Object.values(viewByStep).filter(
        (products) => Array.isArray(products) && products.length > 0,
      ).length,
    [viewByStep],
  );

  // ── 드래그 핸들러 ────────────────────────────────────────────────────
  // dragStateRef: window 이벤트 핸들러에서 최신 dragState를 클로저 없이 참조하기 위한 ref
  const dragStateRef = useRef<DragState | null>(null);

  const handleDragHandlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    stepCode: string,
    index: number,
  ) => {
    event.preventDefault();
    const initialState: DragState = {
      fromStepCode: stepCode,
      fromIndex: index,
      toStepCode: stepCode,
      toIndex: index,
    };
    dragStateRef.current = initialState;
    setDragState(initialState);
  };

  // window 레벨 pointermove — 드래그 중 어느 요소 위에 있든 감지 가능
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const current = dragStateRef.current;
      if (!current) return;

      const elementUnder = document.elementFromPoint(event.clientX, event.clientY);

      const itemElement = elementUnder?.closest("[data-drag-item]") as HTMLElement | null;
      if (itemElement) {
        const toStepCode = itemElement.getAttribute("data-step-code");
        const indexStr = itemElement.getAttribute("data-item-index");
        if (!toStepCode || indexStr === null) return;
        const toIndex = parseInt(indexStr, 10);
        if (toStepCode !== current.toStepCode || toIndex !== current.toIndex) {
          const next = { ...current, toStepCode, toIndex };
          dragStateRef.current = next;
          setDragState(next);
        }
        return;
      }

      const dropZone = elementUnder?.closest("[data-drop-zone]") as HTMLElement | null;
      if (dropZone) {
        const toStepCode = dropZone.getAttribute("data-step-code");
        const toIndex = parseInt(dropZone.getAttribute("data-drop-index") ?? "0", 10);
        if (toStepCode && (toStepCode !== current.toStepCode || toIndex !== current.toIndex)) {
          const next = { ...current, toStepCode, toIndex };
          dragStateRef.current = next;
          setDragState(next);
        }
      }
    };

    const onPointerUp = () => {
      if (!dragStateRef.current) return;
      // React state 기준으로 처리하기 위해 setDragState 플러시 후 처리
      // — dragStateRef로 최신값 직접 읽어서 처리
      const state = dragStateRef.current;
      dragStateRef.current = null;

      const { fromStepCode, fromIndex, toStepCode, toIndex } = state;
      setDragState(null);

      // 위치 변화 없으면 무시
      if (fromStepCode === toStepCode && fromIndex === toIndex) return;

      setLocalDraftByStep((prev) => {
        let next = { ...prev };
        if (fromStepCode === toStepCode) {
          const products = [...(next[fromStepCode] ?? [])];
          const [removed] = products.splice(fromIndex, 1);
          products.splice(toIndex, 0, removed);
          next = { ...next, [fromStepCode]: products };
        } else {
          const fromProducts = [...(next[fromStepCode] ?? [])];
          const [removed] = fromProducts.splice(fromIndex, 1);
          next[fromStepCode] = fromProducts;
          const toProducts = [...(next[toStepCode] ?? [])];
          toProducts.splice(toIndex, 0, removed);
          next[toStepCode] = toProducts;
        }

        // draft 동기화 — 로컬 상태 업데이트 직후 최신값으로 호출
        const items = buildDraftItems(next, routineSteps);
        syncDraft(items, {
          onError: () => notify("순서 변경 저장에 실패했습니다."),
        });

        return next;
      });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [routineSteps, syncDraft]);


  // ── 루틴 저장 핸들러 ──────────────────────────────────────────────────
  const handleOpenSaveModal = () => {
    setSaveModalName("");
    setShowSaveModal(true);
  };

  /**
   * 편집 저장 모달 열기 — 현재 루틴 이름을 미리 채워서 열림
   */
  const handleOpenEditSaveModal = () => {
    setSaveModalName(editingRoutineTitle);
    setShowSaveModal(true);
  };

  /**
   * 루틴 저장 분기 핸들러
   * - editingRoutineId가 있으면 PUT /api/v1/routines/{routineId} (기존 루틴 덮어쓰기)
   * - 없으면 POST /api/v1/routines (새 루틴 생성)
   */
  const handleSaveRoutine = () => {
    const trimmedName = saveModalName.trim();
    if (!trimmedName) return;

    // 편집 모드: 기존 루틴 덮어쓰기
    if (editingRoutineId !== null) {
      updateRoutine(
        { routineId: editingRoutineId, request: { title: trimmedName } },
        {
          onSuccess: () => {
            setShowSaveModal(false);
            setSaveModalName("");
            setEditingRoutineId(null);
            setEditingRoutineTitle("");
            notify(`"${trimmedName}" 루틴이 수정되었습니다!`);
          },
          onError: () => notify("루틴 수정에 실패했습니다. 다시 시도해주세요."),
        },
      );
      return;
    }

    // 일반 모드: 새 루틴 생성
    if (!user?.userId) {
      notify("사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    createRoutine(
      { userId: user.userId, title: trimmedName },
      {
        onSuccess: () => {
          setShowSaveModal(false);
          setSaveModalName("");
          notify(`"${trimmedName}" 루틴이 저장되었습니다!`);
        },
        onError: () => notify("루틴 저장에 실패했습니다. 다시 시도해주세요."),
      },
    );
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
   * 새 루틴 만들기 — Draft 초기화 + 편집 모드 해제 + 선택 해제
   */
  const handleNewRoutine = () => {
    setEditingRoutineId(null);
    setEditingRoutineTitle("");
    setSelectedRoutineId(null);
    clearDraft(undefined, {
      onSuccess: () => notify("새 루틴 작성을 시작합니다."),
      onError: () => notify("초기화에 실패했습니다."),
    });
  };

  /**
   * 루틴 편집 모드 진입 — POST /api/v1/routines/{routineId}/edit-start
   * 선택된 저장 루틴을 Redis draft로 복사한 뒤 편집 가능 상태로 전환
   * editingRoutineId에 현재 루틴 ID를 저장해 이후 Edit Save 시 PUT에 사용
   */
  const handleEditRoutine = () => {
    if (!selectedRoutineId) return;
    const currentTitle =
      routineList.find((routine) => routine.routineId === selectedRoutineId)
        ?.title ?? "";

    loadRoutineToDraft(selectedRoutineId, {
      onSuccess: () => {
        setEditingRoutineId(selectedRoutineId);
        setEditingRoutineTitle(currentTitle);
        // 보기 모드 해제 → draft 편집 화면으로 전환
        setSelectedRoutineId(null);
        notify("루틴을 편집 모드로 불러왔습니다.");
      },
      onError: () => notify("루틴 불러오기에 실패했습니다."),
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-[16px] font-bold text-text-muted">Saved routine</p>
            <button
              onClick={handleNewRoutine}
              className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-xs text-brand cursor-pointer bg-transparent"
            >
              <Plus size={13} /> New
            </button>
          </div>
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
                isSelected={selectedRoutineId === saved.routineId}
                onDelete={() =>
                  handleDeleteRoutine(saved.routineId, saved.title)
                }
                onClick={() => {
                    // 다른 루틴 카드 선택 시 Edit mode 종료
                    setEditingRoutineId(null);
                    setEditingRoutineTitle("");
                    setSelectedRoutineId(saved.routineId);
                  }}
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
        {/* 루틴 이름 & 메인 루틴 설정 버튼 & 액션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {isViewingSavedRoutine
                ? selectedRoutineDetail.title
                : editingRoutineId !== null
                  ? editingRoutineTitle
                  : "메인루틴"}
            </h2>
            {/* ★ 클릭 시 현재 선택된(펼쳐진) 루틴을 바로 메인으로 설정 */}
            <button
              onClick={() => {
                if (!selectedRoutineId) {
                  notify("먼저 저장된 루틴 카드를 선택해주세요.");
                  return;
                }
                handleSetMainRoutine(selectedRoutineId);
              }}
              className="text-[16px] cursor-pointer bg-transparent border-none leading-none shrink-0"
              style={{
                color:
                  selectedRoutineId !== null &&
                  routineList.find((r) => r.routineId === selectedRoutineId)
                    ?.isMain
                    ? "#C8A96E"
                    : "#D9D5D0",
              }}
              aria-label="메인 루틴으로 설정"
            >
              ★ Main
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-1.5 text-[14px] shrink-0">
            {/* OCR 버튼 — 아이콘 + Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowOcrModal(true)}
                  className="flex items-center justify-center p-1.5 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent"
                  aria-label="OCR로 제품 추가"
                >
                  <ScanText size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>OCR로 제품 추가</TooltipContent>
            </Tooltip>
            {/* Edit Mode / Edit Save 버튼 — 편집 모드 여부에 따라 역할 전환 */}
            {editingRoutineId !== null ? (
              // 편집 모드: 클릭 시 수정 저장 모달 열기
              <button
                onClick={handleOpenEditSaveModal}
                disabled={isUpdating}
                className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-sky-100 disabled:opacity-50"
              >
                {isUpdating ? "저장 중..." : "Edit Save"}
              </button>
            ) : (
              // 일반 모드: 클릭 시 선택된 루틴을 draft로 불러옴
              <button
                onClick={handleEditRoutine}
                disabled={selectedRoutineId === null || isLoadingToEdit}
                className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent disabled:opacity-50"
              >
                {isLoadingToEdit ? "불러오는 중..." : "Edit Mode"}
              </button>
            )}
            <button
              onClick={handleOpenSaveModal}
              disabled={isCreating || filledCount === 0}
              className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent disabled:opacity-50"
            >
              {isCreating ? "저장 중..." : "Save"}
            </button>
          </div>
        </div>

        <p className="text-[14px] font-semibold text-text-muted">
          Edit Mode에서 변경
        </p>
      </div>

      {/* ── 루틴 스텝별 섹션 ── */}
      {routineSteps.map((step, stepIndex) => {
        const products = viewByStep[step.code] ?? [];
        const isDropTarget =
          !isViewingSavedRoutine &&
          editingRoutineId !== null &&
          dragState?.toStepCode === step.code;

        return (
          <div key={step.code} className="mt-3">
            {/* 스텝 섹션 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-brand">{stepIndex + 1}단계</span>
                <span className="text-[16px] font-semibold text-text-primary">
                  {step.label}
                </span>
              </div>
              {/* 보기 모드에서는 추가 버튼 숨김 */}
              {!isViewingSavedRoutine && (
                <button
                  onClick={() => onOpenModal(step.code, step.columnId)}
                  className="flex items-center gap-1 text-xs font-bold text-brand cursor-pointer border-none bg-transparent"
                >
                  <Plus size={13} /> 추가
                </button>
              )}
            </div>

            {products.length === 0 ? (
              /* 빈 스텝 — 드래프트 편집 화면과 동일한 형태, 보기 모드에서는 클릭 비활성 */
              <button
                data-drop-zone
                data-step-code={step.code}
                data-drop-index="0"
                onClick={
                  isViewingSavedRoutine
                    ? undefined
                    : () => onOpenModal(step.code, step.columnId)
                }
                className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 border-none text-left"
                style={{
                  cursor: isViewingSavedRoutine ? "default" : "pointer",
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
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map((product, index) => {
                  // edit mode: 저장된 루틴 편집 중(editingRoutineId !== null)일 때만 드래그 허용
                  const canDrag = !isViewingSavedRoutine && editingRoutineId !== null;

                  const isDraggingThis =
                    canDrag &&
                    dragState?.fromStepCode === step.code &&
                    dragState.fromIndex === index;
                  const isProductDropTarget =
                    canDrag &&
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
                      isEditMode={canDrag}
                      onDragHandlePointerDown={
                        canDrag ? handleDragHandlePointerDown : () => {}
                      }
                      onRemove={
                        isViewingSavedRoutine ? () => {} : handleRemoveProduct
                      }
                      stepIcon={step.icon}
                      priority={index === 0}
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
                stroke={
                  filledCount > 0 ? "#A69D92" : "var(--color-border-subtle)"
                }
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
              {editingRoutineId !== null ? "루틴 수정 저장" : "루틴 저장"}
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
                disabled={
                  !saveModalName.trim() ||
                  (editingRoutineId !== null ? isUpdating : isCreating)
                }
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#A69D92] cursor-pointer disabled:opacity-40"
              >
                {(editingRoutineId !== null ? isUpdating : isCreating)
                  ? "저장 중..."
                  : "저장"}
              </button>
            </div>
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
  /** true이면 드래그 핸들 표시 및 순서 변경 허용 */
  isEditMode: boolean;
  priority?: boolean;
  onDragHandlePointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    stepCode: string,
    index: number,
  ) => void;
  onRemove: (productId: number) => void;
  stepIcon: string;
}

function RoutineProductCard({
  product,
  stepCode,
  index,
  isDragging,
  isDropTarget,
  isEditMode,
  onDragHandlePointerDown,
  onRemove,
  stepIcon,
  priority = false,
}: RoutineProductCardProps) {
  return (
    <div
      data-drag-item
      data-step-code={stepCode}
      data-item-index={index}
      className="relative h-25 rounded-[10px] overflow-hidden bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
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
        <X size={16} className="text-[#C4BEB7]" />
      </button>

      <div className="flex items-center h-full">
        {/* 이미지 영역 — edit mode일 때만 드래그 핸들 활성화 */}
        <div
          className="relative shrink-0 w-22 h-full select-none"
          style={{
            touchAction: isEditMode ? "none" : "auto",
            cursor: isEditMode ? "grab" : "default",
          }}
          onPointerDown={
            isEditMode
              ? (event) => onDragHandlePointerDown(event, stepCode, index)
              : undefined
          }
        >
          {/* 드래그 아이콘 — edit mode일 때만 표시 */}
          {isEditMode && (
            <div className="absolute top-1 left-1 z-10">
              <ArrowUpDown size={15} className="text-[#C4BEB7]" />
            </div>
          )}

          {/* 이미지 */}
          <div className="absolute inset-0 bg-[#F5F2EC]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name ?? ""}
                fill
                sizes="88px"
                priority={priority}
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
            {product.categoryName && (
              <span className="text-[12px] px-1.5 rounded-[3px] font-semibold bg-[#EAE5DA] text-[#7A6F5C]">
                {product.categoryName}
              </span>
            )}
          </div>
          <p className="my-1.5 text-[16px] font-semibold text-[#2A2118] leading-[1.4] line-clamp-1">
            {product.name}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.skinTypes?.slice(0, 1).map((skinType) => (
              <span
                key={skinType}
                className="inline-block text-[12px] font-semibold px-1.5 rounded-[3px] bg-[#F0EDE8] text-[#7A7060]"
              >
                {fromSkinTypeEnum(skinType)}
              </span>
            ))}
            {product.tags?.slice(0, 2).map((effect) => (
              <span
                key={effect}
                className="inline-block text-[12px] font-semibold px-1.5 rounded-[3px] bg-[#EEE8E4] text-[#8A7A6E]"
              >
                {effect}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── 저장된 루틴 카드 ────────────────────────────────────────────────────────
interface SavedRoutineCardProps {
  saved: RoutineListResponse;
  isSelected: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function SavedRoutineCard({
  saved,
  isSelected,
  onDelete,
  onClick,
}: SavedRoutineCardProps) {
  // 선택된 카드만 금색 스타일 — 메인 여부와 무관하게 isSelected가 우선
  const borderStyle = isSelected ? "1.5px solid #C8A96E" : "1px solid #E2DDD8";
  const backgroundStyle = isSelected ? "#FBF7EF" : "#F8F6F2";

  return (
    <div
      onClick={onClick}
      className="relative shrink-0 flex flex-col gap-1 pt-5 pb-3 rounded-xl transition-all cursor-pointer"
      style={{
        minWidth: "calc(38% - 4px)",
        maxWidth: "calc(38% - 4px)",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        border: borderStyle,
        backgroundColor: backgroundStyle,
      }}
    >
      {/* 메인 루틴만 별표 배지 표시 */}
      {saved.isMain && (
        <span
          className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center text-[16px] leading-none"
          style={{ color: "#C8A96E" }}
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
        className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer"
      >
        <X size={14} className="text-[#8A8278]" />
      </button>

      {/* 루틴 이름 */}
      <p className="text-sm font-semibold text-[#2A2118] truncate leading-tight text-center">
        {saved.title}
      </p>

      {/* 제품 수 */}
      <p className="text-[12px] font-semibold text-[#A69D92] text-center">
        {saved.productCount}개 제품
      </p>
    </div>
  );
}
