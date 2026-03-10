"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

const AGE_GROUPS = [
  { id: "10s", label: "10대" },
  { id: "20s", label: "20대" },
  { id: "30s", label: "30대" },
  { id: "40s+", label: "40대 이상" },
];
const GENDER_OPTIONS = [
  { id: "female", icon: "👩", label: "여성" },
  { id: "male", icon: "👨", label: "남성" },
];
const SKIN_TYPES = [
  { id: "dry", icon: "💧", label: "건성" },
  { id: "oily", icon: "💦", label: "지성" },
  { id: "combination", icon: "🔀", label: "복합성" },
  { id: "sensitive", icon: "🌹", label: "민감성" },
];
const SKIN_CONCERNS = [
  "여드름/트러블",
  "건조함",
  "주름/탄력",
  "색소/잡티",
  "모공",
  "블랙헤드",
  "피지",
  "수분부족",
  "민감함",
  "칙칙함",
];
const ALLERGIES = [
  "향료",
  "알코올",
  "파라벤",
  "설페이트",
  "실리콘",
  "라놀린",
  "포름알데히드",
  "페녹시에탄올",
  "트리클로산",
  "옥시벤존",
];

export default function SelectPage() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<string>("female");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleConcern = (c: string) =>
    setSelectedConcerns((p) =>
      p.includes(c) ? p.filter((x) => x !== c) : [...p, c],
    );
  const toggleAllergy = (a: string) =>
    setSelectedAllergies((p) =>
      p.includes(a) ? p.filter((x) => x !== a) : [...p, a],
    );
  const isValid = selectedType !== null;
  const filteredAllergies = searchQuery
    ? ALLERGIES.filter((t) => t.includes(searchQuery))
    : ALLERGIES;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <button
          onClick={() => router.push("/skin-test")}
          className="p-2 -ml-2 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <span
          className="text-text-hint font-medium"
          style={{ fontSize: "15px" }}
        >
          2/3 단계
        </span>
      </div>

      <div className="px-6 mt-4">
        <h1
          className="text-text-primary font-semibold"
          style={{ fontSize: "24px" }}
        >
          피부 정보 입력
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* 성별 */}
        <div className="mt-6">
          <p
            className="text-text-primary font-semibold"
            style={{ fontSize: "15px" }}
          >
            성별
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {GENDER_OPTIONS.map((g) => {
              const isSelected = selectedGender === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGender(g.id)}
                  className="flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                  style={{
                    height: "80px",
                    borderRadius: "16px",
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
                  }}
                >
                  <span style={{ fontSize: "26px" }}>{g.icon}</span>
                  <span
                    className={
                      isSelected
                        ? "text-text-primary font-semibold"
                        : "text-text-sub"
                    }
                    style={{ fontSize: "15px" }}
                  >
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 연령대 */}
        <div className="mt-6">
          <p
            className="text-text-primary font-semibold"
            style={{ fontSize: "15px" }}
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
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
                    color: isSelected
                      ? "var(--color-text-primary)"
                      : "var(--color-text-sub)",
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
            style={{ fontSize: "15px" }}
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
                    height: "90px",
                    borderRadius: "16px",
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
                  }}
                >
                  <span style={{ fontSize: "26px" }}>{type.icon}</span>
                  <span
                    className={
                      isSelected
                        ? "text-text-primary font-semibold"
                        : "text-text-sub"
                    }
                    style={{ fontSize: "15px" }}
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
              style={{ fontSize: "15px" }}
            >
              피부 고민
            </p>
            <span className="text-text-hint" style={{ fontSize: "14px" }}>
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
                    height: "36px",
                    padding: "0 16px",
                    borderRadius: "30px",
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#E0E0E0"}`,
                    color: isSelected
                      ? "var(--color-text-primary)"
                      : "var(--color-text-sub)",
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
              style={{ fontSize: "15px" }}
            >
              알레르기 성분
            </p>
            <span className="text-text-hint" style={{ fontSize: "14px" }}>
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
              className="w-full outline-none bg-bg-chip text-text-primary"
              style={{
                height: "44px",
                paddingLeft: "38px",
                paddingRight: "16px",
                borderRadius: "10px",
                border: "none",
                fontSize: "15px",
              }}
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
                    height: "32px",
                    padding: "0 12px",
                    borderRadius: "16px",
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "var(--color-bg-chip)",
                    border: isSelected
                      ? "1.5px solid var(--color-brand)"
                      : "1.5px solid transparent",
                    color: isSelected
                      ? "var(--color-text-primary)"
                      : "var(--color-text-sub)",
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
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-6 pb-8 pt-4"
        style={{ background: "linear-gradient(transparent, white 30%)" }}
      >
        <button
          onClick={() =>
            isValid && router.push(`/skin-test/result?type=${selectedType}`)
          }
          className="w-full transition-all duration-200"
          style={{
            height: "52px",
            borderRadius: "32px",
            fontSize: "15px",
            fontWeight: 600,
            border: "none",
            backgroundColor: isValid
              ? "var(--color-brand)"
              : "var(--color-bg-chip)",
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
