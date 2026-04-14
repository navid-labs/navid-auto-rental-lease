"use client";

import { useState } from "react";
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
  { key: "ALL", label: "전체" },
  { key: "WAITING", label: "대기" },
  { key: "CONSULTING", label: "상담중" },
  { key: "CONTRACTED", label: "계약완료" },
];

async function updateLeadStatus(id: string, status: string) {
  await fetch(`/api/admin/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [localLeads, setLocalLeads] = useState(leads);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered =
    activeTab === "ALL"
      ? localLeads
      : localLeads.filter((l) => l.status === activeTab);

  const tabCounts = TABS.map((t) => ({
    ...t,
    count:
      t.key === "ALL"
        ? localLeads.length
        : localLeads.filter((l) => l.status === t.key).length,
  }));

  const handleStatusChange = async (id: string, status: string) => {
    await updateLeadStatus(id, status);
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    setOpenMenu(null);
  };

  return (
    <div>
      {/* Tabs */}
      <div
        className="flex gap-0 border-b mb-4"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {tabCounts.map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderBottomColor: active
                  ? "var(--chayong-primary)"
                  : "transparent",
                color: active
                  ? "var(--chayong-primary)"
                  : "var(--chayong-text-sub)",
              }}
            >
              {label}
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: active
                    ? "var(--chayong-primary-light)"
                    : "var(--chayong-surface)",
                  color: active
                    ? "var(--chayong-primary)"
                    : "var(--chayong-text-caption)",
                }}
              >
                {count}
              </span>
            </button>
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  리드가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((lead, i) => {
                const colors = STATUS_COLORS[lead.status] ?? STATUS_COLORS.CANCELED;
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderTop:
                        i > 0
                          ? `1px solid var(--chayong-divider)`
                          : undefined,
                      backgroundColor: "var(--chayong-bg)",
                    }}
                  >
                    {/* 매물 */}
                    <td className="px-4 py-3" style={{ color: "var(--chayong-text)" }}>
                      {lead.listing.brand && lead.listing.model
                        ? `${lead.listing.brand} ${lead.listing.model}`
                        : "정보 미입력"}
                    </td>
                    {/* 고객 */}
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
                    {/* 타입 */}
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
                    {/* 상태 */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.color,
                        }}
                      >
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    {/* 담당자 */}
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--chayong-text-sub)" }}
                    >
                      {lead.assignee?.name ?? "미배정"}
                    </td>
                    {/* 생성일 */}
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      {new Date(lead.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    {/* 액션 */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === lead.id ? null : lead.id)
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: "var(--chayong-border)",
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
