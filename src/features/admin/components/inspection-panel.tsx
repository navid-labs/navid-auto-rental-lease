"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { InspectionChecklistForm, isAllChecked } from "./inspection-checklist"
import {
  DEFAULT_INSPECTION_CHECKLIST,
  VALID_STATUS_TRANSITIONS,
  type InspectionChecklist,
  type KanbanListing,
} from "@/types/admin"
import { formatKRWCompact } from "@/lib/utils/format"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안",
  PENDING: "심사 대기",
  ACTIVE: "판매 중",
  RESERVED: "예약됨",
  SOLD: "판매 완료",
  HIDDEN: "숨김",
}

const TRANSITION_LABELS: Record<string, string> = {
  DRAFT: "초안으로 되돌리기",
  PENDING: "심사 요청",
  ACTIVE: "승인 (활성화)",
  RESERVED: "예약 처리",
  SOLD: "판매 완료 처리",
  HIDDEN: "숨기기",
}

// Grade is a Prisma enum (A/B/C) — use plain string type in client component
type GradeValue = "A" | "B" | "C"

const GRADE_OPTIONS: { value: GradeValue; label: string }[] = [
  { value: "A", label: "A등급 — 최상" },
  { value: "B", label: "B등급 — 양호" },
  { value: "C", label: "C등급 — 보통" },
]

interface Props {
  listing: KanbanListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (listingId: string, status: string) => void
}

export function InspectionPanel({ listing, open, onOpenChange, onStatusChange }: Props) {
  const [checklist, setChecklist] = useState<InspectionChecklist>(DEFAULT_INSPECTION_CHECKLIST)
  const [exteriorGrade, setExteriorGrade] = useState<GradeValue>("B")
  const [interiorGrade, setInteriorGrade] = useState<GradeValue>("B")
  const [rejectionReason, setRejectionReason] = useState("")
  const [saving, setSaving] = useState(false)

  const isPending = listing?.status === "PENDING"
  const allChecked = isAllChecked(checklist)
  const canApprove = allChecked && !saving
  const canReject = rejectionReason.trim().length > 0 && !saving

  async function patchListing(body: Record<string, unknown>): Promise<boolean> {
    if (!listing) return false
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "요청 실패")
      }
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    const ok = await patchListing({
      status: "ACTIVE",
      inspectionChecklist: checklist,
      isVerified: true,
      exteriorGrade,
      interiorGrade,
    })
    if (ok) {
      toast.success("매물이 승인되었습니다")
      onStatusChange(listing!.id, "ACTIVE")
      onOpenChange(false)
      resetForm()
    }
  }

  async function handleReject() {
    const ok = await patchListing({
      status: "DRAFT",
      rejectionReason: rejectionReason.trim(),
      inspectionChecklist: checklist,
    })
    if (ok) {
      toast.success("매물이 반려되었습니다")
      onStatusChange(listing!.id, "DRAFT")
      onOpenChange(false)
      resetForm()
    }
  }

  async function handleTransition(targetStatus: string) {
    const ok = await patchListing({ status: targetStatus })
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[targetStatus] ?? targetStatus}"로 변경되었습니다`)
      onStatusChange(listing!.id, targetStatus)
      onOpenChange(false)
    }
  }

  function resetForm() {
    setChecklist(DEFAULT_INSPECTION_CHECKLIST)
    setExteriorGrade("B")
    setInteriorGrade("B")
    setRejectionReason("")
  }

  const transitions = listing ? (VALID_STATUS_TRANSITIONS[listing.status] ?? []) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] overflow-y-auto p-0 flex flex-col"
      >
        {listing && (
          <>
            {/* Header */}
            <SheetHeader className="border-b border-[var(--chayong-divider)] px-5 py-4">
              <SheetTitle className="text-base font-semibold text-[var(--chayong-text)]">
                {listing.brand} {listing.model}
              </SheetTitle>
              <SheetDescription className="text-sm text-[var(--chayong-text-sub)]">
                {listing.year}년식 · {formatKRWCompact(listing.monthlyPayment)}/월 · {listing.seller.name}
              </SheetDescription>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--chayong-caption)]">현재 상태</span>
                <span className="rounded-full bg-[var(--chayong-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--chayong-text)]">
                  {STATUS_LABELS[listing.status] ?? listing.status}
                </span>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {isPending ? (
                <div className="flex flex-col gap-6">
                  <InspectionChecklistForm initial={null} onChange={setChecklist} />

                  {/* Grade selects */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--chayong-text-sub)]">
                      등급 평가
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[var(--chayong-caption)]">외관 등급</label>
                        <select
                          value={exteriorGrade}
                          onChange={(e) => setExteriorGrade(e.target.value as GradeValue)}
                          className="h-10 w-full rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] px-3 text-sm text-[var(--chayong-text)] focus:border-[var(--chayong-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--chayong-primary)]/20"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[var(--chayong-caption)]">내장 등급</label>
                        <select
                          value={interiorGrade}
                          onChange={(e) => setInteriorGrade(e.target.value as GradeValue)}
                          className="h-10 w-full rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] px-3 text-sm text-[var(--chayong-text)] focus:border-[var(--chayong-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--chayong-primary)]/20"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rejection reason */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--chayong-text-sub)]">
                      반려 사유 (반려 시 필수)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] px-3 py-2.5 text-sm text-[var(--chayong-text)] placeholder:text-[var(--chayong-caption)] focus:border-[var(--chayong-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--chayong-primary)]/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-[var(--chayong-text-sub)]">상태를 변경합니다.</p>
                  {transitions.map((targetStatus) => (
                    <button
                      key={targetStatus}
                      type="button"
                      onClick={() => handleTransition(targetStatus)}
                      disabled={saving}
                      className="h-11 w-full rounded-xl bg-[var(--chayong-surface)] text-[15px] font-semibold text-[var(--chayong-text)] transition-colors hover:bg-[var(--chayong-divider)] disabled:opacity-40"
                    >
                      {TRANSITION_LABELS[targetStatus] ?? targetStatus}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: approve/reject buttons for PENDING */}
            {isPending && (
              <div className="border-t border-[var(--chayong-divider)] px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!canReject}
                  className="h-11 flex-1 rounded-xl bg-[#FEF2F2] text-[15px] font-semibold text-[#DC2626] transition-colors hover:bg-[#FEE2E2] disabled:opacity-40"
                >
                  {saving ? "처리 중…" : "반려"}
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!canApprove}
                  className="h-11 flex-1 rounded-xl bg-[#ECFDF5] text-[15px] font-semibold text-[#065F46] transition-colors hover:bg-[#D1FAE5] disabled:opacity-40"
                >
                  {saving ? "처리 중…" : "승인"}
                </button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
