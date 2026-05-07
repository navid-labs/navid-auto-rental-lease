"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ListingRow = {
  id: string;
  type: string;
  status: string;
  brand: string | null;
  model: string | null;
  isVerified: boolean;
  rejectionReason?: string | null;
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
  REJECTED: "거절됨",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
  PENDING: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  ACTIVE: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  RESERVED: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  SOLD: { bg: "var(--chayong-surface)", color: "var(--chayong-text-sub)" },
  HIDDEN: { bg: "#FEF2F2", color: "var(--chayong-danger)" },
  REJECTED: { bg: "#FEF2F2", color: "var(--chayong-danger)" },
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

async function updateListing(id: string, data: Record<string, unknown>) {
  const response = await fetch(`/api/admin/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : "상태 변경에 실패했습니다."
    );
  }
}

export function ListingAdminTable({ listings }: { listings: ListingRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(listings);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const rejectionReasonLength = rejectionReason.trim().length;

  const handleAction = async (
    id: string,
    data: Record<string, unknown>
  ) => {
    await updateListing(id, data);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
    router.refresh();
  };

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectionReason("");
    setRejectError(null);
  };

  const closeRejectDialog = () => {
    if (rejecting) return;
    setRejectingId(null);
    setRejectionReason("");
    setRejectError(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || rejectionReasonLength < 10) return;

    setRejecting(true);
    setRejectError(null);
    try {
      await handleAction(rejectingId, {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });
      closeRejectDialog();
    } catch (error) {
      setRejectError(
        error instanceof Error ? error.message : "거절 처리에 실패했습니다."
      );
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/listings/${row.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: "var(--chayong-primary)" }}
                      >
                        {row.brand && row.model
                          ? `${row.brand} ${row.model}`
                          : "정보 미입력"}
                      </Link>
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
                      {row.status === "REJECTED" && (
                        <p
                          className="mt-1 max-w-48 truncate text-xs"
                          title={row.rejectionReason ?? "거절 사유는 상세에서 확인하세요."}
                          style={{ color: "var(--chayong-text-caption)" }}
                        >
                          {row.rejectionReason ?? "거절 사유 확인 필요"}
                        </p>
                      )}
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
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(row.id)}
                            >
                              거절
                            </Button>
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

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && closeRejectDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매물 거절</DialogTitle>
            <DialogDescription>
              매도자에게 전달할 거절 사유를 10자 이상 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Textarea
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setRejectError(null);
              }}
              placeholder="거절 사유를 10자 이상 입력해주세요"
              maxLength={1000}
              rows={5}
            />
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--chayong-danger)" }}>
                {rejectError}
              </span>
              <span style={{ color: "var(--chayong-text-caption)" }}>
                {rejectionReasonLength}/1000
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeRejectDialog}>
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectionReasonLength < 10 || rejecting}
              onClick={handleRejectConfirm}
            >
              {rejecting ? "처리 중" : "거절 확정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
