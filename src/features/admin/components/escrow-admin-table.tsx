"use client";

import { useState } from "react";

type EscrowRow = {
  id: string;
  status: string;
  totalAmount: number;
  paidAt: string | null;
  createdAt: string;
  listing: { id: string; brand: string | null; model: string | null };
  buyer: { id: string; name: string | null; email: string };
  seller: { id: string; name: string | null; email: string };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "미결제",
  PAID: "결제완료",
  RELEASED: "지급완료",
  REFUNDED: "환불",
  DISPUTED: "분쟁",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
  PAID: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  RELEASED: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  REFUNDED: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  DISPUTED: { bg: "#FEF2F2", color: "var(--chayong-danger)" },
};

async function updateEscrow(id: string, status: string) {
  await fetch(`/api/admin/escrow/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function EscrowAdminTable({ escrows }: { escrows: EscrowRow[] }) {
  const [rows, setRows] = useState(escrows);

  const handleAction = async (id: string, status: string) => {
    await updateEscrow(id, status);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
            {[
              "매물",
              "구매자",
              "판매자",
              "금액",
              "상태",
              "결제일",
              "액션",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-medium"
                style={{ color: "var(--chayong-text-sub)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="text-center py-10"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                에스크로 내역이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const colors =
                STATUS_COLORS[row.status] ?? STATUS_COLORS.PENDING;
              return (
                <tr
                  key={row.id}
                  style={{
                    borderTop:
                      i > 0
                        ? `1px solid var(--chayong-divider)`
                        : undefined,
                    backgroundColor: "var(--chayong-bg)",
                  }}
                >
                  {/* 매물 */}
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {row.listing.brand && row.listing.model
                      ? `${row.listing.brand} ${row.listing.model}`
                      : "정보 미입력"}
                  </td>
                  {/* 구매자 */}
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {row.buyer.name ?? row.buyer.email}
                  </td>
                  {/* 판매자 */}
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {row.seller.name ?? row.seller.email}
                  </td>
                  {/* 금액 */}
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {row.totalAmount.toLocaleString("ko-KR")}원
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
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  {/* 결제일 */}
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    {row.paidAt
                      ? new Date(row.paidAt).toLocaleDateString("ko-KR")
                      : "—"}
                  </td>
                  {/* 액션 */}
                  <td className="px-4 py-3">
                    {row.status === "PAID" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(row.id, "RELEASED")}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: "#ECFDF5",
                            color: "var(--chayong-success)",
                          }}
                        >
                          지급 처리
                        </button>
                        <button
                          onClick={() => handleAction(row.id, "REFUNDED")}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: "#FFF7ED",
                            color: "var(--chayong-warning)",
                          }}
                        >
                          환불 처리
                        </button>
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
  );
}
