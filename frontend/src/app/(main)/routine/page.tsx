"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Save,
  Wand2,
  ScanLine,
  TrendingUp,
  X,
  Search,
} from "lucide-react";

/* ── 색상 토큰 (피그마 원본) ── */
const C = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  primaryLight: "#C5CBA8",
  surfaceWarm: "#FFFAF5",
  beigeBg: "#F8F6F0",
  text: "#2A2A2A",
  textMuted: "#AFAFAF",
  border: "#E8E0D0",
  borderDash: "#D4D0C8",
};

/* ── 루틴 스텝 정의 ── */
const STEPS = [
  {
    id: "cleanser",
    label: "클렌저",
    category: "클렌저",
    icon: "🫧",
    required: true,
  },
  {
    id: "toner",
    label: "토너/스킨",
    category: "토너",
    icon: "💧",
    required: true,
  },
  {
    id: "serum",
    label: "세럼/에센스",
    category: "세럼",
    icon: "✨",
    required: false,
  },
  {
    id: "cream",
    label: "크림/오일",
    category: "크림",
    icon: "🤍",
    required: true,
  },
  {
    id: "sunscreen",
    label: "선크림",
    category: "선크림",
    icon: "☀️",
    required: true,
  },
  {
    id: "eyecream",
    label: "아이크림",
    category: "아이크림",
    icon: "👁️",
    required: false,
  },
  {
    id: "mask",
    label: "마스크팩",
    category: "마스크",
    icon: "🎭",
    required: false,
  },
];

/* ── 카테고리 아이콘 (피그마 CATEGORY_ICONS 참고) ── */
const CAT_ICONS: Record<string, string> = {
  클렌저: "CL",
  토너: "TO",
  세럼: "SR",
  크림: "CR",
  선크림: "SC",
  아이크림: "EC",
  마스크: "MK",
};

