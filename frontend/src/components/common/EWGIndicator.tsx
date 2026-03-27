// src/components/common/EWGIndicator.tsx
// EWG 성분 안전도 시각화 — 바 + 텍스트 두 가지 variant
import { cn } from "@/lib/utils";

interface EWGIndicatorProps {
  safe: number;
  caution: number;
  danger: number;
  /** 등급 미정 성분 수 (detail variant 전용) */
  unknown?: number;
  /** bar(기본, 카드용) | detail(상세 페이지 EWG 섹션용) */
  variant?: "bar" | "detail";
  className?: string;
}

export default function EWGIndicator({
  safe,
  caution,
  danger,
  unknown = 0,
  variant = "bar",
  className,
}: EWGIndicatorProps) {
  const total = safe + caution + danger || 1;

  if (variant === "detail") {
    const totalCount = safe + caution + danger + unknown;
    const grades = [
      { label: "1~2등급", sub: "안전", count: safe, color: "var(--color-ewg-safe)" },
      { label: "3~6등급", sub: "보통", count: caution, color: "var(--color-ewg-caution)" },
      { label: "7~10등급", sub: "주의", count: danger, color: "var(--color-ewg-danger)" },
      { label: "등급 미정", sub: "정보없음", count: unknown, color: "#BDBDBD" },
    ];

    return (
      <div className={cn("", className)}>
        {/* 헤더 */}
        <div className="mb-3">
          <p className="text-[15px] font-semibold text-[#58514b]">EWG 성분 분석</p>
          <p className="text-[12px] text-[#a69d92] mt-0.5">총 {totalCount}개 성분</p>
        </div>
        {/* 비율 바 — flex값이 동적이라 style 사용 */}
        <div className="flex h-3 gap-0.5 rounded-full overflow-hidden mb-3">
          <div className="rounded bg-ewg-safe" style={{ flex: safe }} />
          <div className="rounded bg-ewg-caution" style={{ flex: caution }} />
          {danger > 0 && (
            <div className="rounded bg-ewg-danger" style={{ flex: danger }} />
          )}
          <div className="rounded bg-[#E0E0E0]" style={{ flex: unknown }} />
        </div>
        {/* 등급별 집계 그리드 */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {grades.map((grade) => (
            <div key={grade.sub}>
              <p className="text-[13px] text-[#58544e] mb-0.5">• {grade.label}</p>
              {/* color가 CSS 변수라 style 사용 */}
              <p className="text-[16px] font-bold" style={{ color: grade.color }}>
                {grade.count}
              </p>
              <p className="text-[14px] text-[#524d47] mt-0.5">{grade.sub}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // bar (카드용 compact)
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {safe > 0 && (
          <div className="bg-ewg-safe" style={{ flex: safe / total }} />
        )}
        {caution > 0 && (
          <div className="bg-ewg-caution" style={{ flex: caution / total }} />
        )}
        {danger > 0 && (
          <div className="bg-ewg-danger" style={{ flex: danger / total }} />
        )}
      </div>
      <p className="text-[10px] text-text-muted">
        안전 {safe} · 주의 {caution} · 위험 {danger}
      </p>
    </div>
  );
}
