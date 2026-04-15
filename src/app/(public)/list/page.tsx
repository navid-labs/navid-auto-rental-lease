import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { ListingGrid } from "@/features/listings/components/listing-grid";
import { SidebarFilters } from "@/features/listings/components/sidebar-filters";
import { ResultMeta } from "@/features/listings/components/result-meta";
import { TypeTabs } from "@/features/listings/components/type-tabs";
import { ListingSkeleton } from "@/features/listings/components/listing-skeleton";
import { parseListingFilters } from "@/lib/listings/filters";
import type { ListingFilters } from "@/lib/listings/filters";
import type { ListingCardData, ListingType } from "@/types";
import type { Prisma } from "@prisma/client";
import type { FuelType, Transmission } from "@prisma/client";

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

  if (filters.fuel) {
    where.fuelType = filters.fuel as FuelType;
  }

  if (filters.trans) {
    where.transmission = filters.trans as Transmission;
  }

  if (filters.accidentMax !== undefined) {
    where.accidentCount = { lte: filters.accidentMax };
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

  const [rawListings, total, brandRows] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        brand: true,
        model: true,
        year: true,
        trim: true,
        mileage: true,
        monthlyPayment: true,
        initialCost: true,
        remainingMonths: true,
        isVerified: true,
        accidentCount: true,
        mileageVerified: true,
        viewCount: true,
        favoriteCount: true,
        options: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
      take: 20,
      orderBy: { brand: "asc" },
    }),
  ]);

  const topBrands = brandRows.map((r) => r.brand).filter((b): b is string => b !== null);

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
    options: l.options,
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

      {/* Sidebar + Grid layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar — hidden on mobile, visible lg+ */}
        <Suspense fallback={null}>
          <SidebarFilters brands={topBrands} />
        </Suspense>

        {/* Grid with filters — needs Suspense because FilterBar/AdvancedFilters use useSearchParams */}
        <div className="flex-1 min-w-0">
          {/* Type tabs */}
          <Suspense fallback={null}>
            <TypeTabs />
          </Suspense>

          {/* ResultMeta: active filter chips + count — uses useRouter so needs Suspense */}
          <Suspense fallback={null}>
            <ResultMeta count={total} filters={filters} />
          </Suspense>

          <Suspense fallback={<ListingSkeleton count={6} />}>
            <ListingGrid
              listings={listings}
              pagination={{ page, totalPages, total }}
              initialQ={filters.q ?? ""}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
