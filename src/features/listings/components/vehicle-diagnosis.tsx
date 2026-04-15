"use client";

import { useState } from "react";
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
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Detail grid items ─────────────────────────────────────────────────────────

interface DetailItem {
  label: string;
  value: string;
  valueColor?: string;
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
  const { accidentCount, exteriorGrade, interiorGrade, inspectionDate, inspectionReportUrl } =
    props;
  const detailItems = buildDetailItems(props);
  const isAccidentFree = accidentCount === 0;

  return (
    <section aria-label="차량 진단" className="space-y-4">
      <h2 className="text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
        차량 진단
      </h2>

      {/* Summary cards */}
      <div className="flex gap-3">
        {/* Accident summary */}
        <div
          className={`flex flex-1 flex-col items-center rounded-xl border p-4 ${
            isAccidentFree
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <span
            className={`text-xs font-medium ${isAccidentFree ? "text-green-600" : "text-red-500"}`}
          >
            사고 이력
          </span>
          <span
            className={`mt-1 text-lg font-bold ${isAccidentFree ? "text-green-700" : "text-red-600"}`}
          >
            {isAccidentFree ? "무사고" : `${accidentCount}회`}
          </span>
        </div>

        {/* Exterior grade */}
        <div
          className="flex flex-1 flex-col items-center rounded-xl border p-4"
          style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-surface)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--chayong-text-caption)" }}>
            외관 등급
          </span>
          <div className="mt-1">
            <GradeBadge grade={exteriorGrade} />
          </div>
        </div>

        {/* Interior grade */}
        <div
          className="flex flex-1 flex-col items-center rounded-xl border p-4"
          style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-surface)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--chayong-text-caption)" }}>
            실내 등급
          </span>
          <div className="mt-1">
            <GradeBadge grade={interiorGrade} />
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {detailItems.map(({ label, value, valueColor }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b px-4 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                {label}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: valueColor ?? "var(--chayong-text)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: inspection date + report link */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          진단일: {formatInspectionDate(inspectionDate)}
        </span>
        {inspectionReportUrl ? (
          <>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50"
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
            className="cursor-not-allowed rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-40"
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
