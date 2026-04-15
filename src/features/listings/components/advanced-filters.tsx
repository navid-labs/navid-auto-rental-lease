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

export function AdvancedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expanded, setExpanded] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState(searchParams.get("brand") ?? "");
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  // Current filter values from URL
  const remainingMin = searchParams.get("remainingMin") ?? "";
  const initialCostMax = searchParams.get("initialCostMax") ?? "";
  const yearMin = searchParams.get("yearMin") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const selectedTypes = searchParams.getAll("type");

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

  const activeFilterCount = [
    remainingMin,
    initialCostMax,
    yearMin,
    brandInput,
    selectedTypes.length > 0 ? "yes" : "",
    sort !== "newest" ? sort : "",
  ].filter(Boolean).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
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
          className="mt-3 rounded-xl border p-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{
            borderColor: "var(--chayong-border)",
            backgroundColor: "var(--chayong-surface)",
          }}
        >
          {/* Brand autocomplete */}
          <div className="relative">
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
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
              잔여기간
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REMAINING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ remainingMin: opt.value || null })}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: remainingMin === opt.value ? "var(--chayong-primary)" : "var(--chayong-border)",
                    backgroundColor: remainingMin === opt.value ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                    color: remainingMin === opt.value ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial cost */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
              초기비용 (최대)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_COST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ initialCostMax: opt.value || null })}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: initialCostMax === opt.value ? "var(--chayong-primary)" : "var(--chayong-border)",
                    backgroundColor: initialCostMax === opt.value ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                    color: initialCostMax === opt.value ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
              연식
            </label>
            <div className="flex flex-wrap gap-1.5">
              {YEAR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ yearMin: opt.value || null })}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: yearMin === opt.value ? "var(--chayong-primary)" : "var(--chayong-border)",
                    backgroundColor: yearMin === opt.value ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                    color: yearMin === opt.value ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
              매물 유형
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((opt) => {
                const active = selectedTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      borderColor: active ? "var(--chayong-primary)" : "var(--chayong-border)",
                      backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
                      color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div>
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
      )}
    </div>
  );
}
