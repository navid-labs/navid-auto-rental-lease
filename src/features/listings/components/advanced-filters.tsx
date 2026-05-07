"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

const REMAINING_OPTIONS = [
  { label: "전체", value: "" },
  { label: "6개월~", value: "6" },
  { label: "12개월~", value: "12" },
  { label: "24개월~", value: "24" },
  { label: "36개월~", value: "36" },
];

const INITIAL_COST_OPTIONS = [
  { label: "전체", value: "" },
  { label: "없음 (0원)", value: "0" },
  { label: "~100만원", value: "1000000" },
  { label: "~300만원", value: "3000000" },
  { label: "~500만원", value: "5000000" },
];

const YEAR_OPTIONS = [
  { label: "전체", value: "" },
  { label: "2020년~", value: "2020" },
  { label: "2021년~", value: "2021" },
  { label: "2022년~", value: "2022" },
  { label: "2023년~", value: "2023" },
  { label: "2024년~", value: "2024" },
];

const TYPE_OPTIONS = [
  { label: "승계", value: "TRANSFER" },
  { label: "중고리스", value: "USED_LEASE" },
  { label: "중고렌트", value: "USED_RENTAL" },
];

const SORT_OPTIONS = [
  { label: "최신순", value: "newest" },
  { label: "월납입금 낮은순", value: "price_asc" },
  { label: "월납입금 높은순", value: "price_desc" },
  { label: "연식 최신순", value: "year_desc" },
  { label: "주행거리 적은순", value: "mileage_asc" },
];

