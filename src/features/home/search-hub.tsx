"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { buildListingUrl, type ListingFilters } from "@/lib/listings/filters";

interface Props {
  brands: string[];
}

const TYPES: Array<{ value: ListingFilters["type"]; label: string }> = [
  { value: "TRANSFER", label: "승계" },
  { value: "USED_LEASE", label: "중고리스" },
  { value: "USED_RENTAL", label: "중고렌트" },
];

const RANGES: Array<{ min?: number; max?: number; label: string }> = [
  { max: 30, label: "~30만" },
  { min: 30, max: 50, label: "30~50만" },
  { min: 50, label: "50만+" },
];

export function SearchHub({ brands }: Props) {
  const [type, setType] = useState<ListingFilters["type"]>();
  const [range, setRange] = useState<number>();
  const [brand, setBrand] = useState<string>();
  const [query, setQuery] = useState("");
  const visibleBrands = brands.slice(0, 6);

  const href = useMemo(() => {
    const r = range !== undefined ? RANGES[range] : undefined;
    return buildListingUrl({
      type,
      minPayment: r?.min,
      maxPayment: r?.max,
      brand,
      q: query.trim() || undefined,
    });
  }, [brand, query, range, type]);

  const selectionSummary = useMemo(() => {
    const items: string[] = [];
    const typeLabel = type ? TYPES.find((item) => item.value === type)?.label ?? "상품" : null;
    const rangeLabel = range !== undefined ? RANGES[range]?.label ?? "월납입금" : null;
    const brandLabel = brand ?? null;
    const queryLabel = query.trim() || null;

    if (typeLabel) items.push(typeLabel);
    if (rangeLabel) items.push(rangeLabel);
    if (brandLabel) items.push(brandLabel);
    if (queryLabel) items.push(queryLabel);

    return {
      items,
      text:
        items.length > 0
          ? `선택 조건: ${items.join(" · ")}`
          : "조건을 고르면 검색 전 요약을 바로 확인할 수 있습니다.",
    };
  }, [brand, query, range, type]);

  return (
    <section
      aria-label="빠른 조건 검색"
      className="overflow-hidden rounded-2xl border bg-[var(--chayong-bg)] shadow-md"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      <div className="border-b bg-[var(--chayong-surface)] px-5 py-6 text-center md:px-8 md:py-8" style={{ borderColor: "var(--chayong-divider)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--chayong-primary)" }}>
          빠른 조건 검색
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--chayong-text)] md:text-[28px]">
          어떤 차를 찾으세요?
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--chayong-text-sub)]">
          모델명, 상품 유형, 월납입 조건을 함께 고르면 매물 목록으로 바로 이어집니다.
        </p>

        <div className="mx-auto mt-5 flex max-w-3xl items-center rounded-xl border-2 bg-white" style={{ borderColor: "var(--chayong-text)" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="모델명이나 브랜드를 입력하세요"
            className="h-14 min-w-0 flex-1 rounded-l-xl bg-transparent px-4 text-sm outline-none md:px-5 md:text-[15px]"
            aria-label="모델명이나 브랜드 검색"
          />
          <Link
            href={href}
            aria-label="입력 조건으로 매물 검색"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-r-lg text-[var(--chayong-text)] transition-colors hover:bg-[var(--chayong-surface)]"
          >
            <Search size={20} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[var(--chayong-text)] md:text-xl">
              상품, 월납입, 브랜드를 한 번에 좁혀보세요
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-[var(--chayong-text-sub)]">
              선택한 조건은 아래에서 요약됩니다. 월납입 기준으로 먼저 좁힌 뒤 세부 조건을 비교하세요.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 md:max-w-[38ch] md:justify-end">
            {selectionSummary.items.length > 0 ? (
              selectionSummary.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-9 max-w-full items-center rounded-full border border-[var(--chayong-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--chayong-text)]"
                >
                  <span className="block max-w-full break-words">{item}</span>
                </span>
              ))
            ) : (
              <span className="inline-flex min-h-9 max-w-full items-center rounded-full border border-dashed border-[var(--chayong-border)] bg-white px-3 py-1.5 text-sm text-[var(--chayong-text-sub)]">
                선택 조건 요약
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ChipGroup label="상품">
            {TYPES.map((t) => (
              <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="월납입금">
            {RANGES.map((r, i) => (
              <Chip key={r.label} active={range === i} onClick={() => setRange(i)}>
                {r.label}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="브랜드">
            {visibleBrands.length > 0 ? (
              visibleBrands.map((b) => (
                <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>
                  {b}
                </Chip>
              ))
            ) : (
              <PillNote>브랜드 준비 중</PillNote>
            )}
          </ChipGroup>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--chayong-border)] bg-white/70 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--chayong-text-sub)]">
            <span className="font-medium text-[var(--chayong-text)]">현재 선택</span>
            <span className="min-w-0 break-words">{selectionSummary.text}</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-[var(--chayong-text-sub)]">
              조건을 고른 뒤 바로 결과를 확인하세요.
            </p>
            <div className="flex min-w-0 flex-col gap-2 md:items-end">
              <div className="flex max-w-full flex-wrap gap-2 md:justify-end">
                {selectionSummary.items.length > 0 ? (
                  selectionSummary.items.map((item) => (
                    <span
                      key={`cta-${item}`}
                      className="inline-flex max-w-full items-center rounded-full bg-[var(--chayong-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--chayong-primary)]"
                    >
                      <span className="block max-w-full break-words">{item}</span>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex max-w-full items-center rounded-full bg-[var(--chayong-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--chayong-primary)]">
                    조건을 고르면 더 빠르게 좁혀집니다
                  </span>
                )}
              </div>
              <Link
                href={href}
                aria-label="선택 조건으로 매물 검색"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-[var(--chayong-primary)] px-5 text-[15px] font-semibold text-white shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chayong-primary)] focus-visible:ring-offset-2"
              >
                매물 검색 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PillNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-[44px] max-w-full items-center rounded-full border border-dashed px-3 py-1.5 text-sm text-[var(--chayong-text-sub)]">
      {children}
    </span>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] max-w-full rounded-full border px-3 py-1.5 text-sm leading-tight transition ${
        active
          ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white shadow-sm"
          : "bg-white text-[var(--chayong-text)]"
      }`}
    >
      <span className="block max-w-full break-words text-center">{children}</span>
    </button>
  );
}
