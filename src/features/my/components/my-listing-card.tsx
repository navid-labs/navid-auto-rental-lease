"use client";

import Link from "next/link";
import { PriceDisplay } from "@/components/ui/price-display";
import type { Listing, ListingStatus } from "@/types";

interface MyListingCardProps {
  listing: Pick<
    Listing,
    "id" | "brand" | "model" | "year" | "monthlyPayment" | "status" | "createdAt"
  >;
}

const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: "임시저장",
  PENDING: "승인 대기",
  ACTIVE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
  HIDDEN: "숨김",
};

const STATUS_STYLE: Record<ListingStatus, { bg: string; color: string }> = {
  DRAFT: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
  PENDING: { bg: "#fef9c3", color: "#a16207" },
  ACTIVE: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  RESERVED: { bg: "#e0f2fe", color: "#0369a1" },
  SOLD: { bg: "#dcfce7", color: "#16a34a" },
  HIDDEN: { bg: "#fee2e2", color: "#dc2626" },
};

export function MyListingCard({ listing }: MyListingCardProps) {
  const { id, brand, model, year, monthlyPayment, status, createdAt } = listing;

  const vehicleName =
    [brand, model].filter(Boolean).join(" ") || "차량 정보 미입력";
  const statusLabel = STATUS_LABEL[status];
  const statusStyle = STATUS_STYLE[status];

  const formattedDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="flex items-center justify-between rounded-xl border p-4"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
          {vehicleName}
          {year && (
            <span
              className="ml-1.5 text-xs font-normal"
              style={{ color: "var(--chayong-text-sub)" }}
            >
              {year}년식
            </span>
          )}
        </p>
        <PriceDisplay monthlyPayment={monthlyPayment} size="sm" />
        <p className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          {formattedDate} 등록
        </p>
      </div>

      <Link
        href={`/detail/${id}`}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          borderColor: "var(--chayong-border)",
          color: "var(--chayong-text-sub)",
        }}
      >
        보기
      </Link>
    </div>
  );
}
