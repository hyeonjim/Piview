const CHOSUNG_LIST = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ",
  "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
];
const CHOSUNG_GROUPS: Record<string, string[]> = {
  "ㄱ":["ㄱ","ㄲ"], "ㄴ":["ㄴ"], "ㄷ":["ㄷ","ㄸ"], "ㄹ":["ㄹ"],
  "ㅁ":["ㅁ"], "ㅂ":["ㅂ","ㅃ"], "ㅅ":["ㅅ","ㅆ"], "ㅇ":["ㅇ"],
  "ㅈ":["ㅈ","ㅉ"], "ㅊ":["ㅊ"], "ㅋ":["ㅋ"], "ㅌ":["ㅌ"],
  "ㅍ":["ㅍ"], "ㅎ":["ㅎ"],
};
export const GROUP_ORDER = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

export function getChosung(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return CHOSUNG_LIST[Math.floor((code - 0xAC00) / 588)];
  return char.toUpperCase();
}
export function getGroupKey(brand: string): string {
  const first = getChosung(brand.charAt(0));
  for (const [group, members] of Object.entries(CHOSUNG_GROUPS)) {
    if (members.includes(first)) return group;
  }
  return "기타";
}
export function groupBrandsByChosung(brands: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  brands.forEach((brand) => {
    const key = getGroupKey(brand);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(brand);
  });
  return grouped;
}
