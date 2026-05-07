"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/ui/report-modal";

type ReportTarget = {
  targetType: "LISTING" | "PROFILE";
  targetId: string;
  targetSummary?: string;
};

type ReportListingButtonProps = {
  listingId: string;
  sellerId?: string;
  listingTitle?: string;
};

export function ReportListingButton({
  listingId,
  sellerId,
  listingTitle,
}: ReportListingButtonProps) {
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const hasSellerReportLink = Boolean(sellerId?.trim());

  const openListingReport = () => {
    setReportTarget({
      targetType: "LISTING",
      targetId: listingId,
      targetSummary: listingTitle,
    });
  };

  const openSellerReport = () => {
    if (!sellerId) {
      return;
    }

    setReportTarget({
      targetType: "PROFILE",
      targetId: sellerId,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={openListingReport}
        className="border-[var(--chayong-divider)] bg-[var(--chayong-bg)] text-[var(--chayong-text)] hover:bg-[var(--chayong-surface)]"
      >
        <Flag className="size-4" />
        신고
      </Button>

      {hasSellerReportLink ? (
        <Button
          type="button"
          variant="link"
          onClick={openSellerReport}
          className="h-auto px-0 text-[var(--chayong-primary)]"
        >
          딜러/판매자 신고
        </Button>
      ) : null}

      {reportTarget ? (
        <ReportModal
          isOpen
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetSummary={reportTarget.targetSummary}
          onClose={() => setReportTarget(null)}
        />
      ) : null}
    </div>
  );
}
