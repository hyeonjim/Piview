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
import { useUserStore, selectSkinType } from "@/stores/useUserStore";
import { useOwnedStore } from "@/stores/useOwnedStore";
import { authService } from "@/services/auth";
import type { SearchProduct } from "@/constants/_mock/searchProducts";

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"routine" | "owned">("routine");

  // 피부 설정 store 값 — 저장 후 프로필 영역에 태그로 표시
  const savedSkinType = useUserStore(selectSkinType);
  const savedConcerns = useUserStore((s) => s.concerns);
  const savedAvoidContents = useUserStore((s) => s.avoidContents);
  // skinType이 있으면 진단 완료 상태로 판단
  const hasSkinProfile = !!savedSkinType;

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

  // 보유제품 — 전역 store로 검색/추천 페이지와 공유
  const { ownedProducts, removeOwned } = useOwnedStore();
  // 피해야 할 제품 — ⚠️ API 연동 시 서버 상태로 교체
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
    <div className="flex-1" style={{ backgroundColor: "#F5F2EC" }}>

      {/* ── 프로필 헤더 — 연한 베이지 그라디언트 배경 ── */}
      <div
        style={{
          background: "linear-gradient(160deg, #EDE8E0 0%, #F5F2EC 100%)",
          padding: "15px 20px 20px",
          position: "relative",
          borderBottom: "1px solid #E2DDD8",
        }}
      >
        {/* 아바타 + 정보 + 액션 버튼 */}
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
            {/* User님 + 액션 버튼 한 줄 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* ⚠️ API 연동 시 useUserStore에서 실제 이름으로 교체 */}
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#2A2118",
                  letterSpacing: "-0.3px",
                  fontFamily: "var(--font-pretendard), sans-serif",
                }}
              >
                User님
              </p>

              {/* 액션 버튼들 — 설정 / 로그아웃 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
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
            </div>
            {/* 피부 설정 미완료 시 안내 문구, 완료 시 태그 표시 */}
            {!hasSkinProfile ? (
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
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "16px" }}>
                {/* 피부타입 태그 */}
                <span
                  style={{
                    fontSize: "14px",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    backgroundColor: "#E8E3DC",
                    color: "#5A504A",
                    fontWeight: 600,
                    fontFamily: "var(--font-pretendard), sans-serif",
                  }}
                >
                  {savedSkinType}
                </span>
                {/* 피부 고민 태그 */}
                {savedConcerns.map((concern) => (
                  <span
                    key={concern}
                    style={{
                      fontSize: "14px",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      backgroundColor: "#EEF0E8",
                      color: "#6B7257",
                      fontFamily: "var(--font-pretendard), sans-serif",
                    }}
                  >
                    {concern}
                  </span>
                ))}
                {/* 기피 성분 태그 */}
                {savedAvoidContents.map((item) => (
                  <span
                    key={item.avoidContent}
                    style={{
                      fontSize: "14px",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      backgroundColor: "#F5EDE8",
                      color: "#8C5A4A",
                      fontFamily: "var(--font-pretendard), sans-serif",
                    }}
                  >
                    {item.avoidContent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* 피부 설정 미완료 시에만 CTA 버튼 표시 */}
        {!hasSkinProfile && (
          <button
            onClick={() => router.push("/skin-test")}
            style={{
              marginTop: "14px",
              width: "50%",
              marginLeft: "auto",
              marginRight: "auto",
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
        )}
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
              fontSize: "16px",
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
          onRemoveOwned={removeOwned}
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