function getOptionLabel(options: { label: string; value: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function AdvancedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expanded, setExpanded] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const brand = searchParams.get("brand") ?? "";
  const [brandInput, setBrandInput] = useState(brand);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  // Current filter values from URL
  const remainingMin = searchParams.get("remainingMin") ?? "";
  const initialCostMax = searchParams.get("initialCostMax") ?? "";
  const yearMin = searchParams.get("yearMin") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const selectedTypes = searchParams.getAll("type");

  useEffect(() => {
    setBrandInput(brand);
  }, [brand]);

  useEffect(() => {
    fetch("/api/listings/brands")
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((data) => setBrands(data.brands ?? []))
      .catch(() => {});
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // reset pagination on filter change

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          for (const v of value) params.append(key, v);
        } else {
          params.set(key, value);
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function toggleType(typeValue: string) {
    const next = selectedTypes.includes(typeValue)
      ? selectedTypes.filter((t) => t !== typeValue)
      : [...selectedTypes, typeValue];
    updateParams({ type: next });
  }

  function handleBrandSelect(brand: string) {
    setBrandInput(brand);
    setShowBrandSuggestions(false);
    updateParams({ brand });
  }

  function handleBrandInputChange(value: string) {
    setBrandInput(value);
    setShowBrandSuggestions(value.length > 0);
    if (value === "") updateParams({ brand: null });
  }

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(brandInput.toLowerCase())
  );

  const activeSummaryItems = [
    brand ? `제조사 ${brand}` : null,
    remainingMin ? `잔여기간 ${getOptionLabel(REMAINING_OPTIONS, remainingMin)}` : null,
    initialCostMax ? `초기비용 ${getOptionLabel(INITIAL_COST_OPTIONS, initialCostMax)}` : null,
    yearMin ? `연식 ${getOptionLabel(YEAR_OPTIONS, yearMin)}` : null,
    selectedTypes.length > 0
      ? `매물 유형 ${selectedTypes.map((value) => getOptionLabel(TYPE_OPTIONS, value)).join(" · ")}`
      : null,
    sort !== "newest" ? `정렬 ${getOptionLabel(SORT_OPTIONS, sort)}` : null,
  ].filter((item): item is string => Boolean(item));

  const activeFilterCount = [
    brand,
    remainingMin,
    initialCostMax,
    yearMin,
    selectedTypes.length > 0 ? "yes" : "",
    sort !== "newest" ? sort : "",
  ].filter(Boolean).length;

  function clearAllFilters() {
    setBrandInput("");
    setShowBrandSuggestions(false);
    updateParams({
      brand: null,
      remainingMin: null,
      initialCostMax: null,
      yearMin: null,
      type: null,
      sort: null,
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--chayong-surface)]"
        style={{
          borderColor: activeFilterCount > 0 ? "var(--chayong-primary)" : "var(--chayong-border)",
          color: activeFilterCount > 0 ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
          backgroundColor: activeFilterCount > 0 ? "var(--chayong-primary-light)" : undefined,
        }}
      >
        <SlidersHorizontal size={15} />
        상세필터
        {activeFilterCount > 0 && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            {activeFilterCount}
          </span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div
          className="mt-3 overflow-hidden rounded-xl border"
          style={{
            borderColor: "var(--chayong-border)",
            backgroundColor: "var(--chayong-surface)",
          }}
        >
          <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4 md:max-h-none md:overflow-visible">
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--chayong-border)",
                backgroundColor: "var(--chayong-bg)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--chayong-text-sub)" }}>
                    활성 조건
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--chayong-text)" }}>
                    {activeFilterCount > 0
                      ? `현재 ${activeFilterCount}개 조건 적용 중`
                      : "적용된 조건 없음"}
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--chayong-primary-light)",
                      color: "var(--chayong-primary)",
                    }}
                  >
                    {activeFilterCount} 적용
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {activeSummaryItems.length > 0 ? (
                  activeSummaryItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex max-w-full shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap"
                      style={{
                        borderColor: "var(--chayong-border)",
                        backgroundColor: "var(--chayong-surface)",
                        color: "var(--chayong-text)",
                      }}
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
                    적용된 조건이 여기에 표시됩니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Brand autocomplete */}
              <div className="relative min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  제조사
                </label>
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => handleBrandInputChange(e.target.value)}
                  onFocus={() => brandInput.length > 0 && setShowBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 150)}
                  placeholder="예: 현대, 기아, BMW"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                  style={{
                    borderColor: "var(--chayong-border)",
                    backgroundColor: "var(--chayong-bg)",
                    color: "var(--chayong-text)",
                  }}
                />
                {showBrandSuggestions && filteredBrands.length > 0 && (
                  <ul
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border shadow-md"
                    style={{
                      backgroundColor: "var(--chayong-bg)",
                      borderColor: "var(--chayong-border)",
                    }}
                  >
                    {filteredBrands.slice(0, 6).map((b) => (
                      <li key={b}>
                        <button
                          type="button"
                          onMouseDown={() => handleBrandSelect(b)}
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--chayong-surface)]"
                          style={{ color: "var(--chayong-text)" }}
                        >
                          {b}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Remaining months */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  잔여기간
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {REMAINING_OPTIONS.map((opt) => {
                    const active = remainingMin === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateParams({ remainingMin: opt.value || null })}
                        className="rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: active ? "var(--chayong-primary)" : "var(--chayong-border)",
                          backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                          color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                          boxShadow: active ? "0 0 0 1px var(--chayong-primary)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial cost */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  초기비용 (최대)
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {INITIAL_COST_OPTIONS.map((opt) => {
                    const active = initialCostMax === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateParams({ initialCostMax: opt.value || null })}
                        className="rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: active ? "var(--chayong-primary)" : "var(--chayong-border)",
                          backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                          color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                          boxShadow: active ? "0 0 0 1px var(--chayong-primary)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  연식
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {YEAR_OPTIONS.map((opt) => {
                    const active = yearMin === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateParams({ yearMin: opt.value || null })}
                        className="rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: active ? "var(--chayong-primary)" : "var(--chayong-border)",
                          backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                          color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                          boxShadow: active ? "0 0 0 1px var(--chayong-primary)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Listing type */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  매물 유형
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {TYPE_OPTIONS.map((opt) => {
                    const active = selectedTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleType(opt.value)}
                        className="rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors"
                        style={{
                          borderColor: active ? "var(--chayong-primary)" : "var(--chayong-border)",
                          backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                          color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                          boxShadow: active ? "0 0 0 1px var(--chayong-primary)" : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
                  정렬
                </label>
                <select
                  value={sort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                  style={{
                    borderColor: "var(--chayong-border)",
                    backgroundColor: "var(--chayong-bg)",
                    color: "var(--chayong-text)",
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className="sticky bottom-0 mt-4 border-t pt-3 md:static md:border-0 md:pt-4"
              style={{
                borderColor: "var(--chayong-border)",
                backgroundColor: "var(--chayong-surface)",
              }}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--chayong-bg)]"
                  style={{
                    borderColor: "var(--chayong-border)",
                    color: "var(--chayong-text-sub)",
                  }}
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--chayong-primary)",
                    color: "white",
                  }}
                >
                  적용 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
