"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { FilterBar } from "@/components/ui/filter-bar";
import type { ListingCardData } from "@/types";

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface ListingGridProps {
  listings: ListingCardData[];
  pagination: Pagination;
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
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors"
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
            className="flex h-9 w-9 items-center justify-center text-sm"
            style={{ color: "var(--chayong-text-caption)" }}
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildPageUrl(searchParams, p)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors"
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
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors"
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

export function ListingGrid({ listings, pagination }: ListingGridProps) {
  return (
    <div>
      <div className="mb-4">
        <FilterBar />
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
            <VehicleCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <PaginationBar pagination={pagination} />
    </div>
  );
}
