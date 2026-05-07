"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PenaltyModal } from "@/features/admin/components/penalty-modal";
import { ReportResolveModal } from "@/features/admin/components/report-resolve-modal";

type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";
type ReportTargetType = "LISTING" | "MESSAGE" | "PROFILE" | "REVIEW";

export type ReportRow = {
  id: string;
  status: ReportStatus;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  resolution: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    name: string | null;
    email: string;
  };
};

type ReportAdminTableProps = {
  reports: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "대기",
  REVIEWED: "처리됨",
  DISMISSED: "기각",
};

const STATUS_TONES: Record<ReportStatus, { bg: string; color: string }> = {
  PENDING: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  REVIEWED: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  DISMISSED: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  LISTING: "매물",
  MESSAGE: "메시지",
  PROFILE: "프로필",
  REVIEW: "후기",
};

const TARGET_TONES: Record<ReportTargetType, { bg: string; color: string }> = {
  LISTING: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  MESSAGE: { bg: "var(--chayong-surface)", color: "var(--chayong-text-sub)" },
  PROFILE: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  REVIEW: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

function formatShortId(value: string) {
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

function formatReporterLabel(reporter: ReportRow["reporter"]) {
  return reporter.name?.trim().length ? reporter.name : reporter.email;
}

export function ReportAdminTable({
  reports,
  total,
  page,
  pageSize,
}: ReportAdminTableProps) {
  const router = useRouter();
  const [selectedResolveReport, setSelectedResolveReport] =
    useState<ReportRow | null>(null);
  const [selectedPenaltyReport, setSelectedPenaltyReport] =
    useState<ReportRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleResolved = () => {
    router.refresh();
    setSelectedResolveReport(null);
  };

  const handlePenaltyApplied = () => {
    router.refresh();
    setSelectedPenaltyReport(null);
  };

  return (
    <>
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{
            borderColor: "var(--chayong-divider)",
            backgroundColor: "var(--chayong-surface)",
          }}
        >
          <div className="grid gap-0.5">
            <p className="text-sm font-medium text-[var(--chayong-text)]">
              신고 목록
            </p>
            <p className="text-xs text-[var(--chayong-text-caption)]">
              총 {total.toLocaleString("ko-KR")}건 · {page}/{totalPages} 페이지
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
                {["신고일", "대상유형", "대상ID", "사유", "신고자", "상태", "액션"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: "var(--chayong-text-sub)" }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    처리할 신고가 없습니다.
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => {
                  const statusTone =
                    STATUS_TONES[report.status] ?? STATUS_TONES.PENDING;
                  const targetTone =
                    TARGET_TONES[report.targetType] ?? TARGET_TONES.LISTING;
                  const canResolve = report.status === "PENDING";
                  const canPenalty =
                    report.targetType === "PROFILE" ||
                    report.targetType === "REVIEW";

                  return (
                    <tr
                      key={report.id}
                      style={{
                        borderTop:
                          index > 0
                            ? "1px solid var(--chayong-divider)"
                            : undefined,
                        backgroundColor: "var(--chayong-bg)",
                      }}
                    >
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--chayong-text-caption)" }}
                      >
                        {formatDate(report.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: targetTone.bg,
                            color: targetTone.color,
                          }}
                        >
                          {TARGET_LABELS[report.targetType]}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs"
                          title={report.targetId}
                          style={{ color: "var(--chayong-text)" }}
                        >
                          {formatShortId(report.targetId)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="max-w-[24rem] grid gap-1">
                          <p
                            className="font-medium text-[var(--chayong-text)]"
                            title={report.reason}
                          >
                            {report.reason}
                          </p>
                          {report.description ? (
                            <p
                              className="text-xs leading-5 text-[var(--chayong-text-caption)]"
                              title={report.description}
                            >
                              {report.description}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="grid gap-0.5">
                          <p style={{ color: "var(--chayong-text)" }}>
                            {formatReporterLabel(report.reporter)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--chayong-text-caption)" }}
                          >
                            {report.reporter.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: statusTone.bg,
                            color: statusTone.color,
                          }}
                        >
                          {STATUS_LABELS[report.status]}
                        </span>
                        {report.reviewedAt ? (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--chayong-text-caption)" }}
                          >
                            {formatDate(report.reviewedAt)}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canResolve ? (
                            <Button
                              type="button"
                              size="xs"
                              className="bg-[var(--chayong-primary)] text-white hover:bg-[var(--chayong-primary)]/90"
                              onClick={() => setSelectedResolveReport(report)}
                            >
                              처분
                            </Button>
                          ) : null}

                          {canPenalty ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="destructive"
                              onClick={() => setSelectedPenaltyReport(report)}
                            >
                              패널티
                            </Button>
                          ) : null}

                          {!canResolve && !canPenalty ? (
                            <span
                              className="text-xs"
                              style={{ color: "var(--chayong-text-caption)" }}
                            >
                              -
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedResolveReport ? (
        <ReportResolveModal
          reportId={selectedResolveReport.id}
          isOpen={Boolean(selectedResolveReport)}
          onClose={() => setSelectedResolveReport(null)}
          onResolved={handleResolved}
          targetType={selectedResolveReport.targetType}
          targetSummary={`${TARGET_LABELS[selectedResolveReport.targetType]} · ${formatShortId(selectedResolveReport.targetId)}`}
        />
      ) : null}

      {selectedPenaltyReport ? (
        <PenaltyModal
          profileId={selectedPenaltyReport.targetId}
          currentLevel="NONE"
          userLabel={`${TARGET_LABELS[selectedPenaltyReport.targetType]} · ${formatShortId(selectedPenaltyReport.targetId)}`}
          isOpen={Boolean(selectedPenaltyReport)}
          onClose={() => setSelectedPenaltyReport(null)}
          onApplied={handlePenaltyApplied}
        />
      ) : null}
    </>
  );
}