export default function RoutinePage() {
  const [stepOrder, setStepOrder] = useState(STEPS.map((s) => s.id));
  const [routineProducts, setRoutineProducts] = useState<
    Record<string, { name: string; brand: string } | null>
  >({});
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [homeView, setHomeView] = useState<"routine" | "owned">("routine");

  /* 드래그 상태 */
  const dragRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const steps = stepOrder
    .map((id) => STEPS.find((s) => s.id === id))
    .filter(Boolean) as typeof STEPS;

  const routineCount = Object.values(routineProducts).filter(Boolean).length;

  return (
    <>
      <div
        className="flex flex-col min-h-full overflow-y-auto pb-4"
        style={{ backgroundColor: C.surfaceWarm }}
      >
        {/* ── Profile Header ── 피그마: backgroundColor #F8F6F0, px-6 pt-6 pb-5 */}
        <div style={{ backgroundColor: "#F8F6F0" }} className="px-6 pt-6 pb-5">
          {/* 프로필 행 */}
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: C.primaryBg,
                border: `2px solid ${C.primaryLight}`,
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: C.primary,
                  letterSpacing: "0.5px",
                }}
              >
                F
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: C.text,
                  letterSpacing: "-0.3px",
                }}
              >
                User
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: C.textMuted,
                  marginTop: "2px",
                }}
              >
                피부 타입을 진단해보세요
              </p>
            </div>
          </div>

          {/* 뷰 토글 — 피그마: borderRadius 12px, bg #ECEADE, mt-4 p-1 */}
          <div
            className="flex mt-4 p-1"
            style={{ borderRadius: "12px", backgroundColor: "#ECEADE" }}
          >
            {[
              { key: "routine", label: "내 루틴" },
              { key: "owned", label: "보유제품" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setHomeView(key as "routine" | "owned")}
                className="flex-1 flex items-center justify-center py-2 cursor-pointer transition-all duration-200"
                style={{
                  borderRadius: "10px",
                  backgroundColor: homeView === key ? "white" : "transparent",
                  border: "none",
                  color: homeView === key ? C.text : "#8A7B64",
                  fontSize: "12px",
                  fontWeight: homeView === key ? 700 : 500,
                  boxShadow:
                    homeView === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  letterSpacing: "0.3px",
                  gap: "6px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 내 루틴 섹션 ── */}
        {homeView === "routine" && (
          <div className="px-6 mt-3">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: C.text,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                  }}
                >
                  내 루틴
                </h2>
                <p
                  style={{
                    fontSize: "11px",
                    color: C.textMuted,
                    marginTop: "2px",
                  }}
                >
                  {routineCount}/{steps.length}단계 완성 · 길게 눌러 순서 변경
                </p>
              </div>

              {/* 액션 버튼들 — 피그마: height 자동, borderRadius 40px, fontSize 10px */}
              <div className="flex shrink-0" style={{ gap: "6px" }}>
                {[
                  {
                    label: "OCR",
                    icon: <ScanLine size={11} />,
                    bg: "white",
                    color: "#6B6B6B",
                    border: `1px solid ${C.border}`,
                  },
                  {
                    label: "저장",
                    icon: <Save size={11} />,
                    bg: "white",
                    color: "#6B6B6B",
                    border: `1px solid ${C.border}`,
                  },
                  {
                    label: "추천",
                    icon: <Wand2 size={11} />,
                    bg: C.primary,
                    color: "#FFFFFF",
                    border: "none",
                  },
                ].map(({ label, icon, bg, color, border }) => (
                  <button
                    key={label}
                    onClick={() => label === "저장" && setShowSaveModal(true)}
                    className="flex items-center px-3 py-1.5 cursor-pointer transition-all duration-200 whitespace-nowrap"
                    style={{
                      gap: "4px",
                      borderRadius: "40px",
                      backgroundColor: bg,
                      border,
                      color,
                      fontSize: "10px",
                      fontWeight: label === "추천" ? 700 : 600,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 루틴 스텝 카드들 */}
            <div className="flex flex-col" style={{ marginTop: "12px" }}>
              {steps.map((step, i) => {
                const product = routineProducts[step.id];
                const isOver = dragOverIdx === i;

                return (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={() => {
                      dragRef.current = i;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i);
                    }}
                    onDrop={() => {
                      if (dragRef.current !== null && dragRef.current !== i) {
                        setStepOrder((prev) => {
                          const next = [...prev];
                          const [moved] = next.splice(dragRef.current!, 1);
                          next.splice(i, 0, moved);
                          return next;
                        });
                      }
                      dragRef.current = null;
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                      setDragOverIdx(null);
                    }}
                    style={{
                      marginBottom: "10px",
                      borderTop: isOver
                        ? `2px solid ${C.primary}`
                        : "2px solid transparent",
                      transition: "border-top 0.15s",
                      cursor: "grab",
                    }}
                  >
                    {product ? (
                      /* ── 제품 있을 때 ── 피그마: bg white, border #E8E0D0, borderRadius 16px */
                      <div
                        style={{
                          borderRadius: "16px",
                          backgroundColor: "white",
                          border: `1px solid ${C.border}`,
                          overflow: "hidden",
                        }}
                      >
                        {/* 제품 행 — 피그마: px-[15px] py-[15px] */}
                        <div
                          className="flex items-start relative"
                          style={{ padding: "15px", cursor: "pointer" }}
                        >
                          {/* 이미지 — 피그마: 80×80 borderRadius 12px */}
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "12px",
                              backgroundColor: "#F8F6F0",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ fontSize: "32px" }}>
                              {step.icon}
                            </span>
                          </div>

                          {/* 정보 — 피그마: ml-3 */}
                          <div
                            className="flex-1 min-w-0"
                            style={{ marginLeft: "12px" }}
                          >
                            <div
                              className="flex items-center"
                              style={{ gap: "6px", flexWrap: "wrap" }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: C.textMuted,
                                  fontWeight: 500,
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {product.brand}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 3px",
                                  borderRadius: "3px",
                                  backgroundColor: "#F0EDE8",
                                  color: "#7A7060",
                                  fontWeight: 500,
                                  lineHeight: 1.4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                            <p
                              className="truncate"
                              style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                color: C.text,
                                letterSpacing: "0.3px",
                                margin: 0,
                                marginTop: "4px",
                              }}
                            >
                              {product.name}
                            </p>
                          </div>

                          {/* X 버튼 — 피그마: absolute top-3 right-3, size 22px */}
                          <button
                            onClick={() =>
                              setRoutineProducts((prev) => ({
                                ...prev,
                                [step.id]: null,
                              }))
                            }
                            className="absolute flex items-center justify-center border-none cursor-pointer"
                            style={{
                              top: "12px",
                              right: "12px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              backgroundColor: "#F5F5F5",
                              padding: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                lineHeight: 1,
                                color: C.textMuted,
                                fontWeight: 600,
                              }}
                            >
                              −
                            </span>
                          </button>
                        </div>

                        {/* 제품 추가 버튼 — 피그마: borderTop dashed #E8E0D0, py-2.5 */}
                        <button
                          onClick={() => setShowAddModal(step.id)}
                          className="w-full flex items-center justify-center cursor-pointer transition-all duration-200"
                          style={{
                            gap: "4px",
                            paddingTop: "10px",
                            paddingBottom: "10px",
                            backgroundColor: "transparent",
                            border: "none",
                            borderTop: `1px dashed ${C.border}`,
                            color: C.primary,
                          }}
                        >
                          <Plus size={13} />
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              letterSpacing: "0.3px",
                            }}
                          >
                            제품 추가
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* ── 제품 없을 때 ── 피그마: border dashed #D4D0C8, px-[10px] py-[16px] */
                      <button
                        onClick={() => setShowAddModal(step.id)}
                        className="w-full flex items-center cursor-pointer transition-all duration-200"
                        style={{
                          gap: "12px",
                          borderRadius: "16px",
                          backgroundColor: "white",
                          border: `1px dashed ${C.borderDash}`,
                          padding: "16px 10px",
                        }}
                      >
                        {/* 카테고리 아이콘 — 피그마: 44×44 borderRadius 12px bg #F8F6F0 */}
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            backgroundColor: "#F8F6F0",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: C.textMuted,
                              letterSpacing: "1px",
                            }}
                          >
                            {CAT_ICONS[step.category] || "PR"}
                          </span>
                        </div>

                        {/* 라벨 */}
                        <div className="flex-1 text-left">
                          <p
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#6B6B6B",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {step.label}
                          </p>
                        </div>

                        {/* + 추가 — 피그마: mr-[15px] */}
                        <div
                          className="flex items-center"
                          style={{
                            gap: "4px",
                            marginRight: "15px",
                            color: C.primary,
                          }}
                        >
                          <Plus size={14} />
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            추가
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── 루틴 종합 점수 (제품 있을 때) ── */}
            {routineCount > 0 && (
              <div
                className="mt-4 p-4"
                style={{
                  borderRadius: "16px",
                  backgroundColor: "white",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div className="flex items-center" style={{ gap: "12px" }}>
                  {/* Score Ring */}
                  <div
                    className="relative shrink-0 flex items-center justify-center"
                    style={{ width: "56px", height: "56px" }}
                  >
                    <svg
                      width="56"
                      height="56"
                      style={{ position: "absolute" }}
                    >
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="#F0EDE8"
                        strokeWidth="4"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke={C.primary}
                        strokeWidth="4"
                        strokeDasharray={`${(routineCount / steps.length) * 138} 138`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: C.primary,
                        position: "relative",
                      }}
                    >
                      {Math.round((routineCount / steps.length) * 100)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div
                      className="flex items-center"
                      style={{ gap: "6px", marginBottom: "4px" }}
                    >
                      <TrendingUp size={13} color={C.primary} />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: C.text,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        내 루틴 종합 점수
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#8A7B64",
                        lineHeight: 1.5,
                      }}
                    >
                      루틴을 완성할수록 피부가 건강해져요!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 루틴 저장 모달 ── 피그마: fixed top-1/2 left-1/2, borderRadius 20px, maxWidth 320px */}
      {showSaveModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowSaveModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-6"
            style={{
              width: "calc(100% - 48px)",
              maxWidth: "320px",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="flex items-center"
              style={{ gap: "8px", marginBottom: "16px" }}
            >
              <Save size={18} color={C.primary} />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: C.text,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                루틴 저장
              </h3>
            </div>
            <input
              type="text"
              placeholder="예: 겨울 보습 루틴"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full outline-none"
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#F8F6F0",
                border: `1px solid ${C.border}`,
                fontSize: "13px",
                color: C.text,
              }}
            />
            <div className="flex" style={{ gap: "8px", marginTop: "16px" }}>
              {[
                {
                  label: "취소",
                  onClick: () => setShowSaveModal(false),
                  bg: "#F8F6F0",
                  border: `1px solid ${C.border}`,
                  color: "#6B6B6B",
                  fw: 600,
                },
                {
                  label: "저장",
                  onClick: () => setShowSaveModal(false),
                  bg: routineName.trim() ? C.primary : "#E8E0D0",
                  border: "none",
                  color: routineName.trim() ? "#FFFFFF" : C.textMuted,
                  fw: 700,
                },
              ].map(({ label, onClick, bg, border, color, fw }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex-1 py-2.5 cursor-pointer transition-all"
                  style={{
                    borderRadius: "40px",
                    backgroundColor: bg,
                    border,
                    color,
                    fontSize: "12px",
                    fontWeight: fw,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── 제품 추가 모달 ── */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => {
              setShowAddModal(null);
              setAddSearch("");
            }}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "40px 20px" }}
          >
            <div
              className="bg-white flex flex-col pointer-events-auto"
              style={{
                borderRadius: "20px",
                width: "100%",
                maxWidth: "420px",
                maxHeight: "100%",
                boxShadow: "0px 8px 40px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div
                  style={{
                    width: "32px",
                    height: "4px",
                    borderRadius: "2px",
                    backgroundColor: C.border,
                  }}
                />
                <button
                  onClick={() => setShowAddModal(null)}
                  className="border-none bg-transparent cursor-pointer"
                >
                  <X size={20} color={C.textMuted} />
                </button>
              </div>
              <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: C.text,
                    marginTop: "4px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {STEPS.find((s) => s.id === showAddModal)?.label} 선택
                </h3>
                {/* 검색창 */}
                <div className="relative mt-3 mb-3">
                  <Search
                    size={15}
                    color={C.textMuted}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    placeholder="제품명 또는 브랜드 검색..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="w-full outline-none"
                    style={{
                      height: "40px",
                      paddingLeft: "34px",
                      borderRadius: "12px",
                      backgroundColor: "#F8F6F0",
                      border: `1px solid ${C.border}`,
                      fontSize: "13px",
                    }}
                  />
                </div>
                {/* 더미 빈 상태 */}
                <div className="flex flex-col items-center py-10">
                  <span style={{ fontSize: "40px" }}>🔍</span>
                  <p
                    style={{
                      fontSize: "13px",
                      color: C.textMuted,
                      marginTop: "12px",
                      textAlign: "center",
                    }}
                  >
                    제품을 검색하거나
                    <br />
                    제품 탭에서 추가해보세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
