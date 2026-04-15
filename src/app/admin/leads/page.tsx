import { z } from "zod";
import { LeadStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { LeadTable } from "@/features/admin/components/lead-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "상담 리드" };

const leadsQuerySchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(leadsQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          상담 리드
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/leads" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.ConsultationLeadWhereInput | undefined = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [leads, total] = await Promise.all([
    prisma.consultationLead.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, brand: true, model: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.consultationLead.count({ where }),
  ]);

  const serialized = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  // key prop으로 탭 변경 시 LeadTable 리마운트 → localLeads 초기화 (stale 방지)
  const tableKey = validation.data.status ?? "__all__";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        상담 리드
      </h1>
      <LeadTable
        key={tableKey}
        leads={serialized}
        activeStatus={validation.data.status}
      />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/leads"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
