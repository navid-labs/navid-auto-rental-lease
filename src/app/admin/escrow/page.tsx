import { z } from "zod";
import { EscrowStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { EscrowAdminTable } from "@/features/admin/components/escrow-admin-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { StatusFilterBar } from "@/features/admin/components/status-filter-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "에스크로 관리" };

const escrowQuerySchema = z.object({
  status: z.nativeEnum(EscrowStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

const STATUS_OPTIONS = [
  { value: "PENDING", label: "미결제" },
  { value: "PAID", label: "결제완료" },
  { value: "RELEASED", label: "지급완료" },
  { value: "REFUNDED", label: "환불" },
  { value: "DISPUTED", label: "분쟁" },
];

export default async function AdminEscrowPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(escrowQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          에스크로 관리
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/escrow" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.EscrowPaymentWhereInput | undefined = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [escrows, total] = await Promise.all([
    prisma.escrowPayment.findMany({
      where,
      include: {
        listing: { select: { id: true, brand: true, model: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.escrowPayment.count({ where }),
  ]);

  const serialized = escrows.map((e) => ({
    id: e.id,
    status: e.status,
    totalAmount: e.totalAmount,
    paidAt: e.paidAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    listing: e.listing,
    buyer: e.buyer,
    seller: e.seller,
  }));

  const tableKey = validation.data.status ?? "__all__";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        에스크로 관리
      </h1>
      <StatusFilterBar
        options={STATUS_OPTIONS}
        current={validation.data.status}
        basePath="/admin/escrow"
      />
      <EscrowAdminTable key={tableKey} escrows={serialized} />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/escrow"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
