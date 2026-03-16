"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Leaf, ShoppingBag, Sparkles, LogOut } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import RoutineTab from "@/components/features/mypage/RoutineTab";
import RoutineAddModal from "@/components/features/mypage/RoutineAddModal";
import OwnedTab from "@/components/features/mypage/OwnedTab";
import AvoidProductModal from "@/components/features/mypage/AvoidProductModal";
import {
  useLocalRoutineStore,
  type LocalProduct,
} from "@/stores/useLocalRoutineStore";
import { useUserStore } from "@/stores/useUserStore";
import { authService } from "@/services/auth";
import type { SearchProduct } from "@/constants/_mock/searchProducts";

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"routine" | "owned">("routine");

  /**
   * 로그아웃 핸들러
   * ⚠️ API 연동 시 authService.logout() 주석 해제 → 백엔드가 httpOnly 쿠키 만료 처리
   */
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

  const { routine, setStepProduct } = useLocalRoutineStore();

  // 페이지 마운트 시 localStorage에서 루틴 복구
  useEffect(() => {
    useLocalRoutineStore.persist.rehydrate();
  }, []);

  // 루틴 추가 모달 상태
  const [openStep, setOpenStep] = useState<string | null>(null);

  // 모달 열릴 때 body 스크롤 차단 — BottomNav가 z-50이라 모달이 뒤로 숨는 문제 방지
  useEffect(() => {
    document.body.style.overflow = openStep ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openStep]);

  const { toastMessage, showToast } = useToast();

  const handleAddToRoutine = (product: LocalProduct) => {
    setStepProduct(openStep!, product);
    showToast(`✓ ${product.name} 루틴에 추가됨!`);
    setOpenStep(null);
  };

  const handleRemoveFromRoutine = (code: string) => setStepProduct(code, null);

  // 보유제품 / 피해야 할 제품 상태
  // ⚠️ API 연동 시 useRoutineStore 또는 서버 상태로 교체
  const [ownedProducts, setOwnedProducts] = useState<SearchProduct[]>([]);
  const [avoidProducts, setAvoidProducts] = useState<SearchProduct[]>([]);
  const [openAvoidModal, setOpenAvoidModal] = useState(false);
  const [avoidSearch, setAvoidSearch] = useState("");

  const handleToggleAvoid = (product: SearchProduct) => {
    setAvoidProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product],
    );
  };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#F5F2EC" }}>

      {/* ── 프로필 헤더 — 연한 베이지 그라디언트 배경 ── */}
      <div
        style={{
          background: "linear-gradient(160deg, #EDE8E0 0%, #F5F2EC 100%)",
          padding: "52px 20px 20px",
          position: "relative",
          borderBottom: "1px solid #E2DDD8",
        }}
      >
        {/* 상단 액션 버튼들 */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Link href="/mypage/settings">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "rgba(166,157,146,0.12)",
                border: "1px solid rgba(166,157,146,0.2)",
                cursor: "pointer",
              }}
              aria-label="설정"
            >
              <Settings size={15} style={{ color: "#8C8277" }} />
            </button>
          </Link>
          {/* 로그아웃 버튼 — ⚠️ API 연동 시 authService.logout() 활성화 */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "#BFB6AA",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 2px",
              fontFamily: "var(--font-pretendard), sans-serif",
            }}
          >
            <LogOut size={13} />
            로그아웃
          </button>
        </div>

        {/* 아바타 + 정보 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* 아바타 */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #D9D5D0 0%, #BFB6AA 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #F2EFE9",
              boxShadow: "0 2px 12px rgba(166,157,146,0.25)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#FFFFFF",
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              U
            </span>
          </div>

          {/* 유저 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ⚠️ API 연동 시 useUserStore에서 실제 이름으로 교체 */}
            <p
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#2A2118",
                letterSpacing: "-0.3px",
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              User님
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "13px",
                color: "#A69D92",
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              피부 타입을 진단해보세요
            </p>
          </div>
        </div>


        {/* 피부 진단 CTA 버튼 */}
        <button
          onClick={() => router.push("/skin-test")}
          style={{
            marginTop: "14px",
            width: "100%",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #A69D92 0%, #BFB6AA 100%)",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.2px",
            fontFamily: "var(--font-pretendard), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: "0 2px 12px rgba(166,157,146,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          <Sparkles size={15} />
          피부 진단 시작하기
        </button>
      </div>

      {/* ── 탭 스위처 — 언더라인 스타일 ── */}
      <div
        style={{
          backgroundColor: "#F5F2EC",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #E2DDD8",
          display: "flex",
          gap: "0",
        }}
      >
        {(["routine", "owned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              paddingTop: "12px",
              paddingBottom: "11px",
              fontSize: "14px",
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#2A2118" : "#BFB6AA",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #A69D92" : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s",
              fontFamily: "var(--font-pretendard), sans-serif",
              marginBottom: "-1px", // 하단 보더와 겹침
            }}
          >
            {t === "routine" ? (
              <>
                <Leaf size={14} />
                내 루틴
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                보유제품
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {tab === "routine" && (
        <RoutineTab
          routine={routine}
          onOpenModal={(code) => setOpenStep(code)}
          onRemove={handleRemoveFromRoutine}
        />
      )}
      {tab === "owned" && (
        <OwnedTab
          routine={routine}
          ownedProducts={ownedProducts}
          avoidProducts={avoidProducts}
          onRemoveOwned={(id) =>
            setOwnedProducts((prev) => prev.filter((p) => p.id !== id))
          }
          onRemoveAvoid={(id) =>
            setAvoidProducts((prev) => prev.filter((p) => p.id !== id))
          }
          onOpenAvoidModal={() => {
            setOpenAvoidModal(true);
            setAvoidSearch("");
          }}
        />
      )}

      <Toast msg={toastMessage} />

      {/* 루틴 스텝별 제품 추가 모달 */}
      {openStep && (
        <RoutineAddModal
          openStep={openStep}
          routine={routine}
          onClose={() => setOpenStep(null)}
          onAdd={handleAddToRoutine}
        />
      )}

      {/* 피해야 할 제품 추가 모달 */}
      {openAvoidModal && (
        <AvoidProductModal
          avoidProducts={avoidProducts}
          avoidSearch={avoidSearch}
          onSearchChange={setAvoidSearch}
          onClose={() => setOpenAvoidModal(false)}
          onToggle={handleToggleAvoid}
        />
      )}
    </div>
  );
}
