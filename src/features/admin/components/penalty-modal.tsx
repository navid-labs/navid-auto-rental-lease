"use client";

import { useEffect, useState } from "react";
import {
  BanIcon,
  CircleAlertIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

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

type PenaltyLevel = "WARNING" | "LIGHT" | "HEAVY" | "BAN" | "CLEAR";
type CurrentPenaltyLevel = "NONE" | "WARNING" | "LIGHT" | "HEAVY" | "BAN";

type AppliedPenaltyResult = {
  penaltyLevel: string;
  suspendedUntil: string | null;
  bannedAt: string | null;
};

type PenaltyModalProps = {
  profileId: string;
  currentLevel: CurrentPenaltyLevel;
  userLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onApplied: (result: AppliedPenaltyResult) => void;
};

type PenaltyOption = {
  level: PenaltyLevel;
  label: string;
  description: string;
  icon: typeof CircleAlertIcon;
};

const PENALTY_OPTIONS: PenaltyOption[] = [
  {
    level: "WARNING",
    label: "경고",
    description: "주의 문구만 남기고 제한은 적용하지 않습니다.",
    icon: TriangleAlertIcon,
  },
  {
    level: "LIGHT",
    label: "경미 제한",
    description: "30일 기본 제한을 적용합니다.",
    icon: ShieldAlertIcon,
  },
  {
    level: "HEAVY",
    label: "중대 제한",
    description: "90일 기본 제한을 적용합니다.",
    icon: ShieldCheckIcon,
  },
  {
    level: "BAN",
    label: "영구 차단",
    description: "계정을 즉시 차단하고 해제까지 수동 처리가 필요합니다.",
    icon: BanIcon,
  },
  {
    level: "CLEAR",
    label: "제재 해제",
    description: "현재 적용된 패널티를 모두 해제합니다.",
    icon: CircleAlertIcon,
  },
];

const LEVEL_LABELS: Record<CurrentPenaltyLevel, string> = {
  NONE: "없음",
  WARNING: "경고",
  LIGHT: "경미 제한",
  HEAVY: "중대 제한",
  BAN: "차단",
};

function getInitialPenaltyLevel(currentLevel: CurrentPenaltyLevel): PenaltyLevel {
  if (currentLevel === "LIGHT") return "LIGHT";
  if (currentLevel === "HEAVY") return "HEAVY";
  if (currentLevel === "BAN") return "BAN";
  if (currentLevel === "WARNING") return "WARNING";
  return "WARNING";
}

function getDefaultDurationDays(level: PenaltyLevel): string {
  if (level === "HEAVY") return "90";
  if (level === "LIGHT") return "30";
  return "";
}

function levelTone(level: PenaltyLevel): string {
  switch (level) {
    case "WARNING":
      return "border-[var(--chayong-warning)] bg-[rgba(255,149,0,0.08)] text-[var(--chayong-warning)]";
    case "LIGHT":
      return "border-[var(--chayong-primary)] bg-[var(--chayong-primary-light)] text-[var(--chayong-primary)]";
    case "HEAVY":
      return "border-[var(--chayong-danger)] bg-[rgba(240,68,82,0.08)] text-[var(--chayong-danger)]";
    case "BAN":
      return "border-[var(--chayong-danger)] bg-[rgba(240,68,82,0.12)] text-[var(--chayong-danger)]";
    case "CLEAR":
      return "border-[var(--chayong-success)] bg-[rgba(0,196,113,0.08)] text-[var(--chayong-success)]";
  }
}

function currentLevelTone(level: CurrentPenaltyLevel): string {
  if (level === "NONE") {
    return "border-[var(--chayong-divider)] bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]";
  }

  return levelTone(level);
}

export function PenaltyModal({
  profileId,
  currentLevel,
  userLabel,
  isOpen,
  onClose,
  onApplied,
}: PenaltyModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<PenaltyLevel>(
    getInitialPenaltyLevel(currentLevel)
  );
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState(
    getDefaultDurationDays(getInitialPenaltyLevel(currentLevel))
  );
  const [confirmBan, setConfirmBan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialLevel = getInitialPenaltyLevel(currentLevel);
    setSelectedLevel(initialLevel);
    setReason("");
    setDurationDays(getDefaultDurationDays(initialLevel));
    setConfirmBan(false);
    setSubmitting(false);
    setError(null);
  }, [currentLevel, isOpen]);

  const reasonLength = reason.trim().length;
  const durationValue = Number.parseInt(durationDays, 10);
  const needsDuration = selectedLevel === "LIGHT" || selectedLevel === "HEAVY";
  const durationValid =
    !needsDuration ||
    (Number.isInteger(durationValue) && durationValue >= 1 && durationValue <= 365);
  const canSubmit =
    !submitting &&
    reasonLength >= 10 &&
    durationValid &&
    (selectedLevel !== "BAN" || confirmBan);

  const handleLevelChange = (nextLevel: PenaltyLevel) => {
    setSelectedLevel(nextLevel);
    setError(null);
    setConfirmBan(false);

    if (nextLevel === "LIGHT" || nextLevel === "HEAVY") {
      setDurationDays(getDefaultDurationDays(nextLevel));
    } else {
      setDurationDays("");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: {
        level: PenaltyLevel;
        reason: string;
        durationDays?: number;
      } = {
        level: selectedLevel,
        reason: reason.trim(),
      };

      if (needsDuration) {
        if (!durationValid) {
          throw new Error("기간은 1일 이상 365일 이하로 입력해야 합니다.");
        }

        payload.durationDays = durationValue;
      }

      const response = await fetch(`/api/admin/profiles/${profileId}/penalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "패널티 적용에 실패했습니다."
        );
      }

      onApplied({
        penaltyLevel: String(body.penaltyLevel ?? selectedLevel),
        suspendedUntil:
          body.suspendedUntil === undefined ? null : (body.suspendedUntil as string | null),
        bannedAt:
          body.bannedAt === undefined ? null : (body.bannedAt as string | null),
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "패널티 적용에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>패널티 부여</DialogTitle>
          <DialogDescription>
            {userLabel} 계정에 적용할 제재 수준과 사유를 입력합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3 rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <span className="text-xs font-medium text-[var(--chayong-text-caption)]">
                  대상
                </span>
                <span className="text-sm font-semibold text-[var(--chayong-text)]">
                  {userLabel}
                </span>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-medium ${currentLevelTone(
                  currentLevel
                )}`}
              >
                현재 제재: {LEVEL_LABELS[currentLevel]}
              </div>
            </div>
            <p className="text-xs leading-5 text-[var(--chayong-text-caption)]">
              WARNING / LIGHT / HEAVY / BAN / CLEAR 중 하나를 선택하세요. LIGHT와 HEAVY는
              기본 기간이 각각 30일, 90일이며 1~365일 사이로 조정할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3">
            {PENALTY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const checked = selectedLevel === option.level;
              const isDanger = option.level === "BAN";

              return (
                <label
                  key={option.level}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    checked
                      ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary-light)]"
                      : "border-[var(--chayong-divider)] bg-[var(--chayong-bg)] hover:border-[var(--chayong-primary)]/40",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`penalty-level-${profileId}`}
                    value={option.level}
                    checked={checked}
                    disabled={submitting}
                    onChange={() => handleLevelChange(option.level)}
                    className="mt-1"
                  />
                  <Icon
                    className={[
                      "mt-0.5 size-5 shrink-0",
                      isDanger ? "text-[var(--chayong-danger)]" : "text-[var(--chayong-primary)]",
                    ].join(" ")}
                  />
                  <span className="grid gap-0.5">
                    <span className="text-sm font-semibold text-[var(--chayong-text)]">
                      {option.label}
                    </span>
                    <span className="text-xs leading-5 text-[var(--chayong-text-caption)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {needsDuration && (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-[var(--chayong-text-sub)]">
                제한 기간(일)
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                step={1}
                value={durationDays}
                disabled={submitting}
                onChange={(event) => setDurationDays(event.target.value)}
                placeholder={selectedLevel === "LIGHT" ? "30" : "90"}
              />
              <p className="text-xs leading-5 text-[var(--chayong-text-caption)]">
                1일부터 365일까지 입력할 수 있습니다.
              </p>
            </div>
          )}

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-[var(--chayong-text-sub)]">
              사유
            </label>
            <Textarea
              value={reason}
              disabled={submitting}
              onChange={(event) => setReason(event.target.value)}
              placeholder="패널티 사유를 10자 이상 입력하세요"
              maxLength={1000}
              rows={5}
            />
            <div className="flex items-center justify-between gap-3 text-xs">
              <span
                className={
                  reasonLength < 10
                    ? "text-[var(--chayong-danger)]"
                    : "text-[var(--chayong-text-caption)]"
                }
              >
                {reasonLength < 10
                  ? `10자 이상 입력해야 제출할 수 있습니다.`
                  : "사유 입력 완료"}
              </span>
              <span className="text-[var(--chayong-text-caption)]">
                {reasonLength}/1000
              </span>
            </div>
          </div>

          {selectedLevel === "BAN" && (
            <div className="rounded-xl border border-[var(--chayong-danger)] bg-[rgba(240,68,82,0.08)] p-4">
              <div className="flex items-start gap-3">
                <BanIcon className="mt-0.5 size-5 shrink-0 text-[var(--chayong-danger)]" />
                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-[var(--chayong-danger)]">
                    영구 차단 주의
                  </p>
                  <p className="text-xs leading-5 text-[var(--chayong-danger)]/90">
                    BAN 선택 시 계정이 즉시 차단됩니다. 되돌리려면 별도 해제가 필요합니다.
                  </p>
                  <label className="flex items-center gap-2 text-sm text-[var(--chayong-text)]">
                    <input
                      type="checkbox"
                      checked={confirmBan}
                      disabled={submitting}
                      onChange={(event) => setConfirmBan(event.target.checked)}
                    />
                    차단 내용을 확인했습니다.
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[var(--chayong-danger)] bg-[rgba(240,68,82,0.08)] px-4 py-3 text-sm text-[var(--chayong-danger)]">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? "처리 중" : "패널티 적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
