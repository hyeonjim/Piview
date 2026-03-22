"use client";

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
  const [selectedGender, setSelectedGender] = useState<string>("WOMEN");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleConcern = (concern: string) =>
    setSelectedConcerns((previous) =>
      previous.includes(concern)
        ? previous.filter((item) => item !== concern)
        : [...previous, concern],
    );

  const toggleAllergy = (allergy: string) =>
    setSelectedAllergies((previous) =>
      previous.includes(allergy)
        ? previous.filter((item) => item !== allergy)
        : [...previous, allergy],
    );

  const isValid = selectedType !== null;
  const filteredAllergies = searchQuery
    ? ALLERGIES.filter((tag) => tag.includes(searchQuery))
    : ALLERGIES;

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push("/skin-test")}
          className="flex items-center gap-1.5 mb-6 text-text-hint bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        {/* 페이지 제목 */}
        <h1 className="text-text-primary font-bold text-[22px] leading-[1.3] tracking-[-0.3px]">
          피부 정보를
          <br />
          입력해주세요
        </h1>

        {/* 성별 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">성별</h2>
          <div className="flex gap-3 mt-3">
            {GENDER_OPTIONS.map((gender) => {
              const isSelected = selectedGender === gender.id;
              return (
                <button
                  key={gender.id}
                  onClick={() => setSelectedGender(gender.id)}
                  className="flex-1 h-[52px] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer text-[16px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    fontWeight: 800,
                    color: isSelected ? "#1A1A1A" : "#616161",
                  }}
                >
                  {gender.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 연령대 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">
            연령대
          </h2>
          <div className="flex gap-2 mt-3">
            {AGE_GROUPS.map((age) => {
              const isSelected = selectedAge === age.id;
              return (
                <button
                  key={age.id}
                  onClick={() => setSelectedAge(age.id)}
                  className="flex-1 h-[42px] rounded-[10px] transition-all duration-200 cursor-pointer text-[16px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontWeight: 800,
                  }}
                >
                  {age.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 피부 타입 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">
            피부 타입
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SKIN_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="h-[50px] rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer text-[16px] leading-[1.4]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    fontWeight: 800,
                    color: isSelected ? "#1A1A1A" : "#616161",
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 피부 고민 선택 */}
        <section className="mt-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-text-primary font-semibold text-[15px]">
              피부 고민
            </h2>
            <span className="text-text-hint text-[14px]">복수 선택 가능</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = selectedConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className="h-9 px-4 rounded-[30px] transition-all duration-150 cursor-pointer text-[14px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#FFFFFF",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#E0E0E0"}`,
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontWeight: 600,
                  }}
                >
                  {concern}
                </button>
              );
            })}
          </div>
        </section>

        {/* 알레르기 성분 선택 */}
        <section className="mt-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-text-primary font-semibold text-[15px]">
              알레르기 성분
            </h2>
            <span className="text-text-hint text-[14px]">선택 사항</span>
          </div>

          {/* 검색 입력창 */}
          <div className="relative mt-3">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="성분명 검색..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full h-11 pl-[38px] pr-4 rounded-[10px] bg-bg-chip border-none text-text-primary text-[15px] outline-none"
            />
          </div>

          {/* 알레르기 성분 태그 */}
          <div className="flex flex-wrap gap-2 mt-5">
            {filteredAllergies.map((tag) => {
              const isSelected = selectedAllergies.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleAllergy(tag)}
                  className="h-8 px-3 rounded-2xl transition-all duration-150 cursor-pointer text-[14px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "#F5F5F5",
                    border: isSelected
                      ? "1.5px solid var(--color-brand)"
                      : "1.5px solid transparent",
                    color: isSelected ? "#1A1A1A" : "#616161",
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* 하단 고정 버튼 영역 */}
      <div className="w-[250px] mx-auto px-6 pb-8 pt-4">
        <button
          onClick={() =>
            isValid && router.push(`/skin-test/result?type=${selectedType}`)
          }
          className="w-full h-[52px] rounded-[32px] font-bold text-[18px] transition-all duration-200 border-none"
          style={{
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
