"use client";

import { useRouter } from "next/navigation";
import { buildListingUrl, type ListingFilters } from "@/lib/listings/filters";
import { SortSelect } from "./sort-select";

interface Props {
  count: number;
  filters: ListingFilters;
}

export function ResultMeta({ count, filters }: Props) {
  const router = useRouter();

  const chips: Array<{
    key: keyof ListingFilters;
    label: string;
    next: Partial<ListingFilters>;
  }> = [];

  if (filters.type) chips.push({ key: "type", label: filters.type, next: { type: undefined } });
  if (filters.brand) chips.push({ key: "brand", label: filters.brand, next: { brand: undefined } });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel, next: { fuel: undefined } });
  if (filters.trans) chips.push({ key: "trans", label: filters.trans, next: { trans: undefined } });
  if (filters.accidentMax !== undefined)
    chips.push({
      key: "accidentMax",
      label: filters.accidentMax === 0 ? "무사고" : `사고 ${filters.accidentMax}회 이하`,
      next: { accidentMax: undefined },
    });

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
          총{" "}
          <span className="tabular-nums" style={{ color: "var(--chayong-primary)" }}>
            {count.toLocaleString("ko-KR")}
          </span>
          개 매물
        </p>
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              router.push(buildListingUrl({ ...filters, ...c.next, page: 1 }))
            }
            className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors hover:border-[var(--chayong-primary)] hover:text-[var(--chayong-primary)]"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-sub)",
            }}
          >
            {c.label}
            <span aria-hidden="true">&times;</span>
          </button>
        ))}
      </div>
      <SortSelect />
    </div>
  );
}
