"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReportTargetType = "LISTING" | "MESSAGE" | "PROFILE" | "REVIEW";
type ReportReason =
  | "FALSE_LISTING"
  | "CONTACT_BYPASS"
  | "HARASSMENT"
  | "SPAM"
  | "SCAM"
  | "OTHER";

type ReportModalProps = {
  targetType: ReportTargetType;
  targetId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  targetSummary?: string;
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  LISTING: "매물",
  MESSAGE: "메시지",
  PROFILE: "프로필",
  REVIEW: "후기",
};

const REASON_OPTIONS: Array<{
  value: ReportReason;
  label: string;
  description: string;
}> = [
  {
    value: "FALSE_LISTING",
    label: "허위 매물",
    description: "실제 정보와 다르거나 존재하지 않는 매물로 보이는 경우",
  },
  {
    value: "CONTACT_BYPASS",
    label: "연락처 우회",
    description: "플랫폼 밖으로 연락을 유도하거나 연락처를 노출하는 경우",
  },
  {
    value: "HARASSMENT",
    label: "괴롭힘/협박",
    description: "비방, 협박, 반복적인 불쾌한 연락이 있는 경우",
  },
  {
    value: "SPAM",
    label: "스팸/도배",
    description: "의미 없는 반복 메시지나 광고성 노출이 과도한 경우",
  },
  {
    value: "SCAM",
    label: "사기 의심",
    description: "금전 요구, 허위 안내 등 사기 가능성이 의심되는 경우",
  },
  {
    value: "OTHER",
    label: "기타",
    description: "위 항목에 해당하지 않지만 신고가 필요한 경우",
  },
];

function getTargetSummary(targetType: ReportTargetType, targetSummary?: string) {
  const summary = targetSummary?.trim();
  if (summary && summary.length > 0) {
    return summary;
  }

  return `${TARGET_LABELS[targetType]} 요약 정보가 제공되지 않았습니다.`;
}

export function ReportModal({
  targetType,
  targetId,
  isOpen,
  onClose,
  onSubmitted,
  targetSummary,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setDescription("");
      setSubmitting(false);
      return;
    }

    setReason("");
    setDescription("");
    setSubmitting(false);
  }, [isOpen, targetId, targetType]);

  const descriptionCount = description.length;
  const canSubmit = Boolean(reason) && !submitting;
  const summaryText = getTargetSummary(targetType, targetSummary);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reason || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: {
        targetType: ReportTargetType;
        targetId: string;
        reason: ReportReason;
        description?: string;
      } = {
        targetType,
        targetId,
        reason,
      };

      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0) {
        payload.description = trimmedDescription;
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: unknown;
        };
        const errorMessage =
          typeof body.error === "string" && body.error.trim().length > 0
            ? body.error
            : "신고 접수에 실패했습니다.";

        window.alert(errorMessage);
        return;
      }

      onSubmitted?.();
      onClose();
    } catch {
      window.alert("신고 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
          <DialogDescription>
            신고 사유를 선택하고 필요한 경우 보충 설명을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <section className="grid gap-3 rounded-2xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--chayong-text-caption)]">
                  신고 대상
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--chayong-text)]">
                  {TARGET_LABELS[targetType]}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--chayong-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--chayong-primary)]">
                {targetType}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-bg)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--chayong-text-caption)]">
                요약
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--chayong-text)]">
                {summaryText}
              </p>
            </div>
          </section>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-[var(--chayong-text)]">
              신고 사유
            </legend>

            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as ReportReason)}
              className="grid gap-3"
              disabled={submitting}
            >
              {REASON_OPTIONS.map((option) => {
                const selected = reason === option.value;

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      selected
                        ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary-light)]/30"
                        : "border-[var(--chayong-divider)] bg-[var(--chayong-surface)] hover:bg-[var(--chayong-bg)]",
                      submitting && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      className="mt-0.5"
                    />
                    <span className="grid gap-1">
                      <span className="text-sm font-medium text-[var(--chayong-text)]">
                        {option.label}
                      </span>
                      <span className="text-sm leading-5 text-[var(--chayong-text-caption)]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <section className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="report-description"
                className="text-sm font-medium text-[var(--chayong-text)]"
              >
                보충 설명
              </label>
              <span className="text-xs text-[var(--chayong-text-caption)]">
                {descriptionCount}/1000
              </span>
            </div>
            <Textarea
              id="report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="신고 사유를 조금 더 자세히 적어주세요. 선택 입력입니다."
              disabled={submitting}
            />
          </section>

          <DialogFooter className="px-0 pb-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "신고 접수 중..." : "신고하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
