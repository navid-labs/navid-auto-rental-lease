"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VerifyAction = "approve" | "reject";

type EscrowVerifyFormProps = {
  escrowId: string;
  transferProofKey: string | null;
  signedProofUrl?: string | null;
  onDone?: () => void;
};

export function EscrowVerifyForm({
  escrowId,
  transferProofKey,
  signedProofUrl,
  onDone,
}: EscrowVerifyFormProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<VerifyAction>("approve");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasProof = Boolean(transferProofKey);
  const rejectionReasonLength = rejectionReason.trim().length;
  const canSubmit =
    hasProof &&
    !submitting &&
    (action === "approve" || rejectionReasonLength >= 10);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payoutAmountText = payoutAmount.trim();
      let amountInWon: number | undefined;

      if (action === "approve" && payoutAmountText.length > 0) {
        const payoutAmountInMan = Number(payoutAmountText);

        if (
          !Number.isInteger(payoutAmountInMan) ||
          payoutAmountInMan < 0
        ) {
          throw new Error("정산 금액은 0 이상의 정수만 입력할 수 있습니다.");
        }

        amountInWon = payoutAmountInMan * 10000;
      }

      const response = await fetch(`/api/admin/escrow/${escrowId}/verify-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "approve" &&
            amountInWon !== undefined && { payoutAmount: amountInWon }),
          ...(action === "reject" && {
            rejectionReason: rejectionReason.trim(),
          }),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" ? body.error : "검증 처리에 실패했습니다."
        );
      }

      setOpen(false);
      setPayoutAmount("");
      setRejectionReason("");
      onDone?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "검증 처리에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        size="sm"
        disabled={!hasProof}
        onClick={() => setOpen(true)}
      >
        명의변경 검증
      </Button>
      {!hasProof && (
        <span className="ml-2 text-xs text-[var(--chayong-text-caption)]">
          증빙 미업로드
        </span>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>명의변경 증빙 검증</DialogTitle>
          <DialogDescription>
            증빙 확인 후 정산 승인 또는 반려를 선택합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="flex items-center justify-between rounded-lg border border-[var(--chayong-divider)] px-3 py-2">
            <span className="truncate text-sm text-[var(--chayong-text)]">
              {transferProofKey ?? "증빙 미업로드"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!signedProofUrl}
              onClick={() => {
                if (signedProofUrl) window.open(signedProofUrl, "_blank");
              }}
            >
              미리보기
            </Button>
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--chayong-text)]">
              <input
                type="radio"
                name={`verify-action-${escrowId}`}
                value="approve"
                checked={action === "approve"}
                onChange={() => setAction("approve")}
              />
              승인
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--chayong-text)]">
              <input
                type="radio"
                name={`verify-action-${escrowId}`}
                value="reject"
                checked={action === "reject"}
                onChange={() => setAction("reject")}
              />
              반려
            </label>
          </div>

          {action === "approve" ? (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-[var(--chayong-text-sub)]">
                정산 금액 (만원)
              </label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={payoutAmount}
                onChange={(event) => setPayoutAmount(event.target.value)}
                placeholder="미입력 시 총 결제금액"
              />
            </div>
          ) : (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-[var(--chayong-text-sub)]">
                반려 사유
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="반려 사유를 10자 이상 입력해주세요"
                maxLength={1000}
                rows={4}
              />
              <div className="text-right text-xs text-[var(--chayong-text-caption)]">
                {rejectionReasonLength}/1000
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[var(--chayong-danger)]">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "처리 중" : "제출"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
