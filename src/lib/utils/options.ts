const KNOWN_CATEGORIES = new Set([
  "헤드램프",
  "사이드미러",
  "휠타이어",
  "시트",
  "룸미러",
  "스티어링휠",
  "파킹",
  "에어백",
  "주행안전",
  "주차보조",
  "에어컨",
  "유무선단자",
  "오디오",
  "내비게이션",
  "엔진",
  "변속기",
]);

const BASIC_OPTIONS = new Set([
  "기본형-컴포트",
  "듀얼선루프",
  "드라이브와이즈",
  "모니터링팩",
  "스타일",
]);

export function groupOptionsByCategory(options: string[]): Record<string, string[]> {
  return options.reduce<Record<string, string[]>>((groups, option) => {
    const rawOption = option;
    const normalized = rawOption.trim();

    if (normalized.length === 0) {
      return groups;
    }

    const firstSpaceIndex = normalized.indexOf(" ");

    if (firstSpaceIndex === -1) {
      const category = BASIC_OPTIONS.has(normalized) ? "기본" : "기타";
      groups[category] = [...(groups[category] ?? []), category === "기타" ? rawOption : normalized];
      return groups;
    }

    const category = normalized.slice(0, firstSpaceIndex);
    const label = normalized.slice(firstSpaceIndex + 1).trim();

    if (!KNOWN_CATEGORIES.has(category) || label.length === 0) {
      groups["기타"] = [...(groups["기타"] ?? []), rawOption];
      return groups;
    }

    groups[category] = [...(groups[category] ?? []), label];
    return groups;
  }, {});
}
