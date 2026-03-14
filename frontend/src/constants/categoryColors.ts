export const CATEGORY_COLORS: Record<string, { bg: string; border: string; accent: string; chip: string }> = {
  "스킨/토너":       { bg: "#F0F4F1", border: "#C5D4C8", accent: "#4A6B52", chip: "#DDE8DF" },
  "로션/에멀젼":     { bg: "#F7F5F0", border: "#DDD6C8", accent: "#8A7B64", chip: "#EDE8DC" },
  "에센스/앰플/세럼":{ bg: "#F5F3EE", border: "#D9D2C4", accent: "#7A6F5C", chip: "#EAE5DA" },
  "크림":            { bg: "#F3F5F0", border: "#CDD6BE", accent: "#5E6E48", chip: "#E2E9D4" },
  "페이스오일":      { bg: "#F6F4EF", border: "#DDD4C2", accent: "#8B7A5A", chip: "#EDE6D8" },
  "미스트":          { bg: "#F0F3F5", border: "#C8D4DC", accent: "#5A6E78", chip: "#DCE4EA" },
  "패드":            { bg: "#F4F2EE", border: "#D6CFC2", accent: "#7D7060", chip: "#E9E3D8" },
  "폼/젤/밤/오일":  { bg: "#F5F7F0", border: "#D4DCBE", accent: "#6B7A4E", chip: "#E8EDDC" },
  "선크림/스틱":     { bg: "#F8F6F0", border: "#E0D8C4", accent: "#8B7D5E", chip: "#F0EBD8" },
  "세럼/에센스":     { bg: "#F5F3EE", border: "#D9D2C4", accent: "#7A6F5C", chip: "#EAE5DA" },
  "클렌저":          { bg: "#F5F7F0", border: "#D4DCBE", accent: "#6B7A4E", chip: "#E8EDDC" },
  "클렌징폼":        { bg: "#F5F7F0", border: "#D4DCBE", accent: "#6B7A4E", chip: "#E8EDDC" },
  "클렌징젤":        { bg: "#F0F5F2", border: "#C8D8CC", accent: "#4E7A60", chip: "#DCE9E1" },
  "클렌징밤":        { bg: "#F6F4EF", border: "#DDD4C2", accent: "#8B7A5A", chip: "#EDE6D8" },
  "클렌징오일":      { bg: "#F8F6F0", border: "#E0D8C4", accent: "#8B7D5E", chip: "#F0EBD8" },
  "클렌징워터":      { bg: "#F0F3F5", border: "#C8D4DC", accent: "#5A6E78", chip: "#DCE4EA" },
  "클렌징로션":      { bg: "#F7F5F0", border: "#DDD6C8", accent: "#8A7B64", chip: "#EDE8DC" },
  "로션/에멀젼":     { bg: "#F7F5F0", border: "#DDD6C8", accent: "#8A7B64", chip: "#EDE8DC" },
  "선스틱":          { bg: "#F8F6F0", border: "#E0D8C4", accent: "#8B7D5E", chip: "#F0EBD8" },
  "선크림/스틱":     { bg: "#F8F6F0", border: "#E0D8C4", accent: "#8B7D5E", chip: "#F0EBD8" },
  "토너":            { bg: "#F0F4F1", border: "#C5D4C8", accent: "#4A6B52", chip: "#DDE8DF" },
  "세럼":            { bg: "#F5F3EE", border: "#D9D2C4", accent: "#7A6F5C", chip: "#EAE5DA" },
  "선크림":          { bg: "#F8F6F0", border: "#E0D8C4", accent: "#8B7D5E", chip: "#F0EBD8" },
};

export const SKIN_FUNCTION_COLORS: Record<string, { accent: string; chip: string }> = {
  "아토피":     { accent: "#7B6E8A", chip: "#EDE8F2" },
  "여드름":     { accent: "#8A6E6E", chip: "#F2E8E8" },
  "미백":       { accent: "#8A8460", chip: "#F2F0E0" },
  "색소침착":   { accent: "#7A6F5C", chip: "#EAE5DA" },
  "안티에이징": { accent: "#6E7A5A", chip: "#E4EAD8" },
  "피지":       { accent: "#6E8A7A", chip: "#E0F0E8" },
  "블랙헤드":   { accent: "#5A6E78", chip: "#DCE4EA" },
  "수분":       { accent: "#5A7A8A", chip: "#D8E8F0" },
  "영양":       { accent: "#8A7A5A", chip: "#F0E8D8" },
  "진정":       { accent: "#4A6B52", chip: "#DDE8DF" },
};

export const SKIN_FUNCTIONS = [
  "아토피","여드름","미백","색소침착","안티에이징","피지","블랙헤드","수분","영양","진정"
] as const;

export const SKIN_TYPE_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  "건성":   { bg: "#E8F0F8", text: "#3A6B9F" },
  "지성":   { bg: "#FFF3E0", text: "#C27A1E" },
  "복합성": { bg: "#F3E8F9", text: "#7B3FA0" },
  "수부지": { bg: "#EDE9FE", text: "#5B21B6" },
  "모든피부":{ bg: "#E8F4EC", text: "#3D7A52" },
};

export const SKIN_TYPE_LABELS_FOR_FILTER = ["건성","지성","복합성","수부지"] as const;

// ── EWG 등급 색상 ──────────────────────────────────────────────────────────
export function getEwgColor(grade: number | null | undefined): { bg: string; text: string; barColor: string } {
  if (grade == null) return { bg: "#F5F5F5",  text: "#9E9E9E", barColor: "#E0E0E0" };
  if (grade <= 2)    return { bg: "#E8F5E9",  text: "#2E7D32", barColor: "#4CAF50" };
  if (grade <= 6)    return { bg: "#FFF8E1",  text: "#F57F17", barColor: "#FFB300" };
  return               { bg: "#FFEBEE",  text: "#C62828", barColor: "#F44336" };
}
