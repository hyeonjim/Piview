"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  Package,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { MOCK_PRODUCT_DETAIL } from "@/constants/_mock/product";
import { getEwgColor } from "@/constants/categoryColors";
import { isAllergenIngredient } from "@/constants/allergens";

// ── 상세 페이지 전용 상수 ─────────────────────────────────────────────────────
const BRAND_COLOR = "#A2AA7B";
const BRAND_BG = "#F0F2E8";
const BRAND_LIGHT = "#C5CBA8";
const EWG_SAFE_COLOR = "#4CAF50";
const EWG_CAUTION_COLOR = "#FFB300";
const EWG_DANGER_COLOR = "#F44336";
const CAUTION_BG = "#FFF3E0";
const CAUTION_BORDER = "#FFE0B2";
const CAUTION_TAG_BG = "#FFCCBC";
const CAUTION_TAG_TEXT = "#BF360C";
const ALLERGEN_TAG_BG = "#FFCDD2";
const ALLERGEN_TAG_TEXT = "#B71C1C";
const ALLERGEN_ICON_BG = "#FFEBEE";
const PAGE_BG = "#F8F5EF";

// 알레르기 방패 아이콘 SVG
function AllergenIcon() {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: ALLERGEN_ICON_BG,
        alignSelf: "center",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L3 6v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
          fill="#E53935"
          fillOpacity="0.18"
          stroke="#D32F2F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="11" y="7.5" width="2" height="6" rx="1" fill="#D32F2F" />
        <circle cx="12" cy="16" r="1.2" fill="#D32F2F" />
      </svg>
    </div>
  );
}

// 물방울 EWG 아이콘
function DropIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
      <path
        d="M11 0C11 0 0 12 0 17.5C0 22.2 4.9 25.5 11 25.5C17.1 25.5 22 22.2 22 17.5C22 12 11 0 11 0Z"
        fill={color}
        fillOpacity={0.85}
      />
    </svg>
  );
}

