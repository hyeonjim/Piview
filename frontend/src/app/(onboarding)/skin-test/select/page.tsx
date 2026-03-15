"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const BACK_BTN_TEXT = { fontSize: "15px" };
const PAGE_TITLE_STYLE = {
  fontSize: "22px",
  letterSpacing: "-0.3px",
  lineHeight: 1.3,
};
const PAGE_DESC_STYLE = { fontSize: "14px" };
const SECTION_TITLE_STYLE = { fontSize: "15px" };
const GENDER_BTN_BASE = { height: "52px", borderRadius: "12px" };
const GENDER_ICON_STYLE = { fontSize: "22px" };
const AGE_BTN_BASE = { height: "42px", borderRadius: "10px" };
const SKIN_BTN_BASE = { height: "90px", borderRadius: "16px" };
const SKIN_ICON_STYLE = { fontSize: "26px" };
const CONCERN_HINT_STYLE = { fontSize: "14px" };
const CONCERN_BTN_BASE = {
  height: "36px",
  padding: "0 16px",
  borderRadius: "30px",
};
const ALLERGY_SECTION_TITLE = { fontSize: "15px" };
const ALLERGY_HINT_STYLE = { fontSize: "14px" };
const ALLERGY_INPUT_STYLE = {
  height: "44px",
  paddingLeft: "38px",
  paddingRight: "16px",
  borderRadius: "10px",
  fontSize: "15px",
};
const ALLERGY_CHIP_BASE = {
  height: "32px",
  padding: "0 12px",
  borderRadius: "16px",
};
const BOTTOM_BG_SELECT = "linear-gradient(transparent, white 30%)";
const CONFIRM_BTN_BASE = {
  height: "52px",
  borderRadius: "32px",
  fontSize: "15px",
};
const SKIN_TYPE_TEXT_BASE = { fontSize: "15px", lineHeight: 1.4 };

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import {
  AGE_GROUPS,
  GENDER_OPTIONS,
  SKIN_TYPES,
  SKIN_CONCERNS,
  ALLERGIES,
} from "@/constants";

export default function SelectPage() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<string>("women");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleConcern = (c: string) =>
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  const toggleAllergy = (a: string) =>
    setSelectedAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const isValid = selectedType !== null;
  const filteredAllergies = searchQuery
    ? ALLERGIES.filter((t) => t.includes(searchQuery))
    : ALLERGIES;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="px-6 pt-4 pb-28 overflow-y-auto">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push("/skin-test")}
          className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer mb-6 text-text-hint"
        >
          <ArrowLeft size={18} /> <span style={BACK_BTN_TEXT}>뒤로</span>
        </button>

        <h1 className="text-text-primary font-bold" style={PAGE_TITLE_STYLE}>
          피부 정보를
          <br />
          입력해주세요
        </h1>
        <p className="text-text-muted mt-2" style={PAGE_DESC_STYLE}>
          더 정확한 제품 추천을 위해 사용해요
        </p>

        {/* 성별 */}
        <div className="mt-6">
          <p
            className="text-text-primary font-semibold"
            style={SECTION_TITLE_STYLE}
          >
            성별
          </p>
          <div className="flex gap-3 mt-3">
            {GENDER_OPTIONS.map((g) => {
              const isSelected = selectedGender === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGender(g.id)}
                  className="flex-1 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                  style={{
                    ...GENDER_BTN_BASE,
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    fontSize: "16px",
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? "#1A1A1A" : "#616161",
                  }}
                >
                  <span style={GENDER_ICON_STYLE}>{g.icon}</span> {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 연령대 */}
        <div className="mt-6">
          <p
            className="text-text-primary font-semibold"
            style={SECTION_TITLE_STYLE}
          >
            연령대
          </p>
          <div className="flex gap-2 mt-3">
            {AGE_GROUPS.map((age) => {
              const isSelected = selectedAge === age.id;
              return (
                <button
                  key={age.id}
                  onClick={() => setSelectedAge(age.id)}
                  className="flex-1 transition-all duration-200 cursor-pointer"
                  style={{
                    ...AGE_BTN_BASE,
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontSize: "15px",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {age.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 피부 타입 */}
        <div className="mt-6">
          <p
            className="text-text-primary font-semibold"
            style={SECTION_TITLE_STYLE}
          >
            피부 타입
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SKIN_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                  style={{
                    ...SKIN_BTN_BASE,
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                  }}
                >
                  <span style={SKIN_ICON_STYLE}>{type.icon}</span>
                  <span
                    style={{
                      ...SKIN_TYPE_TEXT_BASE,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "#1A1A1A" : "#616161",
                    }}
                  >
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 피부 고민 */}
        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <p
              className="text-text-primary font-semibold"
              style={SECTION_TITLE_STYLE}
            >
              피부 고민
            </p>
            <span className="text-text-hint" style={CONCERN_HINT_STYLE}>
              복수 선택 가능
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = selectedConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className="transition-all duration-150 cursor-pointer"
                  style={{
                    ...CONCERN_BTN_BASE,
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#E0E0E0"}`,
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontSize: "14px",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {concern}
                </button>
              );
            })}
          </div>
        </div>

        {/* 알레르기 성분 */}
        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <p
              className="text-text-primary font-semibold"
              style={ALLERGY_SECTION_TITLE}
            >
              알레르기 성분
            </p>
            <span className="text-text-hint" style={ALLERGY_HINT_STYLE}>
              선택 사항
            </span>
          </div>
          <div className="relative mt-3">
            <Search
              size={16}
              className="text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="성분명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none bg-bg-chip border-none text-text-primary"
              style={ALLERGY_INPUT_STYLE}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {filteredAllergies.map((tag) => {
              const isSelected = selectedAllergies.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleAllergy(tag)}
                  className="transition-all duration-150 cursor-pointer"
                  style={{
                    ...ALLERGY_CHIP_BASE,
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#F5F5F5",
                    border: isSelected
                      ? "1.5px solid var(--color-brand)"
                      : "1.5px solid transparent",
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontSize: "14px",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pb-8 pt-4"
        style={{ background: BOTTOM_BG_SELECT }}
      >
        <button
          onClick={() =>
            isValid && router.push(`/skin-test/result?type=${selectedType}`)
          }
          className="w-full transition-all duration-200 border-none font-semibold"
          style={{
            height: "52px",
            borderRadius: "32px",
            fontSize: "15px",
            backgroundColor: isValid ? "var(--color-brand)" : "#F5F5F5",
            color: isValid ? "#FFFFFF" : "var(--color-text-disabled)",
            cursor: isValid ? "pointer" : "default",
            boxShadow: isValid ? "0px 2px 8px rgba(162,170,123,0.3)" : "none",
          }}
        >
          완료
        </button>
      </div>
    </div>
  );
}
