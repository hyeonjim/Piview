"use client";

import { useState } from "react";
import { Heart, ChevronLeft, Package, Star } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SkinTypeBadge } from "@/components/common";
import { MOCK_PRODUCT, MOCK_PURPOSE_SCORES, MOCK_SKIN_TYPE_SCORES } from "@/constants/_mock/product";

export default function ProductDetailPage() {
  const [liked, setLiked] = useState(false);
  const [owned, setOwned] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-bg-base">
      <div className="sticky top-0 z-20 bg-bg-base flex items-center justify-between px-4 h-14">
        <Link href="/search" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-bg-surface">
          <ChevronLeft size={22} />
        </Link>
        <button onClick={() => setLiked((p) => !p)} className="w-9 h-9 flex items-center justify-center">
          <Heart size={22} className={liked ? "fill-red-400 text-red-400" : "text-text-muted"} />
        </button>
      </div>

      <div className="h-56 bg-bg-surface flex items-center justify-center mx-5 rounded-2xl">
        <span className="text-6xl">🧴</span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">{MOCK_PRODUCT.brand}</p>
              <h1 className="text-lg font-bold text-text-primary mt-0.5">{MOCK_PRODUCT.name}</h1>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              {MOCK_PRODUCT.skinTypes.map((t) => <SkinTypeBadge key={t} skinType={t} />)}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {MOCK_PRODUCT.effects.map((e) => (
              <span key={e} className="text-xs px-2.5 py-1 rounded-badge bg-bg-surface text-text-muted border border-border">{e}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{MOCK_PRODUCT.rating}</span>
            <span className="text-xs text-text-muted">({MOCK_PRODUCT.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOwned((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-badge border text-xs font-medium transition-all ${owned ? "border-brand bg-brand-pale text-brand" : "border-border text-text-secondary"}`}>
              <Package size={13} /> 보유
            </button>
            <button onClick={() => setLiked((p) => !p)}>
              <Heart size={18} className={liked ? "fill-red-400 text-red-400" : "text-text-muted"} />
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-xl font-bold text-text-primary">₩{MOCK_PRODUCT.price.toLocaleString()}</span>
          <span className="text-sm text-text-muted">{MOCK_PRODUCT.count}</span>
        </div>

        <div className="bg-brand-pale rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">나와의 매칭 점수</span>
          <span className="text-2xl font-bold text-brand">{MOCK_PRODUCT.matchScore}</span>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-ewg-safe/10 flex items-center justify-center">
                <span className="text-ewg-safe text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">EWG 성분 분석</p>
                <p className="text-xs text-text-muted">총 {MOCK_PRODUCT.ewg.total}개 성분</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">안전 비율</p>
              <p className="text-lg font-bold text-ewg-safe">{MOCK_PRODUCT.ewg.safePercent}%</p>
            </div>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
            <div className="bg-ewg-safe rounded-full" style={{ flex: MOCK_PRODUCT.ewg.safe }} />
            <div className="bg-ewg-caution rounded-full" style={{ flex: MOCK_PRODUCT.ewg.caution }} />
            {MOCK_PRODUCT.ewg.danger > 0 && <div className="bg-ewg-danger rounded-full" style={{ flex: MOCK_PRODUCT.ewg.danger }} />}
            <div className="bg-border rounded-full" style={{ flex: MOCK_PRODUCT.ewg.unknown }} />
          </div>
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { label: "1~2등급", sub: "안전",   count: MOCK_PRODUCT.ewg.safe,    color: "text-ewg-safe"    },
              { label: "3~6등급", sub: "보통",   count: MOCK_PRODUCT.ewg.caution, color: "text-ewg-caution" },
              { label: "7~10등급",sub: "주의",   count: MOCK_PRODUCT.ewg.danger,  color: "text-ewg-danger"  },
              { label: "등급 미정",sub: "정보없음",count: MOCK_PRODUCT.ewg.unknown, color: "text-text-muted"  },
            ].map((g) => (
              <div key={g.sub}>
                <p className="text-[10px] text-text-muted">{g.label}</p>
                <p className={`text-lg font-bold ${g.color}`}>{g.count}</p>
                <p className="text-[10px] text-text-muted">{g.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="purpose">
          <TabsList className="w-full bg-bg-surface rounded-xl h-10">
            <TabsTrigger value="ingredients" className="flex-1 text-xs rounded-lg">전성분 분석</TabsTrigger>
            <TabsTrigger value="purpose"     className="flex-1 text-xs rounded-lg">목적별 점수</TabsTrigger>
            <TabsTrigger value="skintype"    className="flex-1 text-xs rounded-lg">피부타입별</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-4">
            <p className="text-sm text-text-muted text-center py-8">전성분 분석 데이터를 불러오는 중...</p>
          </TabsContent>

          <TabsContent value="purpose" className="mt-4">
            <div className="flex flex-col gap-4">
              {MOCK_PURPOSE_SCORES.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text-primary">{p.label}</span>
                    <span className="text-sm font-semibold text-brand">{p.score}</span>
                  </div>
                  <Progress value={p.score} className="h-1.5 bg-border [&>div]:bg-brand" />
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4 p-3 bg-bg-surface rounded-xl leading-relaxed">
              ⓘ 점수는 해당 목적에 관련 성분의 함유량과 효능을 기반으로 산출됩니다. 80점 이상은 해당 목적에 매우 적합합니다.
            </p>
          </TabsContent>

          <TabsContent value="skintype" className="mt-4">
            <div className="flex flex-col gap-4">
              {MOCK_SKIN_TYPE_SCORES.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">{s.label}</span>
                      {s.isMyType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-badge bg-brand text-white font-medium">내 피부</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-brand">{s.score}</span>
                  </div>
                  <Progress value={s.score} className="h-1.5 bg-border [&>div]:bg-brand" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