export default function ProductDetailPage() {
  const d = MOCK_PRODUCT_DETAIL;

  const [owned, setOwned] = useState(false);
  const [routineAdded, setRoutineAdded] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "purpose" | "skintype"
  >("ingredients");
  const [ingredOpen, setIngredOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setShowScrollTop(scrollRef.current.scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };
  const handleAddRoutine = () => {
    if (routineAdded) return;
    setRoutineAdded(true);
    showToast(`✓ ${d.name} 루틴에 추가됨!`);
  };

  // EWG 통계 (mock에서 직접)
  const { total, safe, caution, danger, unknown, safePercent } = d.ewg;

  // 알레르기 유발 성분 필터
  const allergenList = d.ingredientsKr.filter((name) =>
    isAllergenIngredient(name),
  );

  const purposeScores = Object.entries(d.purposeScores);
  const skinTypeScores = Object.entries(d.skinTypeScores);

  return (
    <div
      className="flex flex-col min-h-full relative"
      style={{ backgroundColor: PAGE_BG }}
    >
      {/* 토스트 */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
          style={{
            padding: "10px 18px",
            borderRadius: 40,
            backgroundColor: "rgba(40,40,40,0.88)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* 헤더 — 하트 없음 */}
      <div
        className="sticky top-0 z-20 flex items-center px-4 h-14"
        style={{ backgroundColor: PAGE_BG }}
      >
        <Link
          href="/search"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <ChevronLeft size={22} color="#1A1A1A" />
        </Link>
      </div>

      {/* 스크롤 영역 */}
      <div
        className="flex-1 overflow-y-auto pb-8"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* 이미지 */}
        <div
          className="mx-5 mb-4 flex items-center justify-center"
          style={{ height: 240, borderRadius: 20, backgroundColor: "#EDEAE2" }}
        >
          <span style={{ fontSize: "80px" }}>{d.emoji ?? "🧴"}</span>
        </div>

        {/* 제품 기본 정보 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontSize: "16px",
                  color: "#AFAFAF",
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                {d.brand}
              </p>
              <h1
                style={{
                  fontSize: "19px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  lineHeight: 1.35,
                }}
              >
                {d.name}
              </h1>
            </div>
            {(d.skinType1 || d.skinType2) && (
              <div className="flex flex-col gap-1 shrink-0">
                {[d.skinType1, d.skinType2].filter(Boolean).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "13px",
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor: BRAND_BG,
                      color: BRAND_COLOR,
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {d.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "13px",
                  padding: "2px 9px",
                  borderRadius: 12,
                  backgroundColor: "#F5F5F5",
                  color: "#757575",
                  border: "1px solid #E8E0D0",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          {d.price && (
            <p style={{ fontSize: "16px", fontWeight: 400, color: "#1A1A1A" }}>
              ₩{d.price.toLocaleString()} /
              {d.volume && (
                <span
                  style={{
                    fontSize: "16px",
                    color: "#757575",
                    fontWeight: 400,
                    marginLeft: 6,
                  }}
                >
                  {d.volume}
                </span>
              )}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddRoutine}
              disabled={routineAdded}
              className="flex-1 flex items-center justify-center gap-1.5 border-none cursor-pointer transition-all active:scale-[0.98]"
              style={{
                height: 42,
                borderRadius: 12,
                backgroundColor: routineAdded ? "#F0F0F0" : BRAND_COLOR,
                color: routineAdded ? "#AFAFAF" : "#fff",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {routineAdded ? (
                <>
                  <Check size={15} /> 루틴추가됨
                </>
              ) : (
                <>
                  <Plus size={15} /> 루틴추가
                </>
              )}
            </button>
            <button
              onClick={() => setOwned((p) => !p)}
              className="flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              style={{
                height: 42,
                padding: "0 16px",
                borderRadius: 12,
                border: owned
                  ? `1px solid ${BRAND_LIGHT}`
                  : "1px solid #E8E0D0",
                backgroundColor: owned ? BRAND_BG : "white",
                color: owned ? BRAND_COLOR : "#757575",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <Package size={15} /> {owned ? "보유 중" : "보유추가"}
            </button>
          </div>
        </div>

        {/* 매칭 점수 링 */}
        {(() => {
          const score = d.matchScore;
          const color =
            score >= 90
              ? BRAND_COLOR
              : score >= 80
                ? "#5E6E48"
                : score >= 70
                  ? "#8A7B64"
                  : "#AFAFAF";
          const label =
            score >= 90
              ? "완벽한 매칭"
              : score >= 80
                ? "높은 매칭"
                : score >= 70
                  ? "좋은 매칭"
                  : "보통 매칭";
          const desc =
            score >= 90
              ? "내 피부 타입과 최적의 조합이에요"
              : score >= 80
                ? "내 피부에 잘 맞는 제품이에요"
                : score >= 70
                  ? "피부 타입과 어느 정도 맞아요"
                  : "다른 제품도 비교해보세요";
          return (
            <div
              className="mx-5 rounded-2xl px-5 py-4 mb-3"
              style={{ backgroundColor: BRAND_BG }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="relative shrink-0 flex items-center justify-center"
                  style={{ width: 64, height: 64 }}
                >
                  <svg width="64" height="64" style={{ position: "absolute" }}>
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#E8E4DC"
                      strokeWidth="5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke={color}
                      strokeWidth="5"
                      strokeDasharray={`${(score / 100) * 163.4} 163.4`}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {score}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ fontSize: "13px", fontWeight: 700, color }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        padding: "1px 7px",
                        borderRadius: 20,
                        backgroundColor: color,
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {score}점
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#8A7B64",
                      lineHeight: 1.5,
                    }}
                  >
                    {desc}
                  </p>
                  <p
                    style={{ fontSize: "13px", color: "#AFAFAF", marginTop: 2 }}
                  >
                    나와의 매칭 점수
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* EWG 성분 분석 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E8F5E9" }}
              >
                <span
                  style={{
                    color: EWG_SAFE_COLOR,
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    margin: 0,
                  }}
                >
                  EWG 성분 분석
                </p>
                <p style={{ fontSize: "13px", color: "#AFAFAF", margin: 0 }}>
                  총 {total}개 성분
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontSize: "13px", color: "#AFAFAF", margin: 0 }}>
                안전 비율
              </p>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: EWG_SAFE_COLOR,
                  margin: 0,
                }}
              >
                {safePercent}%
              </p>
            </div>
          </div>
          <div
            className="flex rounded-full overflow-hidden mb-3"
            style={{ height: 8, gap: 2 }}
          >
            <div
              style={{
                flex: safe,
                backgroundColor: EWG_SAFE_COLOR,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                flex: caution,
                backgroundColor: EWG_CAUTION_COLOR,
                borderRadius: 4,
              }}
            />
            {danger > 0 && (
              <div
                style={{
                  flex: danger,
                  backgroundColor: EWG_DANGER_COLOR,
                  borderRadius: 4,
                }}
              />
            )}
            <div
              style={{
                flex: unknown,
                backgroundColor: "#E0E0E0",
                borderRadius: 4,
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              {
                label: "1~2등급",
                sub: "안전",
                count: safe,
                color: EWG_SAFE_COLOR,
              },
              {
                label: "3~6등급",
                sub: "보통",
                count: caution,
                color: EWG_CAUTION_COLOR,
              },
              {
                label: "7~10등급",
                sub: "주의",
                count: danger,
                color: EWG_DANGER_COLOR,
              },
              {
                label: "등급 미정",
                sub: "정보없음",
                count: unknown,
                color: "#BDBDBD",
              },
            ].map((g) => (
              <div key={g.sub}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#616161",
                    marginBottom: 2,
                  }}
                >
                  • {g.label}
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: g.color,
                    margin: 0,
                  }}
                >
                  {g.count}
                </p>
                <p style={{ fontSize: "10px", color: "#AFAFAF", marginTop: 2 }}>
                  {g.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 성분 + 알레르기 성분 카드 */}
        {(d.cautionIngredients.length > 0 || allergenList.length > 0) && (
          <div
            className="mx-5 p-4 rounded-2xl mb-3"
            style={{
              backgroundColor: CAUTION_BG,
              border: `1px solid ${CAUTION_BORDER}`,
            }}
          >
            {/* 주의 성분 */}
            {d.cautionIngredients.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#E65100" />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#E65100",
                    }}
                  >
                    주의 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.cautionIngredients.map((ing) => (
                    <span
                      key={ing}
                      style={{
                        fontSize: "13px",
                        padding: "3px 10px",
                        borderRadius: 6,
                        backgroundColor: CAUTION_TAG_BG,
                        color: CAUTION_TAG_TEXT,
                        fontWeight: 500,
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* 알레르기 유발 성분 */}
            {allergenList.length > 0 && (
              <div
                style={{
                  marginTop: d.cautionIngredients.length > 0 ? "12px" : 0,
                  paddingTop: d.cautionIngredients.length > 0 ? "12px" : 0,
                  borderTop:
                    d.cautionIngredients.length > 0
                      ? "1px dashed #FFCC80"
                      : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L3 6v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                      fill="#D32F2F"
                      fillOpacity="0.2"
                      stroke="#D32F2F"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="11"
                      y="7.5"
                      width="2"
                      height="6"
                      rx="1"
                      fill="#D32F2F"
                    />
                    <circle cx="12" cy="16" r="1.2" fill="#D32F2F" />
                  </svg>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#C62828",
                    }}
                  >
                    알레르기 유발 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allergenList.map((name) => (
                    <span
                      key={name}
                      style={{
                        fontSize: "13px",
                        padding: "3px 10px",
                        borderRadius: 6,
                        backgroundColor: ALLERGEN_TAG_BG,
                        color: ALLERGEN_TAG_TEXT,
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 탭 */}
        <div className="mx-5 mb-2">
          <div
            className="flex rounded-xl p-1"
            style={{ backgroundColor: "#EEEBE4" }}
          >
            {[
              { key: "ingredients" as const, label: "전성분 분석" },
              { key: "purpose" as const, label: "목적별 점수" },
              { key: "skintype" as const, label: "피부타입별" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex-1 cursor-pointer border-none transition-all"
                style={{
                  height: 36,
                  borderRadius: 10,
                  fontSize: "13px",
                  fontWeight: activeTab === key ? 700 : 500,
                  backgroundColor: activeTab === key ? "#fff" : "transparent",
                  color: activeTab === key ? "#1A1A1A" : "#9E9E9E",
                  boxShadow:
                    activeTab === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mx-5 mb-8">
          {/* ── 전성분 분석 ── */}
          {activeTab === "ingredients" && (
            <div className="rounded-2xl bg-white overflow-hidden">
              {/* 제품 설명 */}
              {d.description && (
                <div
                  className="p-4"
                  style={{ borderBottom: "1px solid #F5F5F5" }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#616161",
                      marginBottom: 6,
                    }}
                  >
                    제품 설명
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#1A1A1A",
                      lineHeight: 1.6,
                    }}
                  >
                    {d.description}
                  </p>
                </div>
              )}

              {/* 전성분 펼치기 */}
              <div
                className="p-4"
                style={{ borderBottom: "1px solid #F5F5F5" }}
              >
                <button
                  className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0"
                  onClick={() => setIngredOpen((p) => !p)}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#616161",
                    }}
                  >
                    전성분
                  </span>
                  <div
                    className="flex items-center gap-1"
                    style={{ fontSize: "12px", color: "#9E9E9E" }}
                  >
                    {ingredOpen ? "접기" : "펼치기"}
                    {ingredOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </button>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#424242",
                    lineHeight: 1.7,
                    marginTop: 8,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: ingredOpen
                      ? ("unset" as unknown as number)
                      : 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {d.ingredientsKr.join(", ")}
                </p>
              </div>

              {/* 성분별 상세 목록 */}
              <div>
                {d.ingredientDetails.map((ing, idx) => {
                  const ewg = getEwgColor(ing.ewgGrade);
                  const isAllergen = isAllergenIngredient(ing.name);
                  return (
                    <div
                      key={ing.name}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        borderBottom:
                          idx < d.ingredientDetails.length - 1
                            ? "1px solid #F5F5F5"
                            : "none",
                      }}
                    >
                      {/* 물방울 + 등급 숫자 */}
                      <div
                        className="flex flex-col items-center shrink-0"
                        style={{ width: 28 }}
                      >
                        <DropIcon color={ewg.barColor} />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: ewg.text,
                            marginTop: 2,
                          }}
                        >
                          {ing.ewgGrade != null ? ing.ewgGrade : "?"}
                        </span>
                      </div>
                      {/* 성분 정보 */}
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {ing.name}
                        </p>
                        {ing.nameEn && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#9E9E9E",
                              margin: "2px 0 3px",
                            }}
                          >
                            {ing.nameEn}
                          </p>
                        )}
                        {ing.funcs && ing.funcs.length > 0 && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#757575",
                              lineHeight: 1.5,
                            }}
                          >
                            {ing.funcs.join(", ")}
                          </p>
                        )}
                      </div>
                      {/* 알레르기 아이콘 */}
                      {isAllergen && <AllergenIcon />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 목적별 점수 ── */}
          {activeTab === "purpose" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {purposeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: "13px", color: "#1A1A1A" }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: BRAND_COLOR,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#F0EDE8",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${score}%`,
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: BRAND_COLOR,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
              <p
                style={{
                  fontSize: "12px",
                  color: "#757575",
                  lineHeight: 1.6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  backgroundColor: "#F8F6F0",
                  marginTop: 4,
                }}
              >
                ⓘ 점수는 해당 목적에 관련 성분의 함유량과 효능을 기반으로
                산출됩니다. 80점 이상은 해당 목적에 매우 적합합니다.
              </p>
            </div>
          )}

          {/* ── 피부타입별 ── */}
          {activeTab === "skintype" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {skinTypeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "13px", color: "#1A1A1A" }}>
                        {label}
                      </span>
                      {label === d.skinType1 && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 8px",
                            borderRadius: 20,
                            backgroundColor: BRAND_COLOR,
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >
                          내 피부
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: BRAND_COLOR,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#F0EDE8",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${score}%`,
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: BRAND_COLOR,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 위로가기 버튼 (스크롤 300px 이상 시 노출) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-24 right-4 flex items-center justify-center cursor-pointer border-none z-20 transition-all active:scale-[0.93]"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <ChevronUp size={20} color="#1A1A1A" />
        </button>
      )}
    </div>
  );
}
