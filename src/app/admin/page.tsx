import { prisma } from "@/lib/db/prisma";
import {
  RoleDashboardAdmin,
  type DashboardStats,
  type RecentActivity,
} from "@/features/admin/components/role-dashboard-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "대시보드" };

async function getStats(): Promise<DashboardStats> {
  const [pendingListings, waitingLeads, activeListings, pendingEscrow] =
    await Promise.all([
      prisma.listing.count({ where: { status: "PENDING" } }),
      prisma.consultationLead.count({ where: { status: "WAITING" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.escrowPayment.count({ where: { status: "PAID" } }),
    ]);
  return { pendingListings, waitingLeads, activeListings, pendingEscrow };
}

async function getRecentActivities(): Promise<RecentActivity[]> {
  const [listings, leads, escrows] = await Promise.all([
    prisma.listing.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        brand: true,
        model: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.consultationLead.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        listing: { select: { brand: true, model: true } },
      },
    }),
    prisma.escrowPayment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        listing: { select: { brand: true, model: true } },
      },
    }),
  ]);

  const activities: RecentActivity[] = [
    ...listings.map((l) => ({
      id: `listing-${l.id}`,
      type: "listing" as const,
      label: `${l.brand} ${l.model}`,
      status: l.status,
      updatedAt: l.updatedAt.toISOString(),
    })),
    ...leads.map((l) => ({
      id: `lead-${l.id}`,
      type: "lead" as const,
      label: l.listing
        ? `${l.listing.brand} ${l.listing.model}`
        : "상담 리드",
      status: l.status,
      updatedAt: l.updatedAt.toISOString(),
    })),
    ...escrows.map((e) => ({
      id: `escrow-${e.id}`,
      type: "escrow" as const,
      label: e.listing
        ? `${e.listing.brand} ${e.listing.model}`
        : "에스크로",
      status: e.status,
      updatedAt: e.createdAt.toISOString(),
    })),
  ];

  return activities
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 10);
}

export default async function AdminDashboardPage() {
  const [stats, recentActivities] = await Promise.all([
    getStats(),
    getRecentActivities(),
  ]);

  return (
    <RoleDashboardAdmin stats={stats} recentActivities={recentActivities} />
  );
}
