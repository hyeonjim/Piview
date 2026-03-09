"use client";

import { useState } from "react";
import {
  Heart,
  ArrowLeft,
  Package,
  ShieldCheck,
  Shield,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

/* ── 색상 토큰 (피그마 ProductDetailPage 원본) ── */
const C = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  accentTint: "#F8F9F3",
  text: "#1A1A1A",
  textSub: "#616161",
  textMuted: "#9E9E9E",
  border: "#F0F0F0",
};

/* ── 피부타입별 태그 색상 (피그마 원본) ── */
const SKIN_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  건성: { bg: "#E8F0F8", text: "#3A6B9F" },
  지성: { bg: "#FFF3E0", text: "#C27A1E" },
  복합성: { bg: "#F3E8F9", text: "#7B3FA0" },
  민감성: { bg: "#FDEAEA", text: "#C0392B" },
  수부지: { bg: "#E8F4EC", text: "#3D7A52" },
  모든피부: { bg: "#E8F4EC", text: "#3D7A52" },
};

/* ── 기능별 태그 색상 (피그마 원본) ── */
const PURPOSE_COLORS: Record<string, { bg: string; text: string }> = {
  보습: { bg: "#DBEAFE", text: "#1D4ED8" },
  진정: { bg: "#D1FAE5", text: "#065F46" },
  미백: { bg: "#FEF9C3", text: "#854D0E" },
  항산화: { bg: "#FFEDD5", text: "#C2410C" },
  각질케어: { bg: "#EDE9FE", text: "#5B21B6" },
  모공관리: { bg: "#CCFBF1", text: "#0F766E" },
  세정: { bg: "#F0F9FF", text: "#0369A1" },
  항균: { bg: "#ECFDF5", text: "#059669" },
  여드름: { bg: "#FDEAEA", text: "#C0392B" },
  주름개선: { bg: "#FCE7F3", text: "#9D174D" },
  안티에이징: { bg: "#FCE7F3", text: "#9D174D" },
};

const PRODUCT = {
  id: 1,
  name: "119 스마트 시카 패드",
  brand: "클라랩",
  price: 28000,
  count: "60ea",
  rating: 4.6,
  reviewCount: 1240,
  skinTypes: ["지성", "복합성"],
  effects: ["여드름", "안티에이징", "진정"],
  matchScore: 87,
  ewg: {
    total: 63,
    safe: 51,
    caution: 3,
    danger: 0,
    unknown: 9,
    safePercent: 94,
  },
};

const PURPOSE_SCORES = [
  { label: "보습", score: 72 },
  { label: "미백", score: 45 },
  { label: "진정", score: 88 },
  { label: "각질케어", score: 61 },
  { label: "항산화", score: 34 },
  { label: "모공관리", score: 55 },
];

const SKIN_TYPE_SCORES = [
  { label: "건성", score: 62, isMyType: true },
  { label: "지성", score: 91 },
  { label: "복합성", score: 85 },
  { label: "수부지", score: 70 },
];

function getScoreColor(score: number) {
  if (score >= 80) return "#2E7D32";
  if (score >= 60) return "#F57F17";
  return "#C62828";
}

