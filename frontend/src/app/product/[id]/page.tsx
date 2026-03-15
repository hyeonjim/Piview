"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Package,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { getMockProductById } from "@/constants/_mock/product";
import { getEwgColor } from "@/constants/categoryColors";
import { isAllergenIngredient } from "@/constants/allergens";

// ── 알레르기 방패 아이콘 ────────────────────────────────────────────
function AllergenIcon() {
  return (
    <div className="flex items-center justify-center shrink-0 self-center w-7 h-7 rounded-lg bg-[rgba(229,57,53,0.08)]">
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

// ── 물방울 EWG 아이콘 ───────────────────────────────────────────────
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
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // ⚠️ API 연동 시 → productService.getProduct(id) 로 교체
  const d = getMockProductById(id);

  const [owned, setOwned] = useState(false);
  const [routineAdded, setRoutineAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "purpose" | "skintype"
  >("ingredients");
  const [ingredOpen, setIngredOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toastMsg, showToast } = useToast();

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setShowScrollTop(scrollRef.current.scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAddRoutine = () => {
    if (routineAdded) return;
    setRoutineAdded(true);
    showToast(`✓ ${d.name} 루틴에 추가됨!`);
  };

  const { total, safe, caution, danger, unknown, safePercent } = d.ewg;
  const allergenList = d.ingredientsKr.filter((name) =>
    isAllergenIngredient(name),
  );
  const purposeScores = Object.entries(d.purposeScores);
  const skinTypeScores = Object.entries(d.skinTypeScores);

  // 매칭 점수
  const score = d.matchScore;
  const matchColor =
    score >= 90
      ? "var(--color-brand)"
      : score >= 80
        ? "#5E6E48"
        : score >= 70
          ? "#8A7B64"
          : "#AFAFAF";
  const matchLabel =
    score >= 90
      ? "완벽한 매칭"
      : score >= 80
        ? "높은 매칭"
        : score >= 70
          ? "좋은 매칭"
          : "보통 매칭";
  const matchDesc =
    score >= 90
      ? "내 피부 타입과 최적의 조합이에요"
      : score >= 80
        ? "내 피부에 잘 맞는 제품이에요"
        : score >= 70
          ? "피부 타입과 어느 정도 맞아요"
          : "다른 제품도 비교해보세요";

  return (
    <div className="flex flex-col min-h-full relative bg-bg-beige">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div className="sticky top-0 z-20 flex items-center px-4 h-14 bg-bg-beige">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 border-none cursor-pointer"
        >
          <ChevronLeft size={22} color="#1A1A1A" />
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div
        className="flex-1 overflow-y-auto pb-8"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* 이미지 */}
        <div className="mx-5 mb-4 flex items-center justify-center h-[240px] rounded-[20px] bg-[#EDEAE2]">
          <span className="text-[80px]">{d.emoji ?? "🧴"}</span>
        </div>

        {/* 제품 기본 정보 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-base text-text-muted font-medium mb-0.5">
                {d.brand}
              </p>
              <h1 className="text-[19px] font-semibold text-text-primary leading-[1.35]">
                {d.name}
              </h1>
            </div>
            {(d.skinType1 || d.skinType2) && (
              <div className="flex flex-col gap-1 shrink-0">
                {[d.skinType1, d.skinType2].filter(Boolean).map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-[2px] rounded-[6px] bg-brand-bg text-brand font-semibold"
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
                className="text-xs px-[9px] py-[2px] rounded-xl bg-bg-chip text-text-hint border border-border-warm"
              >
                {tag}
              </span>
            ))}
          </div>

          {d.price && (
            <p className="text-base font-normal text-text-primary">
              ₩{d.price.toLocaleString()} /
              {d.volume && (
                <span className="text-base text-text-hint font-normal ml-1.5">
                  {d.volume}
                </span>
              )}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddRoutine}
              disabled={routineAdded}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[42px] rounded-xl border-none cursor-pointer transition-all active:scale-[0.98] text-sm font-bold ${
                routineAdded
                  ? "bg-[#F0F0F0] text-text-muted"
                  : "bg-brand text-white"
              }`}
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
              className={`flex items-center justify-center gap-1.5 h-[42px] px-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] text-sm font-semibold border ${
                owned
                  ? "border-brand-light bg-brand-bg text-brand"
                  : "border-border-warm bg-white text-text-hint"
              }`}
            >
              <Package size={15} /> {owned ? "보유 중" : "보유추가"}
            </button>
          </div>
        </div>

        {/* 매칭 점수 링 */}
        <div className="mx-5 rounded-2xl px-5 py-4 mb-3 bg-brand-bg">
          <div className="flex items-center gap-4">
            <div
              className="relative shrink-0 flex items-center justify-center"
              style={{ width: 64, height: 64 }}
            >
              <svg width="64" height="64" className="absolute">
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
                  stroke={matchColor}
                  strokeWidth="5"
                  strokeDasharray={`${(score / 100) * 163.4} 163.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <span
                className="relative z-[1] text-[15px] font-bold"
                style={{ color: matchColor }}
              >
                {score}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-xs font-bold"
                  style={{ color: matchColor }}
                >
                  {matchLabel}
                </span>
                <span
                  className="text-xs px-[7px] py-[1px] rounded-[20px] text-white font-semibold"
                  style={{ backgroundColor: matchColor }}
                >
                  {score}점
                </span>
              </div>
              <p className="text-xs text-[#8A7B64] leading-[1.5]">
                {matchDesc}
              </p>
              <p className="text-xs text-text-muted mt-0.5">나와의 매칭 점수</p>
            </div>
          </div>
        </div>

        {/* EWG 성분 분석 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-ewg-safe-bg">
                <span className="text-ewg-safe text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary m-0">
                  EWG 성분 분석
                </p>
                <p className="text-xs text-text-muted m-0">총 {total}개 성분</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted m-0">안전 비율</p>
              <p className="text-[22px] font-extrabold text-ewg-safe m-0">
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
                backgroundColor: "var(--color-ewg-safe)",
                borderRadius: 4,
              }}
            />
            <div
              style={{
                flex: caution,
                backgroundColor: "var(--color-ewg-caution)",
                borderRadius: 4,
              }}
            />
            {danger > 0 && (
              <div
                style={{
                  flex: danger,
                  backgroundColor: "var(--color-ewg-danger)",
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
                color: "var(--color-ewg-safe)",
              },
              {
                label: "3~6등급",
                sub: "보통",
                count: caution,
                color: "var(--color-ewg-caution)",
              },
              {
                label: "7~10등급",
                sub: "주의",
                count: danger,
                color: "var(--color-ewg-danger)",
              },
              {
                label: "등급 미정",
                sub: "정보없음",
                count: unknown,
                color: "#BDBDBD",
              },
            ].map((g) => (
              <div key={g.sub}>
                <p className="text-xs text-text-sub mb-0.5">• {g.label}</p>
                <p className="text-lg font-bold m-0" style={{ color: g.color }}>
                  {g.count}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">{g.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 성분 + 알레르기 카드 */}
        {(d.cautionIngredients.length > 0 || allergenList.length > 0) && (
          <div className="mx-5 p-4 rounded-2xl mb-3 bg-[#FFF8F0] border border-[#FFE0B2]">
            {d.cautionIngredients.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#E65100" />
                  <span className="text-sm font-semibold text-[#E65100]">
                    주의 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.cautionIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="text-xs px-[10px] py-[3px] rounded-[6px] font-medium"
                      style={{ backgroundColor: "#FFF3E0", color: "#BF360C" }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </>
            )}

            {allergenList.length > 0 && (
              <div
                className={
                  d.cautionIngredients.length > 0
                    ? "mt-3 pt-3 border-t border-dashed border-[#FFCC80]"
                    : ""
                }
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
                  <span className="text-sm font-semibold text-[#C62828]">
                    알레르기 유발 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allergenList.map((name) => (
                    <span
                      key={name}
                      className="text-xs px-[10px] py-[3px] rounded-[6px] font-medium"
                      style={{ backgroundColor: "#FFEBEE", color: "#B71C1C" }}
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
          <div className="flex rounded-xl p-1 bg-[#EEEBE4]">
            {[
              { key: "ingredients" as const, label: "전성분 분석" },
              { key: "purpose" as const, label: "목적별 점수" },
              { key: "skintype" as const, label: "피부타입별" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 h-9 rounded-[10px] border-none cursor-pointer transition-all text-xs ${
                  activeTab === key
                    ? "bg-white text-text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-text-muted font-medium"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mx-5 mb-8">
          {/* 전성분 분석 */}
          {activeTab === "ingredients" && (
            <div className="rounded-2xl bg-white overflow-hidden">
              {d.description && (
                <div className="p-4 border-b border-[#F5F5F5]">
                  <p className="text-xs font-semibold text-text-sub mb-1.5">
                    제품 설명
                  </p>
                  <p className="text-xs text-text-primary leading-[1.6]">
                    {d.description}
                  </p>
                </div>
              )}

              <div className="p-4 border-b border-[#F5F5F5]">
                <button
                  className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0"
                  onClick={() => setIngredOpen((p) => !p)}
                >
                  <span className="text-xs font-semibold text-text-sub">
                    전성분
                  </span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    {ingredOpen ? "접기" : "펼치기"}
                    {ingredOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </button>
                <p
                  className="text-[12px] text-[#424242] leading-[1.7] mt-2 overflow-hidden"
                  style={{
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
                      <div className="flex flex-col items-center shrink-0 w-7">
                        <DropIcon color={ewg.barColor} />
                        <span
                          className="text-[10px] font-bold mt-0.5"
                          style={{ color: ewg.text }}
                        >
                          {ing.ewgGrade != null ? ing.ewgGrade : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary m-0 leading-[1.3]">
                          {ing.name}
                        </p>
                        {ing.nameEn && (
                          <p className="text-xs text-text-muted my-0.5">
                            {ing.nameEn}
                          </p>
                        )}
                        {ing.funcs && ing.funcs.length > 0 && (
                          <p className="text-xs text-text-hint leading-[1.5]">
                            {ing.funcs.join(", ")}
                          </p>
                        )}
                      </div>
                      {isAllergen && <AllergenIcon />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 목적별 점수 */}
          {activeTab === "purpose" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {purposeScores.map(([label, sc]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-primary">{label}</span>
                    <span className="text-xs font-bold text-brand">{sc}</span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-[#F0EDE8] overflow-hidden">
                    <div
                      className="h-full rounded-[3px] bg-brand transition-[width] duration-[600ms] ease-in-out"
                      style={{ width: `${sc}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-hint leading-[1.6] px-3 py-2.5 rounded-[10px] bg-bg-surface mt-1">
                ⓘ 점수는 해당 목적에 관련 성분의 함유량과 효능을 기반으로
                산출됩니다. 80점 이상은 해당 목적에 매우 적합합니다.
              </p>
            </div>
          )}

          {/* 피부타입별 */}
          {activeTab === "skintype" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {skinTypeScores.map(([label, sc]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-primary">{label}</span>
                      {label === d.skinType1 && (
                        <span className="text-[10px] px-2 py-[1px] rounded-[20px] bg-brand text-white font-semibold">
                          내 피부
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand">{sc}</span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-[#F0EDE8] overflow-hidden">
                    <div
                      className="h-full rounded-[3px] bg-brand transition-[width] duration-[600ms] ease-in-out"
                      style={{ width: `${sc}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 위로가기 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-24 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-[10px] border-none cursor-pointer z-20 transition-all active:scale-[0.93] shadow-[0_2px_12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]"
        >
          <ChevronUp size={20} color="#1A1A1A" />
        </button>
      )}
    </div>
  );
}
