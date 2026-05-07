"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Grade } from "@/types";

const InspectionReportViewer = dynamic(
  () => import("./inspection-report-viewer").then((m) => m.InspectionReportViewer),
  { ssr: false },
);

interface VehicleDiagnosisProps {
  accidentCount: number;
  ownerCount: number;
  exteriorGrade: Grade | null;
  interiorGrade: Grade | null;
  mileageVerified: boolean;
  inspectionDate: Date | string | null;
  inspectionReportUrl: string | null;
}

// ─── Grade helpers ─────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<Grade, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  B: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  C: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
};

const GRADE_CONDITION: Record<Grade, string> = {
  A: "매우 양호",
  B: "양호",
  C: "보통",
};

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "accent";
}) {
  const toneClasses = {
    neutral: "border-[color:var(--chayong-border)] bg-[color:var(--chayong-surface)] text-[color:var(--chayong-text-caption)]",
    success: "border-green-200 bg-green-50 text-green-700",
    accent: "border-[color:color-mix(in_srgb,var(--chayong-primary)_18%,white)] bg-[color:color-mix(in_srgb,var(--chayong-primary)_10%,white)] text-[color:var(--chayong-primary)]",
  }[tone];

  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${toneClasses}`}>
      {label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: Grade | null }) {
  if (!grade) {
    return (
      <span
        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold"
        style={{ borderColor: "var(--chayong-border)", color: "var(--chayong-text-caption)" }}
      >
        미진단
      </span>
    );
  }

  const { bg, text, border } = GRADE_COLOR[grade];
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold ${bg} ${text} ${border}`}
    >
      {grade}등급
    </span>
  );
}

function formatInspectionDate(date: Date | string | null): string {
  if (!date) return "미진단";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "미진단";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Detail grid items ─────────────────────────────────────────────────────────

interface DetailItem {
  label: string;
  value: string;
  valueColor?: string;
}

interface SummaryItem {
  label: string;
  note: string;
  tone: "neutral" | "success" | "accent";
  valueLabel?: string;
  valueNode?: ReactNode;
}

function buildDetailItems(props: VehicleDiagnosisProps): DetailItem[] {
  const exteriorCondition = props.exteriorGrade ? GRADE_CONDITION[props.exteriorGrade] : "미진단";

  return [
    {
      label: "주행거리 검증",
      value: props.mileageVerified ? "인증됨" : "미인증",
      valueColor: props.mileageVerified ? "var(--chayong-success, #00C471)" : undefined,
    },
    {
      label: "소유자 이력",
      value: `${props.ownerCount}인 소유`,
    },
    {
      label: "외부 패널",
      value:
        props.accidentCount === 0
          ? "판금 0건 / 교환 0건"
          : `사고 ${props.accidentCount}회`,
      valueColor: props.accidentCount > 0 ? "#F04452" : undefined,
    },
    {
      label: "실내외관",
      value: exteriorCondition,
    },
    {
      label: "타이어/소모품",
      value: "양호",
    },
    {
      label: "하체",
      value: "이상없음",
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VehicleDiagnosis(props: VehicleDiagnosisProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const {
    accidentCount,
    ownerCount,
    exteriorGrade,
    interiorGrade,
    inspectionDate,
    inspectionReportUrl,
  } = props;
  const detailItems = buildDetailItems(props);
  const isAccidentFree = accidentCount === 0;
  const isMileageVerified = props.mileageVerified;
  const hasInspectionDate = Boolean(inspectionDate);

  const summaryItems: SummaryItem[] = [
    {
      label: "사고 이력",
      tone: isAccidentFree ? "success" : "accent",
      note: isAccidentFree ? "외관 손상 이력 없음" : "사고/수리 이력 확인 필요",
      valueLabel: isAccidentFree ? "무사고" : `${accidentCount}회`,
    },
    {
      label: "소유자 이력",
      tone: ownerCount === 1 ? "success" : "neutral",
      note: ownerCount === 1 ? "단일 소유 이력" : "소유자 변경 횟수 확인",
      valueLabel: `${ownerCount}인 소유`,
    },
    {
      label: "외관 등급",
      tone: exteriorGrade ? "accent" : "neutral",
      note: exteriorGrade ? GRADE_CONDITION[exteriorGrade] : "외관 진단 정보 없음",
      valueNode: <GradeBadge grade={exteriorGrade} />,
    },
    {
      label: "실내 등급",
      tone: interiorGrade ? "accent" : "neutral",
      note: interiorGrade ? GRADE_CONDITION[interiorGrade] : "실내 진단 정보 없음",
      valueNode: <GradeBadge grade={interiorGrade} />,
    },
    {
      label: "주행거리",
      tone: isMileageVerified ? "success" : "neutral",
      note: isMileageVerified ? "계기반 기록과 검수값 일치" : "주행거리 인증 필요",
      valueLabel: isMileageVerified ? "확인됨" : "미확인",
    },
  ] as const;

  return (
    <section aria-label="차량 진단" className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
            차량 진단
          </h2>
          <StatusPill label="검수 리포트" tone="accent" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={isMileageVerified ? "주행거리 확인" : "주행거리 미확인"} tone={isMileageVerified ? "success" : "neutral"} />
          <StatusPill label={isAccidentFree ? "무사고" : "사고 이력 확인"} tone={isAccidentFree ? "success" : "neutral"} />
          <StatusPill label={hasInspectionDate ? "점검일 등록" : "점검일 미등록"} tone={hasInspectionDate ? "accent" : "neutral"} />
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-surface)" }}
      >
        <div className="grid gap-px bg-[color:var(--chayong-divider)] sm:grid-cols-2 xl:grid-cols-5">
          {summaryItems.map(({ label, tone, note, valueLabel, valueNode }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col gap-2 bg-white p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {label}
                </span>
                {valueNode ?? <StatusPill label={valueLabel ?? "미진단"} tone={tone} />}
              </div>
              <p className="min-w-0 text-sm font-semibold leading-5 break-words" style={{ color: "var(--chayong-text)" }}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {detailItems.map(({ label, value, valueColor }) => (
            <div
              key={label}
              className="flex min-w-0 items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <span
                className="shrink-0 text-xs font-medium leading-5"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                {label}
              </span>
              <span
                className="min-w-0 text-right text-sm font-semibold leading-5 break-words"
                style={{ color: valueColor ?? "var(--chayong-text)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: inspection date + report link */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs leading-5" style={{ color: "var(--chayong-text-caption)" }}>
          진단일: {formatInspectionDate(inspectionDate)}
        </span>
        {inspectionReportUrl ? (
          <>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-gray-50 sm:w-auto"
              style={{
                borderColor: "var(--chayong-primary)",
                color: "var(--chayong-primary)",
              }}
            >
              점검기록부 보기
            </button>
            <InspectionReportViewer
              url={inspectionReportUrl}
              open={viewerOpen}
              onOpenChange={setViewerOpen}
            />
          </>
        ) : (
          <button
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold opacity-40 sm:w-auto"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-caption)",
            }}
          >
            점검기록부 보기
          </button>
        )}
      </div>
    </section>
  );
}
