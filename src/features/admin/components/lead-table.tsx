"use client";

import Link from "next/link";
import { useState } from "react";
import { toURLSearchParams } from "@/lib/api/pagination";

type Lead = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  note: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null };
  listing: { id: string; brand: string | null; model: string | null };
  assignee: { id: string; name: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  WAITING: "대기",
  CONSULTING: "상담중",
  CONTRACTED: "계약완료",
  CANCELED: "취소",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  WAITING: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  CONSULTING: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  CONTRACTED: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  CANCELED: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

const TABS = [
  { status: undefined as string | undefined, label: "전체" },
  { status: "WAITING" as string | undefined, label: "대기" },
  { status: "CONSULTING" as string | undefined, label: "상담중" },
  { status: "CONTRACTED" as string | undefined, label: "계약완료" },
];

async function updateLeadStatus(id: string, status: string) {
  await fetch(`/api/admin/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

function buildTabHref(status: string | undefined): string {
  const params = toURLSearchParams({ status });
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export function LeadTable({
  leads,
  activeStatus,
}: {
  leads: Lead[];
  activeStatus?: string;
}) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    await updateLeadStatus(id, status);
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    setOpenMenu(null);
  };

  return (
    <div>
      {/* Tabs — server navigation via Link */}
      <div
        className="flex gap-0 border-b mb-4"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {TABS.map(({ status, label }) => {
          const active = status === activeStatus;
          return (
            <Link
              key={status ?? "__all__"}
              href={buildTabHref(status)}
              aria-current={active ? "page" : undefined}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderBottomColor: active ? "var(--chayong-primary)" : "transparent",
                color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
              {["매물", "고객", "타입", "상태", "담당자", "생성일", "액션"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: "var(--chayong-text-sub)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {localLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {activeStatus ? "선택한 필터에 맞는 리드가 없습니다." : "리드가 없습니다."}
                </td>
              </tr>
            ) : (
              localLeads.map((lead, i) => {
                const colors = STATUS_COLORS[lead.status] ?? STATUS_COLORS.CANCELED;
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderTop: i > 0 ? `1px solid var(--chayong-divider)` : undefined,
                      backgroundColor: "var(--chayong-bg)",
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--chayong-text)" }}>
                      {lead.listing.brand && lead.listing.model
                        ? `${lead.listing.brand} ${lead.listing.model}`
                        : "정보 미입력"}
                    </td>
                    <td className="px-4 py-3">
                      <p style={{ color: "var(--chayong-text)" }}>
                        {lead.user.name ?? lead.user.email}
                      </p>
                      {lead.user.phone && (
                        <p
                          className="text-xs"
                          style={{ color: "var(--chayong-text-caption)" }}
                        >
                          {lead.user.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "var(--chayong-surface)",
                          color: "var(--chayong-text-sub)",
                        }}
                      >
                        {TYPE_LABELS[lead.type] ?? lead.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--chayong-text-sub)" }}
                    >
                      {lead.assignee?.name ?? "미배정"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      {new Date(lead.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === lead.id ? null : lead.id)
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: "var(--chayong-divider)",
                          color: "var(--chayong-text-sub)",
                          backgroundColor: "var(--chayong-bg)",
                        }}
                      >
                        상태 변경
                      </button>
                      {openMenu === lead.id && (
                        <div
                          className="absolute right-4 top-10 rounded-lg shadow-lg z-10 py-1 min-w-[120px]"
                          style={{
                            backgroundColor: "var(--chayong-bg)",
                            border: "1px solid var(--chayong-divider)",
                          }}
                        >
                          {Object.entries(STATUS_LABELS)
                            .filter(([k]) => k !== lead.status)
                            .map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => handleStatusChange(lead.id, k)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--chayong-surface)] transition-colors"
                                style={{ color: "var(--chayong-text)" }}
                              >
                                {v}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
