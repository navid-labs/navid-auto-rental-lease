"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type ListingRow = {
  id: string;
  type: string;
  status: string;
  brand: string | null;
  model: string | null;
  isVerified: boolean;
  createdAt: string;
  seller: { id: string; name: string | null; email: string };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  PENDING: "승인대기",
  ACTIVE: "활성",
  RESERVED: "예약",
  SOLD: "판매완료",
  HIDDEN: "숨김",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
  PENDING: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  ACTIVE: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  RESERVED: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  SOLD: { bg: "var(--chayong-surface)", color: "var(--chayong-text-sub)" },
  HIDDEN: { bg: "#FEF2F2", color: "var(--chayong-danger)" },
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

async function updateListing(id: string, data: Record<string, unknown>) {
  await fetch(`/api/admin/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function ListingAdminTable({ listings }: { listings: ListingRow[] }) {
  const [rows, setRows] = useState(listings);

  const handleAction = async (
    id: string,
    data: Record<string, unknown>
  ) => {
    await updateListing(id, data);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
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
            {["매물", "등록자", "타입", "상태", "안심마크", "등록일", "액션"].map(
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
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="text-center py-10"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                매물이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const colors =
                STATUS_COLORS[row.status] ?? STATUS_COLORS.DRAFT;
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
                    {row.brand && row.model
                      ? `${row.brand} ${row.model}`
                      : "정보 미입력"}
                  </td>
                  {/* 등록자 */}
                  <td className="px-4 py-3">
                    <p style={{ color: "var(--chayong-text)" }}>
                      {row.seller.name ?? row.seller.email}
                    </p>
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
                      {TYPE_LABELS[row.type] ?? row.type}
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
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  {/* 안심마크 */}
                  <td className="px-4 py-3">
                    {row.isVerified ? (
                      <Check
                        size={16}
                        style={{ color: "var(--chayong-success)" }}
                      />
                    ) : (
                      <X
                        size={16}
                        style={{ color: "var(--chayong-text-caption)" }}
                      />
                    )}
                  </td>
                  {/* 등록일 */}
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  {/* 액션 */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              handleAction(row.id, { status: "ACTIVE" })
                            }
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{
                              backgroundColor: "#ECFDF5",
                              color: "var(--chayong-success)",
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() =>
                              handleAction(row.id, { status: "HIDDEN" })
                            }
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{
                              backgroundColor: "#FEF2F2",
                              color: "var(--chayong-danger)",
                            }}
                          >
                            거절
                          </button>
                        </>
                      )}
                      {row.status === "ACTIVE" && (
                        <button
                          onClick={() =>
                            handleAction(row.id, { status: "HIDDEN" })
                          }
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: "var(--chayong-surface)",
                            color: "var(--chayong-text-sub)",
                          }}
                        >
                          숨김
                        </button>
                      )}
                      {row.status === "HIDDEN" && (
                        <button
                          onClick={() =>
                            handleAction(row.id, { status: "ACTIVE" })
                          }
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: "var(--chayong-primary-light)",
                            color: "var(--chayong-primary)",
                          }}
                        >
                          공개
                        </button>
                      )}
                    </div>
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
