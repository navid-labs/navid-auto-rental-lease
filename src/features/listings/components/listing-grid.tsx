"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { AdvancedFilters } from "./advanced-filters";
import type { ListingCardData } from "@/types";

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface ListingGridProps {
  listings: ListingCardData[];
  pagination: Pagination;
  initialQ?: string;
}

function buildPageUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return `/list${qs ? `?${qs}` : ""}`;
}

function PaginationBar({ pagination }: { pagination: Pagination }) {
  const searchParams = useSearchParams();
  const { page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  // Build visible page numbers: show up to 5 around current
  const pages: (number | "ellipsis")[] = [];
  const delta = 2;
  const range: number[] = [];

  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    range.push(i);
  }

  if (range[0] > 1) {
    pages.push(1);
    if (range[0] > 2) pages.push("ellipsis");
  }
  for (const p of range) pages.push(p);
  if (range[range.length - 1] < totalPages) {
    if (range[range.length - 1] < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="페이지 이동">
      <Link
        href={buildPageUrl(searchParams, page - 1)}
        aria-disabled={page <= 1}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-sm transition-colors"
        style={{
          color: page <= 1 ? "var(--chayong-text-caption)" : "var(--chayong-text)",
          pointerEvents: page <= 1 ? "none" : undefined,
          backgroundColor: "var(--chayong-surface)",
        }}
      >
        &lt;
      </Link>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-11 w-11 items-center justify-center text-sm"
            style={{ color: "var(--chayong-text-caption)" }}
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildPageUrl(searchParams, p)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: p === page ? "var(--chayong-primary)" : "var(--chayong-surface)",
              color: p === page ? "#ffffff" : "var(--chayong-text)",
            }}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildPageUrl(searchParams, page + 1)}
        aria-disabled={page >= totalPages}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-sm transition-colors"
        style={{
          color: page >= totalPages ? "var(--chayong-text-caption)" : "var(--chayong-text)",
          pointerEvents: page >= totalPages ? "none" : undefined,
          backgroundColor: "var(--chayong-surface)",
        }}
      >
        &gt;
      </Link>
    </nav>
  );
}

function SearchBar({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Controlled by local state; initialised once from URL or prop
  const [value, setValue] = useState(() => searchParams.get("q") ?? initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(v: string) {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (v) {
        params.set("q", v);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <div className="relative mb-3">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--chayong-text-caption)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="브랜드, 모델 검색…"
        className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--chayong-primary)]"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
          color: "var(--chayong-text)",
        }}
      />
    </div>
  );
}

export function ListingGrid({ listings, pagination, initialQ = "" }: ListingGridProps) {
  return (
    <div>
      <SearchBar initialQ={initialQ} />
      <div className="mb-3">
        <FilterBar />
      </div>
      <div className="mb-4">
        <AdvancedFilters />
      </div>

      {listings.length === 0 ? (
        <div
          className="flex h-64 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
            등록된 매물이 없습니다
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <VehicleCard key={listing.id} listing={listing} showCompare />
          ))}
        </div>
      )}

      <PaginationBar pagination={pagination} />
    </div>
  );
}
