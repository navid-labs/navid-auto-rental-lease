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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReportTargetType = "LISTING" | "MESSAGE" | "PROFILE" | "REVIEW";
type ReportResolution = "UPHELD_HIDE" | "DISMISSED_FALSE" | "ESCALATED";

type ReportResolveModalProps = {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (id: string) => void;
  targetType: ReportTargetType;
  targetSummary?: string;
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  LISTING: "매물",
  MESSAGE: "메시지",
  PROFILE: "프로필",
  REVIEW: "후기",
};

const RESOLUTION_OPTIONS: Array<{
  value: ReportResolution;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    value: "UPHELD_HIDE",
    label: "비공개 처리",
    badge: "처분",
    description: "신고가 타당하면 대상 콘텐츠를 숨기고 비공개로 전환합니다.",
  },
  {
    value: "DISMISSED_FALSE",
    label: "무혐의 기각",
    badge: "유지",
    description: "근거가 부족하면 대상은 유지하고 신고만 종료합니다.",
  },
  {
    value: "ESCALATED",
    label: "상위 검토",
    badge: "보류",
    description: "판단이 어려우면 즉시 처분하지 않고 상위 검토로 넘깁니다.",
  },
];

const TARGET_OUTCOME_GUIDANCE: Record<
  ReportTargetType,
  Record<ReportResolution, string>
> = {
  LISTING: {
    UPHELD_HIDE: "매물이 REJECTED 처리됩니다.",
    DISMISSED_FALSE: "매물은 유지되고 신고만 종료됩니다.",
    ESCALATED: "매물은 유지한 채 상위 검토로 이관됩니다.",
  },
  MESSAGE: {
    UPHELD_HIDE: "메시지가 비공개 처리됩니다.",
    DISMISSED_FALSE: "메시지는 유지되고 신고만 종료됩니다.",
    ESCALATED: "메시지는 유지한 채 상위 검토로 이관됩니다.",
  },
  PROFILE: {
    UPHELD_HIDE:
      "신고는 REVIEWED로 종료되지만 프로필은 자동 비공개되지 않습니다. 필요 시 패널티를 별도로 부여하세요.",
    DISMISSED_FALSE: "프로필은 유지되고 신고만 종료됩니다.",
    ESCALATED: "프로필은 유지한 채 상위 검토로 이관됩니다.",
  },
  REVIEW: {
    UPHELD_HIDE:
      "신고는 REVIEWED로 종료되지만 후기는 자동 비공개되지 않습니다. 후기 직접 삭제는 별도 절차가 필요합니다.",
    DISMISSED_FALSE: "후기는 유지되고 신고만 종료됩니다.",
    ESCALATED: "후기는 유지한 채 상위 검토로 이관됩니다.",
  },
};

function getSelectedGuidance(
  targetType: ReportTargetType,
  resolution: ReportResolution | ""
) {
  if (!resolution) {
    return "처분을 선택하면 대상별 영향이 표시됩니다.";
  }

  return TARGET_OUTCOME_GUIDANCE[targetType][resolution];
}

export function ReportResolveModal({
  reportId,
  isOpen,
  onClose,
  onResolved,
  targetType,
  targetSummary,
}: ReportResolveModalProps) {
  const [resolution, setResolution] = useState<ReportResolution | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setResolution("");
      setAdminNote("");
      setSubmitting(false);
      return;
    }

    setResolution("");
    setAdminNote("");
    setSubmitting(false);
  }, [isOpen, reportId, targetType, targetSummary]);

  const noteLength = adminNote.length;
  const canSubmit = Boolean(resolution) && !submitting;
  const selectedGuidance = getSelectedGuidance(targetType, resolution);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resolution || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: { resolution: ReportResolution; adminNote?: string } = {
        resolution,
      };

      const trimmedNote = adminNote.trim();
      if (trimmedNote.length > 0) {
        payload.adminNote = trimmedNote;
      }

      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
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
            : "신고 처분에 실패했습니다.";

        window.alert(errorMessage);
        return;
      }

      onResolved(reportId);
      onClose();
    } catch {
      window.alert("신고 처분에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>신고 처분</DialogTitle>
          <DialogDescription>
            신고 대상과 처분 결과를 확인한 뒤 진행하세요.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <section className="grid gap-3 rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] p-4">
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

            <div className="rounded-lg border border-[var(--chayong-divider)] bg-[var(--chayong-bg)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--chayong-text-caption)]">
                요약
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--chayong-text)]">
                {targetSummary?.trim().length
                  ? targetSummary
                  : "요약 정보가 제공되지 않았습니다."}
              </p>
            </div>
          </section>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-[var(--chayong-text)]">
              처분 선택
            </legend>

            <RadioGroup
              value={resolution}
              onValueChange={(value) => {
                setResolution(value as ReportResolution);
              }}
              className="grid gap-3"
              disabled={submitting}
            >
              {RESOLUTION_OPTIONS.map((option) => {
                const selected = resolution === option.value;

                return (
                  <Label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                      selected
                        ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary-light)]"
                        : "border-[var(--chayong-divider)] bg-[var(--chayong-bg)] hover:border-[var(--chayong-primary-light)]",
                      submitting && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <RadioGroupItem value={option.value} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[var(--chayong-text)]">
                          {option.label}
                        </span>
                        <span className="rounded-full bg-[var(--chayong-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--chayong-text-caption)]">
                          {option.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">
                        {option.description}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <section className="grid gap-2 rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--chayong-text-caption)]">
              선택 안내
            </p>
            <p className="text-sm text-[var(--chayong-text)]">
              {selectedGuidance}
            </p>
          </section>

          <div className="grid gap-2">
            <Label
              htmlFor="report-admin-note"
              className="text-sm font-medium text-[var(--chayong-text)]"
            >
              관리자 메모
            </Label>
            <Textarea
              id="report-admin-note"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="처분 사유와 후속 조치를 1000자 이내로 입력하세요."
              maxLength={1000}
              rows={5}
              disabled={submitting}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--chayong-text-caption)]">
                최대 1000자
              </span>
              <span className="text-[var(--chayong-text-caption)]">
                {noteLength}/1000
              </span>
            </div>
          </div>

          <DialogFooter className="px-0 pb-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "처리 중" : "제출"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
