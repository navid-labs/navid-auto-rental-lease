"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildListingUrl } from "@/lib/listings/filters";
import type { ListingTypeFilter, ListingSort } from "@/lib/listings/filters";

const TABS: Array<{ value: ListingTypeFilter | undefined; label: string }> = [
  { value: undefined, label: "전체" },
  { value: "TRANSFER", label: "승계" },
  { value: "USED_LEASE", label: "리스" },
  { value: "USED_RENTAL", label: "렌트" },
];

export function TypeTabs() {
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? undefined;

  return (
    <div
      className="mb-4 flex gap-2 overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map(({ value, label }) => {
        const isActive = currentType === value;
        return (
          <Link
            key={label}
            href={buildListingUrl({
              type: value,
              brand: searchParams.get("brand") || undefined,
              q: searchParams.get("q") || undefined,
              sort: (searchParams.get("sort") as ListingSort) || undefined,
            })}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
            style={{
              backgroundColor: isActive
                ? "var(--chayong-primary)"
                : "var(--chayong-surface)",
              color: isActive ? "#ffffff" : "var(--chayong-text-sub)",
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
