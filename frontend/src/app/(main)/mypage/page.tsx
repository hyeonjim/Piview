"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Leaf, Package } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Button from "@/components/common/Button";
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
    <div className="flex flex-col min-h-full bg-bg-base">
      {/* 프로필 */}
      <div className="px-5 pt-5 pb-4 bg-bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 bg-bg-surface border border-border">
            <AvatarFallback className="text-text-muted font-semibold text-lg bg-bg-surface">
              F
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-text-primary">User</p>
            <p className="text-xs text-text-muted mt-0.5">
              피부 타입을 진단해보세요
            </p>
          </div>
          <Link
            href="/mypage/settings"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border"
          >
            <Settings size={16} className="text-text-muted" />
          </Link>
          {/* 로그아웃 버튼 — ⚠️ API 연동 시 authService.logout() 활성화 */}
          <button
            onClick={handleLogout}
            className="text-xs text-text-muted border-none bg-transparent cursor-pointer px-2 py-1"
          >
            로그아웃
          </button>
        </div>

        <Button
          variant="primary"
          fullWidth
          size="md"
          className="mt-4"
          onClick={() => router.push("/skin-test")}
        >
          피부 진단 시작하기
        </Button>

        {/* 탭 전환 */}
        <div className="flex mt-3 bg-bg-surface rounded-xl p-1">
          {(["routine", "owned"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-bg-card text-text-primary shadow-sm"
                  : "text-text-muted"
              }`}
            >
              {t === "routine" ? (
                <>
                  <Leaf size={14} /> 내 루틴
                </>
              ) : (
                <>
                  <Package size={14} /> 보유제품
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 루틴 탭 */}
      {tab === "routine" && (
        <RoutineTab
          routine={routine}
          onOpenModal={(code) => setOpenStep(code)}
          onRemove={handleRemoveFromRoutine}
        />
      )}

      {/* 보유제품 탭 */}
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
