import { z } from "zod";
import { ListingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { ListingAdminTable } from "@/features/admin/components/listing-admin-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { StatusFilterBar } from "@/features/admin/components/status-filter-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "매물 관리" };

const listingsQuerySchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "임시저장" },
  { value: "PENDING", label: "승인대기" },
  { value: "ACTIVE", label: "활성" },
  { value: "RESERVED", label: "예약" },
  { value: "SOLD", label: "판매완료" },
  { value: "HIDDEN", label: "숨김" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(listingsQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          매물 관리
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/listings" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.ListingWhereInput | undefined = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.listing.count({ where }),
  ]);

  const serialized = listings.map((l) => ({
    id: l.id,
    type: l.type,
    status: l.status,
    brand: l.brand,
    model: l.model,
    isVerified: l.isVerified,
    createdAt: l.createdAt.toISOString(),
    seller: l.seller,
  }));

  const tableKey = validation.data.status ?? "__all__";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        매물 관리
      </h1>
      <StatusFilterBar
        options={STATUS_OPTIONS}
        current={validation.data.status}
        basePath="/admin/listings"
      />
      <ListingAdminTable key={tableKey} listings={serialized} />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/listings"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
