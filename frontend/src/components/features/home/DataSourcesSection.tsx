"use client";

import { ExternalLink } from "lucide-react";

/**
 * 성분 분석에 참고한 데이터소스를 보여주는 섹션
 * 홈 화면 하단에 위치하며, 각 사이트의 역할을 간략히 표시
 */

// 참고 데이터소스 목록
const DATA_SOURCES = [
  {
    name: "EWG Skin Deep",
    description: "성분 안전 등급",
    url: "https://www.ewg.org/skindeep/",
    accent: "#6b9e6b",
  },
  {
    name: "Paula's Choice",
    description: "성분 효능 분석",
    url: "https://www.paulaschoice-eu.com/ingredient",
    accent: "#5a7a9e",
  },
  {
    name: "INCIDecoder",
    description: "성분 해석",
    url: "https://incidecoder.com/",
    accent: "#9e7a5a",
  },
  {
    name: "COOS",
    description: "화장품 성분, 원료",
    url: "https://coos.kr/",
    accent: "#8a6b9e",
  },
] as const;

export default function DataSourcesSection() {
  return (
    <div className="px-5 pt-7 pb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-7">
        <span className="text-[16px] font-bold text-[#52514d] tracking-[0.06em] uppercase [font-family:var(--font-english),serif]">
          Sourced by Websites
        </span>
      </div>

      {/* 메인 문구 */}
      <p className="text-[14px] font-semibold text-[#A69D92] leading-relaxed mb-4 tracking-[-0.3px]">
        4개의 사이트를 참고해 화장품 성분
        <br />
        데이터베이스를 분석합니다
      </p>

      {/* 데이터소스 그리드 — 2x2 */}
      <div className="grid grid-cols-2 gap-4 px-5">
        {DATA_SOURCES.map((source) => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#eee] transition-all duration-200 active:scale-[0.97] no-underline"
          >
            {/* 상단: 사이트명 + 외부링크 아이콘 */}
            <div className="flex items-start justify-between mb-2">
              <span
                className="text-[13px] font-bold tracking-[-0.2px]"
                style={{ color: source.accent }}
              >
                {source.name}
              </span>
              <ExternalLink
                size={11}
                className="text-[#D9D5D0] mt-0.5 group-hover:text-[#A69D92] transition-colors"
              />
            </div>

            {/* 하단: 역할 설명 */}
            <span className="text-[11px] font-medium text-[#A69D92]">
              {source.description}
            </span>

            {/* 좌측 상단 악센트 바 */}
            <div
              className="absolute top-0 left-3.5 w-5 h-[2px] rounded-b-full"
              style={{ backgroundColor: source.accent, opacity: 0.5 }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
