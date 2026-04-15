"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
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

  const href = useMemo(() => {
    const r = range !== undefined ? RANGES[range] : undefined;
    return buildListingUrl({ type, minPayment: r?.min, maxPayment: r?.max, brand });
  }, [type, range, brand]);

  return (
    <section
      aria-label="매물 빠른 검색"
      className="rounded-2xl border bg-[var(--chayong-bg)] p-4 md:p-6"
      style={{ borderColor: "var(--chayong-border)" }}
    >
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
          {brands.slice(0, 6).map((b) => (
            <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>
              {b}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <Link
        href={href}
        className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[var(--chayong-primary)] font-semibold text-white"
      >
        매물 검색 →
      </Link>
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
    <div>
      <p
        className="mb-2 text-xs font-semibold"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
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
      className={`rounded-full border px-3 py-1.5 text-sm transition min-h-[44px] ${
        active
          ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white"
          : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}
