"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

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

type EvidenceItem = {
  key: string;
  url: string;
  name: string;
};

const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setDescription("");
      setSubmitting(false);
      setEvidenceItems([]);
      setUploading(false);
      return;
    }

    setReason("");
    setDescription("");
    setSubmitting(false);
    setEvidenceItems([]);
    setUploading(false);
  }, [isOpen, targetId, targetType]);

  const descriptionCount = description.length;
  const canSubmit = Boolean(reason) && !submitting && !uploading;
  const summaryText = getTargetSummary(targetType, targetSummary);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting && !uploading) {
      onClose();
    }
  };

  const validateEvidenceFile = (file: File) => {
    if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
      return "허용되지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)";
    }

    if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
      return "파일 크기는 10MB 이하여야 합니다.";
    }

    return null;
  };

  const handleEvidenceFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    if (files.length === 0 || uploading || submitting) {
      input.value = "";
      return;
    }

    const remainingSlots = MAX_EVIDENCE_FILES - evidenceItems.length;
    if (remainingSlots <= 0) {
      window.alert("증거 이미지는 최대 5개까지 첨부할 수 있습니다.");
      input.value = "";
      return;
    }

    const validFiles: File[] = [];
    let hadValidationError = false;

    for (const file of files) {
      if (validFiles.length >= remainingSlots) {
        break;
      }

      const validationError = validateEvidenceFile(file);
      if (validationError) {
        hadValidationError = true;
        window.alert(validationError);
        continue;
      }

      validFiles.push(file);
    }

    if (files.length > remainingSlots) {
      hadValidationError = true;
      window.alert("증거 이미지는 최대 5개까지 첨부할 수 있습니다.");
    }

    if (validFiles.length === 0) {
      input.value = "";
      if (hadValidationError) {
        setUploading(false);
      }
      return;
    }

    setUploading(true);

    try {
      const uploadedItems: EvidenceItem[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "reports");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const body = (await response.json().catch(() => ({}))) as {
          error?: unknown;
          url?: unknown;
          path?: unknown;
        };

        if (!response.ok) {
          const errorMessage =
            typeof body.error === "string" && body.error.trim().length > 0
              ? body.error
              : "증거 이미지 업로드에 실패했습니다.";
          window.alert(errorMessage);
          continue;
        }

        if (
          typeof body.url !== "string" ||
          body.url.trim().length === 0 ||
          typeof body.path !== "string" ||
          body.path.trim().length === 0
        ) {
          window.alert("증거 이미지 업로드에 실패했습니다.");
          continue;
        }

        uploadedItems.push({
          key: body.path,
          url: body.url,
          name: file.name,
        });
      }

      if (uploadedItems.length > 0) {
        setEvidenceItems((current) => [...current, ...uploadedItems]);
      }
    } catch {
      window.alert("증거 이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const handleRemoveEvidence = (key: string) => {
    if (submitting || uploading) {
      return;
    }

    setEvidenceItems((current) => current.filter((item) => item.key !== key));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reason || submitting || uploading) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: {
        targetType: ReportTargetType;
        targetId: string;
        reason: ReportReason;
        description?: string;
        evidenceKeys?: string[];
      } = {
        targetType,
        targetId,
        reason,
      };

      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0) {
        payload.description = trimmedDescription;
      }

      if (evidenceItems.length > 0) {
        payload.evidenceKeys = evidenceItems.map((item) => item.key);
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
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-2xl"
        showCloseButton={!submitting && !uploading}
      >
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
          <DialogDescription>
            신고 사유를 선택하고 필요한 경우 보충 설명을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]"
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-1">
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

            <section className="grid gap-3 rounded-2xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--chayong-text)]">
                    증거 이미지
                  </p>
                  <p className="mt-1 text-xs text-[var(--chayong-text-caption)]">
                    JPEG, PNG, WebP만 가능 · 최대 5개 · 파일당 10MB 이하
                  </p>
                </div>
                <span className="text-xs text-[var(--chayong-text-caption)]">
                  {evidenceItems.length}/{MAX_EVIDENCE_FILES}
                </span>
              </div>

              {evidenceItems.length > 0 ? (
                <div className="grid gap-2">
                  {evidenceItems.map((item, index) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-bg)] p-2.5"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--chayong-surface)]">
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--chayong-text)]">
                          증거 이미지 {index + 1}
                        </p>
                        <p className="truncate text-xs text-[var(--chayong-text-caption)]">
                          {item.name}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEvidence(item.key)}
                        disabled={submitting || uploading}
                        className="shrink-0 text-[var(--chayong-text-caption)] hover:text-[var(--chayong-text)]"
                        aria-label={`${item.name} 제거`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {evidenceItems.length < MAX_EVIDENCE_FILES ? (
                <label
                  className={cn(
                    "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
                    uploading
                      ? "cursor-not-allowed border-[var(--chayong-divider)] bg-[var(--chayong-bg)] text-[var(--chayong-text-caption)]"
                      : "border-[var(--chayong-divider)] bg-[var(--chayong-bg)] text-[var(--chayong-text-caption)] hover:border-[var(--chayong-primary)] hover:bg-[var(--chayong-primary-light)]/20"
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--chayong-primary)]" />
                      <span className="text-sm font-medium text-[var(--chayong-text)]">
                        업로드 중...
                      </span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-sm font-medium text-[var(--chayong-text)]">
                        증거 이미지 추가
                      </span>
                      <span className="text-xs">
                        클릭하거나 파일을 선택하세요.
                      </span>
                    </>
                  )}
                  <input
                    ref={evidenceInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleEvidenceFileChange}
                    disabled={submitting || uploading}
                  />
                </label>
              ) : null}
            </section>

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
                disabled={submitting || uploading}
              />
            </section>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-[var(--chayong-divider)] bg-background px-0 pb-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting || uploading}
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
