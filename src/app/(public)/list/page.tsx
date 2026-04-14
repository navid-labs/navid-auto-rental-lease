import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { ListingGrid } from "@/features/listings/components/listing-grid";
import type { ListingCardData, ListingType } from "@/types";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "승계 차량",
  USED_LEASE: "중고 리스",
  USED_RENTAL: "중고 렌트",
};

interface SearchParams {
  type?: string;
  monthlyMin?: string;
  monthlyMax?: string;
  minPayment?: string;
  maxPayment?: string;
  brand?: string;
  sort?: string;
  page?: string;
  q?: string;
  remainingMin?: string;
  initialCostMax?: string;
  yearMin?: string;
}

function buildWhere(params: SearchParams): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };

  if (params.type && ["TRANSFER", "USED_LEASE", "USED_RENTAL"].includes(params.type)) {
    where.type = params.type as ListingType;
  }

  const minPayment = Number(params.minPayment ?? params.monthlyMin ?? 0);
  const maxPayment = Number(params.maxPayment ?? params.monthlyMax ?? 0);

  if (minPayment > 0 || maxPayment > 0) {
    where.monthlyPayment = {};
    if (minPayment > 0) where.monthlyPayment.gte = minPayment;
    if (maxPayment > 0) where.monthlyPayment.lte = maxPayment;
  }

  if (params.brand) {
    where.brand = { contains: params.brand, mode: "insensitive" };
  }

  if (params.remainingMin) {
    where.remainingMonths = { gte: Number(params.remainingMin) };
  }

  if (params.initialCostMax) {
    where.initialCost = { lte: Number(params.initialCostMax) };
  }

  if (params.yearMin) {
    where.year = { gte: Number(params.yearMin) };
  }

  if (params.q) {
    where.OR = [
      { brand: { contains: params.q, mode: "insensitive" } },
      { model: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort?: string): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { monthlyPayment: "asc" };
    case "price_desc":
      return { monthlyPayment: "desc" };
    case "popular":
      return { viewCount: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);

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
    accidentFree: l.accidentFree,
    viewCount: l.viewCount,
    favoriteCount: l.favoriteCount,
    primaryImage: l.images[0]?.url ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const typeLabel = params.type ? TYPE_LABEL[params.type] : null;

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
          initialQ={params.q ?? ""}
        />
      </Suspense>
    </div>
  );
}
