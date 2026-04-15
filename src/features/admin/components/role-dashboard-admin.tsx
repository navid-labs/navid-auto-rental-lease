"use client";

import { ShieldCheck, Clock, Car, CreditCard } from "lucide-react";
import { ActionCard } from "./action-card";
import type { ActionCardData } from "@/types/admin";

export interface DashboardStats {
  pendingListings: number;
  waitingLeads: number;
  activeListings: number;
  pendingEscrow: number;
}

export interface RecentActivity {
  id: string;
  type: "listing" | "lead" | "escrow";
  label: string;
  status: string;
  updatedAt: string;
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

const TYPE_LABELS: Record<RecentActivity["type"], string> = {
  listing: "매물",
  lead: "리드",
  escrow: "에스크로",
};

const TYPE_COLORS: Record<
  RecentActivity["type"],
  { color: string; bg: string }
> = {
  listing: { color: "var(--chayong-primary)", bg: "#EFF6FF" },
  lead: { color: "var(--chayong-warning, #F59E0B)", bg: "#FFF7ED" },
  escrow: { color: "var(--chayong-success, #00C471)", bg: "#ECFDF5" },
};

interface RoleDashboardAdminProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

export function RoleDashboardAdmin({
  stats,
  recentActivities,
}: RoleDashboardAdminProps) {
  const cards: ActionCardData[] = [
    {
      label: "승인 대기",
      value: stats.pendingListings,
      icon: ShieldCheck,
      color: "var(--chayong-danger, #F04452)",
      bg: "#FEF2F2",
      href: "/admin/pipeline",
      urgent: true,
    },
    {
      label: "상담 대기",
      value: stats.waitingLeads,
      icon: Clock,
      color: "var(--chayong-warning, #F59E0B)",
      bg: "#FFF7ED",
      href: "/admin/leads?status=WAITING",
      urgent: true,
    },
    {
      label: "활성 매물",
      value: stats.activeListings,
      icon: Car,
      color: "var(--chayong-success, #00C471)",
      bg: "#ECFDF5",
      href: "/admin/listings?status=ACTIVE",
    },
    {
      label: "에스크로 처리",
      value: stats.pendingEscrow,
      icon: CreditCard,
      color: "var(--chayong-primary)",
      bg: "#EFF6FF",
      href: "/admin/escrow?status=PAID",
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

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <ActionCard key={card.label} data={card} />
        ))}
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--chayong-bg)",
          borderColor: "var(--chayong-divider)",
        }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: "var(--chayong-text)" }}
        >
          최근 활동
        </h2>

        {recentActivities.length === 0 ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--chayong-text-caption, #8B95A1)" }}
          >
            최근 활동이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentActivities.map((activity) => {
              const { color, bg } = TYPE_COLORS[activity.type];
              return (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-3"
                >
                  {/* Type badge */}
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: bg }}
                  >
                    {TYPE_LABELS[activity.type]}
                  </span>

                  {/* Label */}
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {activity.label}
                  </span>

                  {/* Status chip */}
                  <span
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded-lg border"
                    style={{
                      color: "var(--chayong-text-sub)",
                      borderColor: "var(--chayong-divider)",
                      backgroundColor: "var(--chayong-surface, #F9FAFB)",
                    }}
                  >
                    {activity.status}
                  </span>

                  {/* Relative time */}
                  <span
                    className="flex-shrink-0 text-xs"
                    style={{ color: "var(--chayong-text-caption, #8B95A1)" }}
                  >
                    {formatRelativeTime(activity.updatedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
