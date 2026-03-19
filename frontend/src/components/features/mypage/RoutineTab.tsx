"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, X, RotateCcw, ArrowUpDown, Wrench } from "lucide-react";
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
import {
  useToast,
  useRoutineListQuery,
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useSetMainRoutineMutation,
  useClearDraftMutation,
} from "@/hooks";
import { Toast } from "@/components/common/Toast";
// ⚠️ BE 연동 시 아래 import 삭제
import { IS_MOCK_DATA } from "@/constants/_mock/routine";

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
    savedRoutines: localSavedRoutines,
    currentRoutineName,
  } = useLocalRoutineStore();

  // ── 루틴 서버 API 훅 ──────────────────────────────────────────────
  // ⚠️ API 연동 시: 목업 → 실제 데이터로 자동 교체 (훅 내부에서 처리)
  const { data: serverRoutineList = [] } = useRoutineListQuery();
  const { mutate: createRoutine, isPending: isCreating } = useCreateRoutineMutation();
  const { mutate: deleteRoutine } = useDeleteRoutineMutation();
  const { mutate: setMainRoutine } = useSetMainRoutineMutation();
  const { mutate: clearDraft } = useClearDraftMutation();

  // 저장 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");

  // 저장된 루틴 슬라이더 스크롤 상태 — 도트 인디케이터 연동
  const savedRoutineScrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // 스크롤 위치 기준으로 활성 카드 인덱스 갱신
  const handleSavedRoutineScroll = () => {
    const container = savedRoutineScrollRef.current;
    if (!container) return;
    const firstCard = container.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    // 카드 너비 + gap(8px) 기준으로 인덱스 계산
    const cardWidth = firstCard.offsetWidth + 8;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, savedRoutines.length - 1));
  };

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
  // strokeDash는 JS 계산값이므로 인라인 style 유지
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

  /**
   * 루틴 저장 — 서버 API(POST /api/v1/routines) 호출
   * ⚠️ API 연동 시: createRoutine mutationFn 내부에서 routineService.createRoutine()으로 교체
   */
  const handleSaveRoutine = () => {
    const trimmedName = saveModalName.trim();
    if (!trimmedName) return;

    // 서버에 루틴 생성 요청 (draft → 최종 루틴 전환)
    createRoutine(
      { title: trimmedName },
      {
        onSuccess: () => {
          // 로컬 스토어에도 저장 (화면 즉시 반영용)
          saveRoutine(trimmedName);
          setShowSaveModal(false);
          setSaveModalName("");
          notify(`"${trimmedName}" 루틴이 저장되었습니다!`);
        },
        onError: () => {
          notify("루틴 저장에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );
  };

  /**
   * 루틴 불러오기 — 로컬 스토어에서 복원
   * ⚠️ API 연동 시: 서버 루틴 ID로 상세 조회 후 루틴 복원
   */
  const handleLoadRoutine = (id: string) => {
    // 로컬 스토어에서 먼저 찾기
    const localFound = localSavedRoutines.find((r) => r.id === id);
    if (localFound) {
      loadSavedRoutine(id);
      notify(`"${localFound.name}" 루틴을 불러왔습니다.`);
      return;
    }
    // 서버 루틴 목록에서 이름만 확인 (불러오기는 로컬 동기화된 항목만 지원)
    // ⚠️ API 연동 시: 서버 루틴 상세 조회 후 setRoutine()으로 복원
    const serverFound = serverRoutineList.find((r) => String(r.routineId) === id);
    if (serverFound) notify(`"${serverFound.title}" 루틴은 아직 불러오기를 지원하지 않습니다.`);
  };

  /**
   * 루틴 삭제 — 로컬 스토어 삭제 + 서버 루틴이면 서버 API도 호출
   * ⚠️ API 연동 시: deleteRoutine mutationFn 내부에서 routineService.deleteRoutine()으로 교체
   */
  const handleDeleteRoutine = (id: string) => {
    const parsedId = parseInt(id, 10);
    const isServerRoutine = !isNaN(parsedId);

    if (isServerRoutine) {
      // 서버 루틴 삭제 — TanStack Query 낙관적 업데이트로 목록에서 즉시 제거
      const serverFound = serverRoutineList.find((r) => r.routineId === parsedId);
      deleteRoutine(parsedId, {
        onSuccess: () => notify(serverFound ? `"${serverFound.title}" 루틴이 삭제되었습니다.` : "루틴이 삭제되었습니다."),
        onError: () => notify("루틴 삭제에 실패했습니다."),
      });
    } else {
      // 로컬 스토어 루틴 삭제
      const found = localSavedRoutines.find((r) => r.id === id);
      deleteSavedRoutine(id);
      if (found) notify(`"${found.name}" 루틴이 삭제되었습니다.`);
    }
  };

  /**
   * 메인 루틴 선택 — 서버 API(PATCH /api/v1/routines/{routineId}/main) 호출
   * ⚠️ API 연동 시: setMainRoutine mutationFn 내부에서 routineService.setMainRoutine()으로 교체
   */
  const handleSetMainRoutine = (routineId: number) => {
    setMainRoutine(routineId, {
      onSuccess: () => notify("메인 루틴이 변경되었습니다."),
      onError: () => notify("메인 루틴 변경에 실패했습니다."),
    });
  };

  /**
   * 루틴 초기화 — 서버 API(DELETE /api/v1/routines/draft) 호출 + 로컬 초기화
   * ⚠️ API 연동 시: clearDraft mutationFn 내부에서 routineService.clearDraft()로 교체
   */
  const handleClearRoutine = () => {
    clearRoutine(); // 로컬 상태 즉시 초기화
    clearDraft();   // 서버 draft 비우기 (Redis 초기화)
  };

  // 화면에 표시할 루틴 목록
  // 로컬 저장 루틴을 기본으로 표시하고, 서버 루틴(목업)은 별도 병합
  // ⚠️ API 연동 시: localSavedRoutines 제거하고 serverRoutineList만 사용하도록 교체
  const savedRoutines = [
    // 로컬 스토어 루틴 — 저장 즉시 반영됨
    ...localSavedRoutines.map((savedRoutine) => ({
      id: savedRoutine.id,
      name: savedRoutine.name,
      routine: savedRoutine.routine,
      productCount: savedRoutine.productCount,
      savedAt: savedRoutine.savedAt,
      isMain: false,
    })),
    // 서버 루틴 — 로컬에 없는 항목만 추가 (이름 기준 중복 제거)
    // ⚠️ API 연동 시: 이 병합 로직 삭제하고 serverRoutineList만 사용
    ...serverRoutineList
      .filter((serverRoutine) => !localSavedRoutines.some((local) => local.name === serverRoutine.title))
      .map((serverRoutine) => ({
        id: String(serverRoutine.routineId),
        name: serverRoutine.title,
        routine: {} as ReturnType<typeof useLocalRoutineStore.getState>["routine"],
        productCount: serverRoutine.productCount,
        savedAt: 0,
        isMain: serverRoutine.isMain,
      })),
  ];

  return (
    <div className="px-5 pt-4 flex flex-col gap-2 pb-10">

      {/* ── 목업 데이터 사용 중 알림 배너 — BE 연동 시 삭제 ── */}
      {IS_MOCK_DATA && serverRoutineList.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#FFF8E7] border border-[#F5C842] text-[#8A6A00]">
          <Wrench size={12} />
          <span>목업 데이터 사용 중 — BE 연동 시 자동으로 실제 데이터로 교체됩니다</span>
        </div>
      )}

      {/* ── 저장된 루틴 슬라이더 — 3개씩 가로 스와이프 ── */}
      {savedRoutines.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-text-muted mb-2">저장된 루틴</p>
          {/* scrollbarWidth: none, WebkitOverflowScrolling은 Tailwind 불가 — style 유지 */}
          <div
            ref={savedRoutineScrollRef}
            className="flex gap-2 overflow-x-scroll pb-1"
            onScroll={handleSavedRoutineScroll}
            style={{
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {savedRoutines.map((saved) => (
              <SavedRoutineCard
                key={saved.id}
                saved={saved}
                // 이름 기준으로 활성 카드 판별 — 불러오기 시 currentRoutineName이 갱신됨
                isActive={currentRoutineName === saved.name && currentRoutineName !== "내 루틴"}
                isMain={saved.isMain}
                // ⚠️ BE 연동 시 isMock prop 전달 제거
                isMock={IS_MOCK_DATA && serverRoutineList.length > 0}
                onLoad={() => handleLoadRoutine(saved.id)}
                onDelete={() => handleDeleteRoutine(saved.id)}
                // ⚠️ API 연동 시: saved.id가 서버 숫자 ID로 확정되면 parseInt 제거 가능
                onSetMain={() => {
                  const serverId = parseInt(saved.id, 10);
                  if (!isNaN(serverId)) handleSetMainRoutine(serverId);
                }}
              />
            ))}
          </div>

          {/* 스크롤 도트 인디케이터 — 카드가 2개 이상일 때 표시 */}
          {savedRoutines.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {savedRoutines.map((_, index) => (
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
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {/* 현재 루틴 이름 — 저장 후 갱신됨, 기본값 "내 루틴" */}
            <p className="text-base font-bold text-text-primary truncate max-w-[140px]">
              {currentRoutineName}
            </p>
            {/* ⚠️ API 연동 시: handleSetMainRoutine(routineId)으로 교체 */}
            <button
              onClick={toggleMainRoutine}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all active:scale-95 shrink-0 ${
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
          {/* 초기화 — 로컬 상태 + 서버 draft(Redis) 동시 초기화 */}
          <button
            onClick={handleClearRoutine}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent"
          >
            <RotateCcw size={12} /> 초기화
          </button>
          {/* OCR */}
          <button className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent">
            ⇄ OCR
          </button>
          {/* 저장 — 클릭 시 루틴 이름 입력 모달 → POST /api/v1/routines */}
          <button
            onClick={handleOpenSaveModal}
            disabled={isCreating}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-text-secondary cursor-pointer bg-transparent disabled:opacity-50"
          >
            {isCreating ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* ── 루틴 스텝별 섹션 ── */}
      {ROUTINE_STEPS.map((step) => {
        const products = routine[step.code] ?? [];
        const isDropTarget = dragState?.toStepCode === step.code;
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
              // 드롭 여부에 따라 배경·테두리 동적 변경은 JS 값이므로 style 유지
              <button
                data-drop-zone
                data-step-code={step.code}
                data-drop-index="0"
                onClick={() => onOpenModal(step.code)}
                className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer border-none text-left"
                style={{
                  backgroundColor: isDropTarget ? "rgba(166,157,146,0.12)" : "var(--color-warm-bg)",
                  border: isDropTarget ? "2px dashed #A69D92" : "1px solid var(--color-border-subtle)",
                  transition: "background-color 0.1s, border 0.1s",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-text-muted shrink-0 bg-bg-muted-warm">
                  {step.code}
                </div>
                <p className="flex-1 text-sm font-medium text-text-muted">
                  아직 추가된 제품이 없어요
                </p>
                <Plus size={14} className="shrink-0 text-[#A69D92]" />
              </button>
            ) : (
              // 드래그 정렬 가능한 제품 목록
              <div className="flex flex-col gap-2">
                {products.map((product, index) => {
                  const isDraggingThis =
                    dragState?.fromStepCode === step.code &&
                    dragState.fromIndex === index;
                  const isProductDropTarget =
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
                      className="flex items-stretch h-25 rounded-[10px] overflow-hidden bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                      style={{
                        // isDraggingThis, isProductDropTarget는 JS 동적 값 — style 유지
                        opacity: isDraggingThis ? 0.4 : 1,
                        border: isProductDropTarget ? "2px solid #A69D92" : "1px solid #E2DDD8",
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
                          <span className="text-xs font-medium text-[#BFB6AA] uppercase tracking-[0.08em]">
                            {product.brand}
                          </span>
                          {product.category && categoryColor && (
                            // 카테고리 색상은 동적 객체값 — style 유지
                            <span
                              className="text-[11px] px-1.5 py-px rounded-[3px] font-semibold"
                              style={{
                                backgroundColor: categoryColor.chip,
                                color: categoryColor.accent,
                              }}
                            >
                              {product.category}
                            </span>
                          )}
                        </div>
                        <p className="m-0 text-base font-medium text-[#2A2118] leading-snug line-clamp-2">
                          {product.name}
                        </p>
                        {/* 피부타입 태그 */}
                        {(product.skinTypes ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(product.skinTypes ?? []).map((skinType) => {
                              const tagColor = SKIN_TYPE_TAG_COLORS[skinType];
                              return tagColor ? (
                                // 피부타입 색상은 동적 객체값 — style 유지
                                <span
                                  key={skinType}
                                  className="text-[11px] px-1.5 py-px rounded-[3px] font-semibold"
                                  style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
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
                            {(product.effects ?? []).slice(0, 3).map((effect) => {
                              const effectColor = SKIN_FUNCTION_COLORS[effect];
                              return effectColor ? (
                                // 기능 색상은 동적 객체값 — style 유지
                                <span
                                  key={effect}
                                  className="text-[11px] px-1.5 py-px rounded-[3px] font-medium"
                                  style={{ backgroundColor: effectColor.chip, color: effectColor.accent }}
                                >
                                  {effect}
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
                        <X size={14} className="text-[#C4BEB7]" />
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
      {/* 테두리 색상이 JS scoreColor 변수 기반 — style 유지 */}
      <div
        className="mt-10 p-4 rounded-2xl bg-(--color-warm-bg)"
        style={{ border: `1px solid ${filledCount > 0 ? scoreColor + "40" : "var(--color-border-subtle)"}` }}
      >
        <div className="flex items-center gap-3">
          {/* 점수 링 — SVG strokeDash는 JS 계산값 */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg width="56" height="56" className="absolute">
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="4"
              />
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke={filledCount > 0 ? scoreColor : "var(--color-border-subtle)"}
                strokeWidth="4"
                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            {/* 점수 텍스트 색상도 JS 변수 — style 유지 */}
            <span
              className="relative z-10 text-[13px] font-bold"
              style={{ color: filledCount > 0 ? scoreColor : "var(--color-text-muted)" }}
            >
              {averageScore}
            </span>
          </div>
          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary mb-1">내 루틴 종합 점수</p>
            <p className="text-xs text-text-muted leading-relaxed break-keep">
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
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 bg-black/45"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#2A2118] mb-1">루틴 이름 저장</h3>
            <p className="text-xs text-[#A69D92] mb-4">저장하면 목록에서 불러올 수 있어요</p>
            <input
              type="text"
              value={saveModalName}
              onChange={(event) => setSaveModalName(event.target.value)}
              placeholder="예) 아침 루틴, 데일리 케어"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#E2DDD8] outline-none mb-4"
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
              >
                취소
              </button>
              <button
                onClick={handleSaveRoutine}
                disabled={!saveModalName.trim()}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#A69D92] cursor-pointer disabled:opacity-40"
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

// ── 저장된 루틴 카드 — 카드 클릭으로 불러오기, 3개씩 가로 나열 ──────────────────────
function SavedRoutineCard({
  saved,
  isActive,
  isMain,
  isMock,
  onLoad,
  onDelete,
}: {
  saved: SavedRoutine & { isMain?: boolean };
  isActive: boolean;
  isMain?: boolean;
  /** 목업 데이터 여부 — ⚠️ BE 연동 시 prop 제거 */
  isMock?: boolean;
  onLoad: () => void;
  onDelete: () => void;
  // ⚠️ API 연동 시: PATCH /api/v1/routines/{routineId}/main 호출
  onSetMain?: () => void;
}) {
  // 활성 카드 테두리 색상 — JS 조건 분기 (Tailwind arbitrary value로 불가)
  const activeBorderColor = isMock ? "#F5C842" : isMain ? "#C8A96E" : "#A69D92";
  const activeBgColor = isMock ? "#FFFBEF" : isMain ? "#FBF7EF" : "#F5F2EC";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onLoad}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onLoad(); }}
      className="relative shrink-0 flex flex-col gap-1 pt-7 pb-3 rounded-xl cursor-pointer transition-all active:scale-95"
      style={{
        // 2.5개 동시 표시 — 다음 카드가 살짝 보여 스와이프 유도, calc()는 Tailwind 불가
        minWidth: "calc(38% - 4px)",
        maxWidth: "calc(38% - 4px)",
        scrollSnapAlign: "start",
        // 활성 카드만 테두리 강조, 비활성은 테두리 없음
        border: isActive ? `1.5px solid ${activeBorderColor}` : "none",
        backgroundColor: isActive ? activeBgColor : "#F8F6F2",
      }}
    >
      {/* 메인 표시 — 좌상단 별표 아이콘 */}
      {isMain && (
        <span className="absolute top-1.5 left-1.5 text-xs leading-none text-[#C8A96E]">★</span>
      )}

      {/* 삭제 버튼 — 우측 상단 */}
      <button
        onClick={(event) => { event.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer bg-[#E8E4DF]"
      >
        <X size={11} className="text-[#8A8278]" />
      </button>

      {/* 루틴 이름 — 목업 아이콘이 있으면 왼쪽에 표시 */}
      <div className="flex items-center justify-center gap-0.5 px-1">
        {/* 목업 아이콘 — ⚠️ BE 연동 시 isMock prop과 함께 제거 */}
        {isMock && <Wrench size={10} className="shrink-0 text-[#8A6A00]" />}
        <p className="text-sm font-bold text-[#2A2118] truncate leading-tight">
          {saved.name}
        </p>
      </div>

      {/* 제품 수 */}
      <p className="text-[10px] text-[#A69D92] text-center">
        {saved.productCount}개 제품
      </p>
    </div>
  );
}
