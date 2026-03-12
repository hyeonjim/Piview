"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Camera, ClipboardList } from "lucide-react";
import Link from "next/link";
import {
  SETTINGS_SKIN_TYPES,
  SETTINGS_SKIN_CONCERNS,
  SETTINGS_ALLERGIES,
} from "@/constants/userSettings";
import {
  COLOR_BRAND,
  COLOR_BRAND_BG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_WARM,
  COLOR_PAGE_WARM,
} from "@/constants/colors";

const COLORS = {
  primary:      COLOR_BRAND,
  primaryBg:    COLOR_BRAND_BG,
  accentShadow: "rgba(162,170,123,0.2)",
  warmBg:       COLOR_PAGE_WARM,
  border:       "#F0F0F0",
  text:         COLOR_TEXT,
  textMuted:    COLOR_TEXT_MUTED,
  warm:         COLOR_WARM,
};

const chipBase: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "30px", fontSize: "14px", fontWeight: 500,
  cursor: "pointer", transition: "all 0.2s", border: "1px solid",
  userSelect: "none", display: "inline-flex", alignItems: "center", gap: "4px",
};

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 style={{ fontSize:"16px", fontWeight:600, color:"#1A1A1A", marginBottom:"6px", display:"flex", alignItems:"center", gap:"8px" }}>
      <span>{icon}</span>{title}
    </h3>
  );
}

function Divider() {
  return <div style={{ height:1, backgroundColor:COLORS.border, margin:"24px 0" }} />;
}

export default function SettingsPage() {
  const router = useRouter();

  // TODO: useUserStore에서 초기값 로드
  const [skinType,  setSkinType]  = useState<string>("");
  const [concerns,  setConcerns]  = useState<Set<string>>(new Set());
  const [allergies, setAllergies] = useState<Set<string>>(new Set());

  const toggleConcern = (label: string) => setConcerns((prev) => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });
  const toggleAllergy = (label: string) => setAllergies((prev) => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const handleSave = () => {
    // TODO: userService.saveDiagnosisResult() 호출
    router.back();
  };

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: COLORS.warmBg }}>

      {/* 헤더 */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center gap-3" style={{ backgroundColor: COLORS.warmBg }}>
        <button onClick={() => router.back()} className="flex items-center justify-center bg-white border-none cursor-pointer"
          style={{ width:30, height:30, borderRadius:"50%", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <ChevronLeft size={20} color={COLORS.text} />
        </button>
        <h2 style={{ fontSize:"18px", fontWeight:600, color:COLORS.text, letterSpacing:"0.5px" }}>피부 설정</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-[30px] pt-0 pb-0">

        {/* 피부타입 */}
        <div className="mt-5">
          <SectionTitle icon="🧴" title="나의 피부타입" />
          <p style={{ fontSize:"13px", color:COLORS.textMuted, marginBottom:"12px" }}>하나를 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_TYPES.map((st) => {
              const isActive = skinType === st.id;
              return (
                <button key={st.id} onClick={() => setSkinType(st.id)}
                  style={{ ...chipBase, backgroundColor:isActive?COLORS.primary:"white", color:isActive?"white":COLORS.text, borderColor:isActive?COLORS.primary:COLORS.border, boxShadow:isActive?`0 2px 8px ${COLORS.accentShadow}`:"none" }}>
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 피부고민 */}
        <div>
          <SectionTitle icon="💭" title="피부 고민" />
          <p style={{ fontSize:"13px", color:COLORS.textMuted, marginBottom:"12px" }}>해당하는 고민을 모두 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_CONCERNS.map((c) => {
              const isActive = concerns.has(c.label);
              return (
                <button key={c.id} onClick={() => toggleConcern(c.label)}
                  style={{ ...chipBase, backgroundColor:isActive?COLORS.primary:"white", color:isActive?"white":COLORS.text, borderColor:isActive?COLORS.primary:COLORS.border, boxShadow:isActive?`0 2px 8px ${COLORS.accentShadow}`:"none" }}>
                  {isActive && <Check size={14} />}{c.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 알러지 */}
        <div>
          <SectionTitle icon="⚠️" title="알러지 / 기피 성분" />
          <p style={{ fontSize:"13px", color:COLORS.textMuted, marginBottom:"12px" }}>피하고 싶은 성분을 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_ALLERGIES.map((a) => {
              const isActive = allergies.has(a.label);
              return (
                <button key={a.id} onClick={() => toggleAllergy(a.label)}
                  style={{ ...chipBase, backgroundColor:isActive?COLORS.warm:"white", color:isActive?"white":COLORS.text, borderColor:isActive?COLORS.warm:COLORS.border, boxShadow:isActive?"0 2px 8px rgba(194,140,126,0.25)":"none" }}>
                  {isActive && <Check size={14} />}{a.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 재진단 */}
        <div>
          <SectionTitle icon="🔄" title="피부 진단 다시하기" />
          <p style={{ fontSize:"13px", color:COLORS.textMuted, marginBottom:"16px" }}>AI 사진 분석이나 피부타입 퀴즈를 다시 진행할 수 있어요</p>
          <div className="flex flex-col gap-3">
            <Link href="/skin-test/camera">
              <button className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor:"white", border:`1px solid ${COLORS.border}`, borderRadius:"16px" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width:44, height:44, borderRadius:14, backgroundColor:"#E8F5E9" }}>
                  <Camera size={22} color="#4CAF50" />
                </div>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize:"14px", fontWeight:600, color:COLORS.text }}>AI 사진 분석</span>
                  <span style={{ fontSize:"13px", color:COLORS.textMuted, marginTop:2 }}>셀피를 촬영해 피부 상태를 분석해요</span>
                </div>
              </button>
            </Link>
            <Link href="/skin-test/quiz">
              <button className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor:"white", border:`1px solid ${COLORS.border}`, borderRadius:"16px" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width:44, height:44, borderRadius:14, backgroundColor:COLORS.primaryBg }}>
                  <ClipboardList size={22} color={COLORS.primary} />
                </div>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize:"14px", fontWeight:600, color:COLORS.text }}>피부타입 퀴즈</span>
                  <span style={{ fontSize:"13px", color:COLORS.textMuted, marginTop:2 }}>간단한 질문으로 피부타입을 알아봐요</span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div style={{ marginTop:"24px", marginBottom:"40px", display:"flex", justifyContent:"center" }}>
          <button onClick={handleSave}
            style={{ width:"200px", height:"44px", borderRadius:"30px", backgroundColor:COLORS.primary, color:"white", fontWeight:600, fontSize:"15px", border:"none", cursor:"pointer", boxShadow:`0 4px 16px ${COLORS.accentShadow}`, transition:"all 0.2s" }}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
