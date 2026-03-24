export const CATEGORY_COLORS: Record<
  string,
  { bg: string; border: string; accent: string; chip: string }
> = {
  "스킨/토너": {
    bg: "#F0F4F1",
    border: "#C5D4C8",
    accent: "#4A6B52",
    chip: "#DDE8DF",
  },
  "로션/에멀젼": {
    bg: "#F7F5F0",
    border: "#DDD6C8",
    accent: "var(--color-text-warm)",
    chip: "#EDE8DC",
  },
  "에센스/앰플/세럼": {
    bg: "#F5F3EE",
    border: "#D9D2C4",
    accent: "#7A6F5C",
    chip: "#EAE5DA",
  },
  크림: {
    bg: "#F3F5F0",
    border: "#CDD6BE",
    accent: "#5E6E48",
    chip: "#E2E9D4",
  },
  페이스오일: {
    bg: "#F6F4EF",
    border: "#DDD4C2",
    accent: "#8B7A5A",
    chip: "#EDE6D8",
  },
  미스트: {
    bg: "#F0F3F5",
    border: "#C8D4DC",
    accent: "#5A6E78",
    chip: "#DCE4EA",
  },
  패드: {
    bg: "#F4F2EE",
    border: "#D6CFC2",
    accent: "#7D7060",
    chip: "#E9E3D8",
  },
  "폼/젤/밤/오일": {
    bg: "#F5F7F0",
    border: "#D4DCBE",
    accent: "#6B7A4E",
    chip: "#E8EDDC",
  },
  "선크림/스틱": {
    bg: "#F8F6F0",
    border: "#E0D8C4",
    accent: "#8B7D5E",
    chip: "#F0EBD8",
  },
  "세럼/에센스": {
    bg: "#F5F3EE",
    border: "#D9D2C4",
    accent: "#7A6F5C",
    chip: "#EAE5DA",
  },
  클렌저: {
    bg: "#F5F7F0",
    border: "#D4DCBE",
    accent: "#6B7A4E",
    chip: "#E8EDDC",
  },
  클렌징폼: {
    bg: "#F5F7F0",
    border: "#D4DCBE",
    accent: "#6B7A4E",
    chip: "#E8EDDC",
  },
  클렌징젤: {
    bg: "#F0F5F2",
    border: "#C8D8CC",
    accent: "#4E7A60",
    chip: "#DCE9E1",
  },
  클렌징밤: {
    bg: "#F6F4EF",
    border: "#DDD4C2",
    accent: "#8B7A5A",
    chip: "#EDE6D8",
  },
  클렌징오일: {
    bg: "#F8F6F0",
    border: "#E0D8C4",
    accent: "#8B7D5E",
    chip: "#F0EBD8",
  },
  클렌징워터: {
    bg: "#F0F3F5",
    border: "#C8D4DC",
    accent: "#5A6E78",
    chip: "#DCE4EA",
  },
  클렌징로션: {
    bg: "#F7F5F0",
    border: "#DDD6C8",
    accent: "var(--color-text-warm)",
    chip: "#EDE8DC",
  },
  선스틱: {
    bg: "#F8F6F0",
    border: "#E0D8C4",
    accent: "#8B7D5E",
    chip: "#F0EBD8",
  },
  토너: {
    bg: "#F0F4F1",
    border: "#C5D4C8",
    accent: "#4A6B52",
    chip: "#DDE8DF",
  },
  세럼: {
    bg: "#F5F3EE",
    border: "#D9D2C4",
    accent: "#7A6F5C",
    chip: "#EAE5DA",
  },
  선크림: {
    bg: "#F8F6F0",
    border: "#E0D8C4",
    accent: "#8B7D5E",
    chip: "#F0EBD8",
  },
};

/* 피부 기능 태그 — 베이지 팔레트와 조화되는 웜 뮤트 계열 */
export const SKIN_FUNCTION_COLORS: Record<
  string,
  { accent: string; chip: string }
> = {
  아토피: { accent: "#8A7A6E", chip: "#EEE8E4" }, // 웜 타우프
  여드름: { accent: "#8A6A6A", chip: "#F2E8E8" }, // 더스티 로즈
  미백: { accent: "#8A8460", chip: "#F2F0E0" },   // 웜 올리브 (유지)
  색소침착: { accent: "#7A6F5C", chip: "#EAE5DA" }, // 타우프 (이미 베이지 계열)
  안티에이징: { accent: "#7A7458", chip: "#ECEADA" }, // 웜 샌드
  피지: { accent: "#7A8A78", chip: "#E4EEE2" },   // 뮤트 세이지
  블랙헤드: { accent: "#7A7872", chip: "#E8E6E2" }, // 웜 그레이
  수분: { accent: "#7A8A8A", chip: "#E2ECEC" },   // 뮤트 틸 (베이지와 조화)
  영양: { accent: "#8A7A5A", chip: "#F0E8D8" },   // 웜 카라멜 (유지)
  진정: { accent: "#7A8A72", chip: "#E4EAE0" },   // 뮤트 그린
};

export const SKIN_FUNCTIONS = [
  "아토피",
  "여드름",
  "미백",
  "색소침착",
  "안티에이징",
  "피지",
  "블랙헤드",
  "수분",
  "영양",
  "진정",
] as const;

/* 피부 타입 태그 — 베이지 팔레트에 어울리는 웜톤 계열 */
export const SKIN_TYPE_TAG_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  건성: { bg: "#F5EDE8", text: "#9B6A54" }, // 따뜻한 테라코타
  지성: { bg: "#F7F2E2", text: "#9A7C45" }, // 웜 골든
  복합성: { bg: "#F2EDEA", text: "#8A6E60" }, // 웜 타우프
  수부지: { bg: "#F5EAEC", text: "#9B606A" }, // 더스티 로즈
  모든피부: { bg: "#EEF0E8", text: "#6E7A60" }, // 웜 세이지
};

export const SKIN_TYPE_LABELS_FOR_FILTER = [
  "건성",
  "지성",
  "복합성",
  "수부지",
] as const;