export default function ProductDetailPage() {
  const [liked, setLiked] = useState(false);
  const [owned, setOwned] = useState(false);

  const { ewg } = PRODUCT;

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* ── 상단 네비 ── */}
      <div
        className="sticky top-0 z-20 bg-white flex items-center justify-between px-4 h-14"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <Link
          href="/search"
          className="p-2"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={22} color={C.text} />
        </Link>
        <button
          onClick={() => setLiked((p) => !p)}
          className="p-2"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <Heart
            size={22}
            color={liked ? "#FF4081" : C.textMuted}
            fill={liked ? "#FF4081" : "none"}
          />
        </button>
      </div>

      {/* ── 제품 이미지 (피그마: 300×250, bg white, borderRadius 0) ── */}
      <div
        className="flex items-center justify-center mx-auto"
        style={{
          width: "300px",
          height: "250px",
          backgroundColor: "#FFFFFF",
          fontSize: "100px",
        }}
      >
        🧴
      </div>

      <div className="px-5 pb-6 flex flex-col gap-4">
        {/* ── 브랜드 + 제품명 + 태그 ── */}
        <div>
          {/* 브랜드명 (피그마: 12px #616161 fontWeight 500) */}
          <p
            style={{
              fontSize: "12px",
              color: C.textSub,
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            {PRODUCT.brand}
          </p>

          <div className="flex items-start justify-between gap-2">
            {/* 제품명 (피그마: 19px fontWeight 600) */}
            <p
              className="flex-1 min-w-0"
              style={{
                fontSize: "19px",
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.3,
              }}
            >
              {PRODUCT.name}
            </p>
            {/* 피부타입 태그 (피그마 원본 색상) */}
            <div
              className="flex gap-1 shrink-0 flex-wrap justify-end"
              style={{ marginTop: "4px" }}
            >
              {PRODUCT.skinTypes.map((t) => {
                const c = SKIN_TAG_COLORS[t] ?? {
                  bg: "#F5F5F5",
                  text: "#757575",
                };
                return (
                  <span
                    key={t}
                    style={{
                      fontSize: "11px",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: c.bg,
                      color: c.text,
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 기능 태그 (피그마 원본 색상) */}
          <div className="flex flex-wrap gap-1" style={{ marginTop: "8px" }}>
            {PRODUCT.effects.map((e) => {
              const c = PURPOSE_COLORS[e] ?? { bg: "#F5F5F5", text: "#757575" };
              return (
                <span
                  key={e}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: c.bg,
                    color: c.text,
                    fontWeight: 500,
                  }}
                >
                  {e}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── 가격 + 보유/찜 버튼 ── */}
        <div className="flex items-center justify-between">
          {/* 가격 (피그마: 20px fontWeight 600) */}
          <span style={{ fontSize: "20px", fontWeight: 600, color: C.text }}>
            ₩{PRODUCT.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {/* 보유 버튼 (피그마: borderRadius 20px, active bg #A2AA7B text white) */}
            <button
              onClick={() => setOwned((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                height: "34px",
                padding: "0 14px",
                borderRadius: "20px",
                backgroundColor: owned ? C.primary : "#F5F5F5",
                color: owned ? "#FFFFFF" : "#757575",
                fontSize: "12px",
                fontWeight: 600,
                border: owned ? "none" : `1px solid ${C.border}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Package size={13} /> 보유
            </button>
            <button
              onClick={() => setLiked((p) => !p)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
              }}
            >
              <Heart
                size={18}
                color={liked ? "#FF4081" : C.textMuted}
                fill={liked ? "#FF4081" : "none"}
              />
            </button>
          </div>
        </div>

        {/* ── 매칭 점수 (피그마: borderRadius 14px, bg accentTint) ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderRadius: "14px",
            backgroundColor: C.accentTint,
            border: `1px solid ${C.primary}20`,
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>
            나와의 매칭 점수
          </span>
          {/* 피그마: 28px fontWeight 700 */}
          <span style={{ fontSize: "28px", fontWeight: 700, color: C.primary }}>
            {PRODUCT.matchScore}
          </span>
        </div>

        {/* ── EWG 성분 분석 (피그마: borderRadius 16px, bg white, border #F0F0F0) ── */}
        <div
          style={{
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* 피그마: 28×28 borderRadius 8px */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor:
                      ewg.safePercent >= 70
                        ? "#E8F5E9"
                        : ewg.safePercent >= 40
                          ? "#FFF8E1"
                          : "#FFEBEE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck
                    size={16}
                    color={
                      ewg.safePercent >= 70
                        ? "#2E7D32"
                        : ewg.safePercent >= 40
                          ? "#F57F17"
                          : "#C62828"
                    }
                  />
                </div>
                <div>
                  <p
                    style={{ fontSize: "14px", fontWeight: 700, color: C.text }}
                  >
                    EWG 성분 분석
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: C.textMuted,
                      marginTop: "1px",
                    }}
                  >
                    총 {ewg.total}개 성분
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span style={{ fontSize: "11px", color: C.textMuted }}>
                  안전 비율
                </span>
                {/* 피그마: 22px fontWeight 800 */}
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    lineHeight: 1,
                    color:
                      ewg.safePercent >= 70
                        ? "#2E7D32"
                        : ewg.safePercent >= 40
                          ? "#F57F17"
                          : "#C62828",
                  }}
                >
                  {ewg.safePercent}
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>%</span>
                </p>
              </div>
            </div>

            {/* EWG 바 */}
            <div
              className="flex w-full rounded-full overflow-hidden"
              style={{
                height: "10px",
                backgroundColor: C.border,
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#4CAF50",
                  width: `${(ewg.safe / ewg.total) * 100}%`,
                  transition: "width 0.5s",
                }}
              />
              <div
                style={{
                  backgroundColor: "#FFB300",
                  width: `${(ewg.caution / ewg.total) * 100}%`,
                  transition: "width 0.5s",
                }}
              />
              {ewg.danger > 0 && (
                <div
                  style={{
                    backgroundColor: "#F44336",
                    width: `${(ewg.danger / ewg.total) * 100}%`,
                  }}
                />
              )}
              <div
                style={{
                  backgroundColor: "#E0E0E0",
                  width: `${(ewg.unknown / ewg.total) * 100}%`,
                }}
              />
            </div>

            {/* EWG 수치 4칸 */}
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                {
                  label: "1~2등급",
                  sub: "안전",
                  count: ewg.safe,
                  bg: "#F8FFF8",
                  color: "#2E7D32",
                  dot: "#4CAF50",
                },
                {
                  label: "3~6등급",
                  sub: "보통",
                  count: ewg.caution,
                  bg: "#FFFDF5",
                  color: "#F57F17",
                  dot: "#FFB300",
                },
                {
                  label: "7~10등급",
                  sub: "주의",
                  count: ewg.danger,
                  bg: "#FFF8F8",
                  color: "#C62828",
                  dot: "#F44336",
                },
                {
                  label: "등급미정",
                  sub: "정보없음",
                  count: ewg.unknown,
                  bg: "#F5F5F5",
                  color: "#9E9E9E",
                  dot: "#E0E0E0",
                },
              ].map((g) => (
                <div
                  key={g.sub}
                  className="flex flex-col items-center gap-1 py-2"
                  style={{ backgroundColor: g.bg, borderRadius: "8px" }}
                >
                  <div className="flex items-center gap-1">
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: g.dot,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: C.textSub,
                        fontWeight: 500,
                      }}
                    >
                      {g.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: g.color,
                    }}
                  >
                    {g.count}
                  </span>
                  <span style={{ fontSize: "10px", color: C.textMuted }}>
                    {g.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 탭 섹션 ── */}
        <Tabs defaultValue="purpose">
          <TabsList className="w-full bg-bg-surface rounded-xl h-10">
            <TabsTrigger
              value="ingredients"
              className="flex-1 text-xs rounded-lg"
            >
              전성분 분석
            </TabsTrigger>
            <TabsTrigger value="purpose" className="flex-1 text-xs rounded-lg">
              목적별 점수
            </TabsTrigger>
            <TabsTrigger value="skintype" className="flex-1 text-xs rounded-lg">
              피부타입별
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-4">
            <p
              style={{
                fontSize: "14px",
                color: C.textMuted,
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              전성분 분석 데이터를 불러오는 중...
            </p>
          </TabsContent>

          <TabsContent value="purpose" className="mt-4">
            <div className="flex flex-col gap-4">
              {PURPOSE_SCORES.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: "14px", color: C.text }}>
                      {p.label}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: getScoreColor(p.score),
                      }}
                    >
                      {p.score}
                    </span>
                  </div>
                  <Progress
                    value={p.score}
                    className="h-1.5 bg-border [&>div]:bg-brand"
                  />
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: "12px",
                color: C.textMuted,
                marginTop: "16px",
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: "#F8F9F3",
                lineHeight: 1.6,
              }}
            >
              ⓘ 점수는 해당 목적에 관련 성분의 함유량과 효능을 기반으로
              산출됩니다. 80점 이상은 해당 목적에 매우 적합합니다.
            </p>
          </TabsContent>

          <TabsContent value="skintype" className="mt-4">
            <div className="flex flex-col gap-4">
              {SKIN_TYPE_SCORES.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "14px", color: C.text }}>
                        {s.label}
                      </span>
                      {s.isMyType && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "1px 7px",
                            borderRadius: "10px",
                            backgroundColor: C.primary,
                            color: "#FFFFFF",
                            fontWeight: 600,
                          }}
                        >
                          내 피부
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: getScoreColor(s.score),
                      }}
                    >
                      {s.score}
                    </span>
                  </div>
                  <Progress
                    value={s.score}
                    className="h-1.5 bg-border [&>div]:bg-brand"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
