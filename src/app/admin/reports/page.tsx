import { redirect } from "next/navigation";
import { z } from "zod";
import { type Prisma } from "@prisma/client";

import { AdminErrorView } from "@/features/admin/components/admin-error-view";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { ReportAdminTable } from "@/features/admin/components/report-admin-table";
import { StatusFilterBar } from "@/features/admin/components/status-filter-bar";
import { paginationMeta, toURLSearchParams } from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { prisma } from "@/lib/db/prisma";
import { getProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "신고 관리" };

const REPORT_STATUSES = ["PENDING", "REVIEWED", "DISMISSED"] as const;
const REPORT_TARGET_TYPES = ["LISTING", "MESSAGE", "PROFILE", "REVIEW"] as const;
const PAGE_SIZE = 20;

const reportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  targetType: z.enum(REPORT_TARGET_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const STATUS_OPTIONS = [
  { value: "PENDING", label: "대기" },
  { value: "REVIEWED", label: "처리됨" },
  { value: "DISMISSED", label: "기각" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; targetType?: string; page?: string }>;
}) {
  const profile = await getProfile();
  if (profile?.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(reportsQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          신고 관리
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/reports" />
      </div>
    );
  }

  const { page } = validation.data;

  const where: Prisma.ReportWhereInput = {
    ...(validation.data.status ? { status: validation.data.status } : {}),
    ...(validation.data.targetType ? { targetType: validation.data.targetType } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      select: {
        id: true,
        status: true,
        targetType: true,
        targetId: true,
        reason: true,
        description: true,
        resolution: true,
        createdAt: true,
        reviewedAt: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.report.count({ where }),
  ]);

  const serializedReports = reports.map((report) => ({
    id: report.id,
    status: report.status as (typeof REPORT_STATUSES)[number],
    targetType: report.targetType as (typeof REPORT_TARGET_TYPES)[number],
    targetId: report.targetId,
    reason: report.reason,
    description: report.description,
    resolution: report.resolution,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reporter: report.reporter,
  }));

  const tableKey = `${validation.data.status ?? "__all__"}:${
    validation.data.targetType ?? "__all__"
  }`;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        신고 관리
      </h1>
      <StatusFilterBar
        options={STATUS_OPTIONS}
        current={validation.data.status}
        basePath="/admin/reports"
        preserveParams={{ targetType: validation.data.targetType }}
      />
      <ReportAdminTable
        key={tableKey}
        reports={serializedReports}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
      />
      <PaginationBar
        pagination={paginationMeta(page, PAGE_SIZE, total)}
        basePath="/admin/reports"
        preserveParams={{
          status: validation.data.status,
          targetType: validation.data.targetType,
        }}
      />
    </div>
  );
}
