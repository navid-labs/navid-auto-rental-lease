import { prisma } from "@/lib/db/prisma";
import {
  Users,
  Clock,
  Car,
  CreditCard,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "대시보드" };

async function getStats() {
  const [totalLeads, waitingLeads, activeListings, pendingEscrow] =
    await Promise.all([
      prisma.consultationLead.count(),
      prisma.consultationLead.count({ where: { status: "WAITING" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.escrowPayment.count({ where: { status: "PAID" } }),
    ]);
  return { totalLeads, waitingLeads, activeListings, pendingEscrow };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "전체 리드",
      value: stats.totalLeads,
      icon: Users,
      color: "var(--chayong-primary)",
      bg: "var(--chayong-primary-light)",
    },
    {
      label: "대기중 리드",
      value: stats.waitingLeads,
      icon: Clock,
      color: "var(--chayong-warning)",
      bg: "#FFF7ED",
    },
    {
      label: "활성 매물",
      value: stats.activeListings,
      icon: Car,
      color: "var(--chayong-success)",
      bg: "#ECFDF5",
    },
    {
      label: "에스크로 대기",
      value: stats.pendingEscrow,
      icon: CreditCard,
      color: "var(--chayong-danger)",
      bg: "#FEF2F2",
    },
  ];

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{ color: "var(--chayong-text)" }}
      >
        대시보드
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: "var(--chayong-bg)",
              borderColor: "var(--chayong-divider)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              {/* Trend placeholder */}
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: bg,
                  color,
                }}
              >
                —
              </span>
            </div>
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--chayong-text)" }}
            >
              {value.toLocaleString()}
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--chayong-text-caption)" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
