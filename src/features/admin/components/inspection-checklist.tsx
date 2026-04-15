"use client"

import { useState } from "react"
import {
  DEFAULT_INSPECTION_CHECKLIST,
  INSPECTION_LABELS,
  INSPECTION_SECTION_LABELS,
  type InspectionChecklist,
} from "@/types/admin"

interface Props {
  initial?: InspectionChecklist | null
  onChange: (checklist: InspectionChecklist) => void
}

const SECTIONS = ["exterior", "drivetrain", "consumables", "documents"] as const
type Section = (typeof SECTIONS)[number]

// Count total items across all sections
function countItems(): number {
  return SECTIONS.reduce(
    (acc, section) => acc + Object.keys(INSPECTION_LABELS[section]).length,
    0
  )
}

// Count how many items are checked in the checklist
function countChecked(checklist: InspectionChecklist): number {
  return SECTIONS.reduce((acc, section) => {
    const sectionData = checklist[section] as Record<string, boolean>
    return acc + Object.values(sectionData).filter(Boolean).length
  }, 0)

}

export function isAllChecked(checklist: InspectionChecklist): boolean {
  return countChecked(checklist) === countItems()
}

export function InspectionChecklistForm({ initial, onChange }: Props) {
  const [checklist, setChecklist] = useState<InspectionChecklist>(
    initial ?? DEFAULT_INSPECTION_CHECKLIST
  )

  const totalItems = countItems()
  const checkedCount = countChecked(checklist)
  const allChecked = checkedCount === totalItems

  function toggleItem(section: Section, key: string) {
    const updated: InspectionChecklist = {
      ...checklist,
      [section]: {
        ...(checklist[section] as Record<string, boolean>),
        [key]: !(checklist[section] as Record<string, boolean>)[key],
      },
    }
    setChecklist(updated)
    onChange(updated)
  }

  function setMemo(memo: string) {
    const updated: InspectionChecklist = { ...checklist, memo }
    setChecklist(updated)
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--chayong-text-sub)]">점검 항목</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: allChecked ? "var(--chayong-success)" : "var(--chayong-primary)" }}
          >
            {checkedCount}/{totalItems}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--chayong-divider)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(checkedCount / totalItems) * 100}%`,
              backgroundColor: allChecked
                ? "var(--chayong-success)"
                : "var(--chayong-primary)",
            }}
          />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionData = checklist[section] as Record<string, boolean>
        const keys = Object.keys(INSPECTION_LABELS[section])

        return (
          <div key={section} className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-[var(--chayong-text-sub)] uppercase tracking-wide">
              {INSPECTION_SECTION_LABELS[section]}
            </p>
            <div className="flex flex-col gap-1">
              {keys.map((key) => {
                const checked = sectionData[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleItem(section, key)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: checked ? "#ECFDF5" : "var(--chayong-surface)",
                      color: checked ? "#065F46" : "var(--chayong-text)",
                    }}
                  >
                    {/* Checkbox visual */}
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
                      style={{
                        borderColor: checked ? "#10B981" : "var(--chayong-caption)",
                        backgroundColor: checked ? "#10B981" : "transparent",
                      }}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 12 10"
                          fill="none"
                          className="h-3 w-3"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="1,5 4.5,8.5 11,1" />
                        </svg>
                      )}
                    </span>
                    {INSPECTION_LABELS[section][key]}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Memo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--chayong-text-sub)] uppercase tracking-wide">
          메모
        </label>
        <textarea
          value={checklist.memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="점검 특이사항을 입력하세요"
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--chayong-divider)] bg-[var(--chayong-surface)] px-3 py-2.5 text-sm text-[var(--chayong-text)] placeholder:text-[var(--chayong-caption)] focus:border-[var(--chayong-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--chayong-primary)]/20"
        />
      </div>
    </div>
  )
}
