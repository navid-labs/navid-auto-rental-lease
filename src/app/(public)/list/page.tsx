import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { ListingGrid } from "@/features/listings/components/listing-grid";
import { parseListingFilters } from "@/lib/listings/filters";
import type { ListingFilters } from "@/lib/listings/filters";
import type { ListingCardData, ListingType } from "@/types";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "승계 차량",
  USED_LEASE: "중고 리스",
  USED_RENTAL: "중고 렌트",
};

function buildWhereFromFilters(filters: ListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };

  if (filters.type) {
    where.type = filters.type as ListingType;
  }

  const { minPayment, maxPayment } = filters;
  if (minPayment || maxPayment) {
    where.monthlyPayment = {};
    if (minPayment) where.monthlyPayment.gte = minPayment;
    if (maxPayment) where.monthlyPayment.lte = maxPayment;
  }

  if (filters.brand) {
    where.brand = { contains: filters.brand, mode: "insensitive" };
  }

  if (filters.remainingMin) {
    where.remainingMonths = { gte: filters.remainingMin };
  }

  if (filters.initialCostMax) {
    where.initialCost = { lte: filters.initialCostMax };
  }

  if (filters.yearMin) {
    where.year = { gte: filters.yearMin };
  }

  if (filters.q) {
    where.OR = [
      { brand: { contains: filters.q, mode: "insensitive" } },
      { model: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: ListingFilters["sort"]): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { monthlyPayment: "asc" };
    case "price_desc":
      return { monthlyPayment: "desc" };
    case "year_desc":
      return { year: "desc" };
    case "mileage_asc":
      return { mileage: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseListingFilters(rawParams);
  const { page } = filters;
  const where = buildWhereFromFilters(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [rawListings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const listings: ListingCardData[] = rawListings.map((l) => ({
    id: l.id,
    type: l.type,
    brand: l.brand,
    model: l.model,
    year: l.year,
    trim: l.trim,
    mileage: l.mileage,
    monthlyPayment: l.monthlyPayment,
    initialCost: l.initialCost,
    remainingMonths: l.remainingMonths,
    isVerified: l.isVerified,
    accidentCount: l.accidentCount,
    mileageVerified: l.mileageVerified,
    viewCount: l.viewCount,
    favoriteCount: l.favoriteCount,
    primaryImage: l.images[0]?.url ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const typeLabel = filters.type ? TYPE_LABEL[filters.type] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
          {typeLabel ?? "매물 목록"}
        </h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {total.toLocaleString("ko-KR")}건
        </span>
      </div>

      {/* Grid with filters — needs Suspense because FilterBar/AdvancedFilters use useSearchParams */}
      <Suspense
        fallback={
          <div
            className="flex h-64 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--chayong-surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
              불러오는 중…
            </p>
          </div>
        }
      >
        <ListingGrid
          listings={listings}
          pagination={{ page, totalPages, total }}
          initialQ={filters.q ?? ""}
        />
      </Suspense>
    </div>
  );
}
