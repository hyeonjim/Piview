"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Sparkles, LogOut } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast, useSyncRoutineDraft, useMyCosQuery, useRemoveMyCos } from "@/hooks";
import RoutineTab from "@/components/features/mypage/RoutineTab";
import RoutineAddModal from "@/components/features/mypage/RoutineAddModal";
import OwnedTab from "@/components/features/mypage/OwnedTab";
import AvoidProductModal from "@/components/features/mypage/AvoidProductModal";
import { useLocalRoutineStore, type LocalProduct } from "@/stores/useLocalRoutineStore";
import { useUserStore, selectSkinType } from "@/stores/useUserStore";
import { authService } from "@/services/auth";
import type { OwnedProduct } from "@/stores/useOwnedStore";

import { fromSkinTypeEnum } from "@/utils/enumConvert";

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"routine" | "owned">("routine");

  const savedSkinType = useUserStore(selectSkinType);
  const savedConcerns = useUserStore((s) => s.concerns);
  const savedAvoidContents = useUserStore((s) => s.avoidContents);
  const hasSkinProfile = !!savedSkinType;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      useUserStore.getState().clearUser();
      useLocalRoutineStore.getState().clearRoutine();
      localStorage.removeItem("piview-routine");
      router.push("/splash");
    }
  };

  const { routine, addStepProduct, removeStepProduct } = useLocalRoutineStore();

  useEffect(() => {
    useLocalRoutineStore.persist.rehydrate();
  }, []);

  const [openStep, setOpenStep] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = openStep ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openStep]);

  const { toastMessage, showToast } = useToast();

  useSyncRoutineDraft();

  const handleAddToRoutine = (product: LocalProduct) => {
    addStepProduct(openStep!, product);
    showToast(`✓ ${product.name} 루틴에 추가됨!`);
    setOpenStep(null);
  };

  const handleRemoveFromRoutine = (code: string, productId: string) =>
    removeStepProduct(code, productId);

  // ── 보유제품 API 연동 ─────────────────────────────────────────
  const { data: myCosItems = [], isLoading: myCosLoading } = useMyCosQuery();
  const { mutate: removeMyCos } = useRemoveMyCos();

  // MyCosItem → OwnedProduct 변환 (OwnedTab props 호환)
  const ownedProducts: OwnedProduct[] = myCosItems.map((item) => ({
    id: String(item.id),
    brand: item.brand,
    name: item.productName,
    category: item.category,
    skinTypes: [
      item.topSkinType ? fromSkinTypeEnum(item.topSkinType) : null,
      item.top2SkinType ? fromSkinTypeEnum(item.top2SkinType) : null,
    ].filter(Boolean) as string[],
  }));

  const handleRemoveOwned = (id: string) => {
    const myCosId = Number(id);
    if (!isNaN(myCosId)) removeMyCos(myCosId);
  };

  // ── 기피 제품 — ⚠️ API 연동 시 서버 상태로 교체 ──────────────
  const [avoidProducts, setAvoidProducts] = useState<OwnedProduct[]>([]);
  const [openAvoidModal, setOpenAvoidModal] = useState(false);
  const [avoidSearch, setAvoidSearch] = useState("");

  const handleToggleAvoid = (product: OwnedProduct) => {
    setAvoidProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product],
    );
  };

  return (
    <div className="flex-1" style={{ backgroundColor: "#F5F2EC" }}>

      {/* 프로필 헤더 */}
      <div style={{ background: "linear-gradient(160deg, #EDE8E0 0%, #F5F2EC 100%)", padding: "15px 20px 20px", position: "relative", borderBottom: "1px solid #E2DDD8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #D9D5D0 0%, #BFB6AA 100%)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #F2EFE9", boxShadow: "0 2px 12px rgba(166,157,146,0.25)", flexShrink: 0 }}>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-pretendard), sans-serif" }}>U</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* ⚠️ /users/me 연동 후 실제 이름으로 교체 */}
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#2A2118", letterSpacing: "-0.3px", fontFamily: "var(--font-pretendard), sans-serif" }}>User님</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <Link href="/mypage/settings">
                  <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(166,157,146,0.12)", border: "1px solid rgba(166,157,146,0.2)", cursor: "pointer" }} aria-label="설정">
                    <Settings size={15} style={{ color: "#8C8277" }} />
                  </button>
                </Link>
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#BFB6AA", background: "none", border: "none", cursor: "pointer", padding: "4px 2px", fontFamily: "var(--font-pretendard), sans-serif" }}>
                  <LogOut size={13} />로그아웃
                </button>
              </div>
            </div>
            {!hasSkinProfile ? (
              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#A69D92", fontFamily: "var(--font-pretendard), sans-serif" }}>피부 타입을 진단해보세요</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "16px" }}>
                <span style={{ fontSize: "14px", padding: "2px 8px", borderRadius: "20px", backgroundColor: "#E8E3DC", color: "#5A504A", fontWeight: 600, fontFamily: "var(--font-pretendard), sans-serif" }}>{savedSkinType}</span>
                {savedConcerns.map((concern, index) => (
                  <span key={`${concern}-${index}`} style={{ fontSize: "14px", padding: "2px 8px", borderRadius: "20px", backgroundColor: "#EEF0E8", color: "#6B7257", fontFamily: "var(--font-pretendard), sans-serif" }}>{concern}</span>
                ))}
                {savedAvoidContents.map((item, index) => (
                  <span key={`${item.avoidContent}-${index}`} style={{ fontSize: "14px", padding: "2px 8px", borderRadius: "20px", backgroundColor: "#F5EDE8", color: "#8C5A4A", fontFamily: "var(--font-pretendard), sans-serif" }}>{item.avoidContent}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!hasSkinProfile && (
          <button onClick={() => router.push("/skin-test")} style={{ marginTop: "14px", width: "50%", marginLeft: "auto", marginRight: "auto", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #A69D92 0%, #BFB6AA 100%)", color: "#FFFFFF", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer", letterSpacing: "-0.2px", fontFamily: "var(--font-pretendard), sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 12px rgba(166,157,146,0.3)", transition: "opacity 0.15s" }}>
            피부 진단 시작하기
          </button>
        )}
      </div>

      {/* 탭 스위처 */}
      <div style={{ backgroundColor: "#F5F2EC", padding: "0 20px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #E2DDD8", display: "flex" }}>
        {(["routine", "owned"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, paddingTop: "12px", paddingBottom: "11px", fontSize: "16px", fontWeight: tab === t ? 600 : 400, color: tab === t ? "#2A2118" : "#BFB6AA", background: "none", border: "none", borderBottom: tab === t ? "2px solid #A69D92" : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.15s", fontFamily: "var(--font-pretendard), sans-serif", marginBottom: "-1px" }}>
            {t === "routine" ? <>내 루틴</> : <>보유제품</>}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "routine" && (
        <RoutineTab routine={routine} onOpenModal={(code) => setOpenStep(code)} onRemove={handleRemoveFromRoutine} showToast={showToast} />
      )}
      {tab === "owned" && (
        myCosLoading ? (
          <div className="flex justify-center py-20" style={{ color: "#A69D92", fontSize: "14px" }}>불러오는 중...</div>
        ) : (
          <OwnedTab
            routine={routine}
            ownedProducts={ownedProducts}
            avoidProducts={avoidProducts}
            onRemoveOwned={handleRemoveOwned}
            onRemoveAvoid={(id) => setAvoidProducts((prev) => prev.filter((p) => p.id !== id))}
            onOpenAvoidModal={() => { setOpenAvoidModal(true); setAvoidSearch(""); }}
          />
        )
      )}

      <Toast msg={toastMessage} />

      {openStep && (
        <RoutineAddModal openStep={openStep} routine={routine} onClose={() => setOpenStep(null)} onAdd={handleAddToRoutine} />
      )}
      {openAvoidModal && (
        <AvoidProductModal avoidProducts={avoidProducts} avoidSearch={avoidSearch} onSearchChange={setAvoidSearch} onClose={() => setOpenAvoidModal(false)} onToggle={handleToggleAvoid} />
      )}
    </div>
  );
}
