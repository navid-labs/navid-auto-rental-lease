"use client";

import Link from "next/link";
import Image from "next/image";
import type { MouseEvent } from "react";
import { Eye, Heart, GitCompareArrows } from "lucide-react";
import type { ListingCardData } from "@/types";
import { PriceDisplay } from "./price-display";
import { TrustBadge } from "./trust-badge";
import { useVehicleInteractionStore } from "@/lib/stores/vehicle-interaction-store";
import type { VehicleSummary } from "@/lib/stores/vehicle-interaction-store";

interface VehicleCardProps {
  listing: ListingCardData;
  priority?: boolean;
  showCompare?: boolean;
}

interface CompactInfoPillProps {
  label: string;
  value: string;
  tone?: "default" | "primary" | "danger" | "success";
}

const TYPE_LABEL: Record<ListingCardData["type"], string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

function CompactInfoPill({ label, value, tone = "default" }: CompactInfoPillProps) {
  const toneClasses = {
    default: "border-[var(--chayong-border)] bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]",
    primary: "border-[var(--chayong-primary)]/20 bg-[var(--chayong-primary)]/8 text-[var(--chayong-primary)]",
    danger: "border-[var(--chayong-danger)]/20 bg-[var(--chayong-danger)]/8 text-[var(--chayong-danger)]",
    success: "border-[var(--chayong-success)]/20 bg-[var(--chayong-success)]/8 text-[var(--chayong-success)]",
  } as const;

  return (
    <div
      className={`min-w-0 rounded-lg border px-2 py-1 ${toneClasses[tone]}`}
      aria-label={`${label} ${value}`}
    >
      <p className="text-[10px] leading-none opacity-70">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold tabular-nums leading-tight">{value}</p>
    </div>
  );
}

export function VehicleCard({ listing, priority = false, showCompare = false }: VehicleCardProps) {
  const {
    id,
    type,
    brand,
    model,
    year,
    trim,
    mileage,
    monthlyPayment,
    initialCost,
    remainingMonths,
    isVerified,
    accidentCount,
    mileageVerified,
    viewCount,
    favoriteCount,
    primaryImage,
    options,
  } = listing;

  const toggleComparison = useVehicleInteractionStore((s) => s.toggleComparison);
  const isInComparison = useVehicleInteractionStore((s) => s.isInComparison);
  const inComparison = isInComparison(id);

  const MAX_CHIPS = 5;
  const visibleOptions = options.slice(0, MAX_CHIPS);
  const remainingCount = options.length - MAX_CHIPS;

  const vehicleName = `${brand} ${model}`;
  const subtitle = [year && `${year}년`, trim, mileage && `${mileage.toLocaleString("ko-KR")}km`]
    .filter(Boolean)
    .join(" · ");

  function handleCompareClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const summary: VehicleSummary = {
      id,
      brandName: brand ?? "",
      modelName: model ?? "",
      year: year ?? 0,
      mileage: mileage ?? 0,
      price: monthlyPayment,
      thumbnailUrl: primaryImage,
    };
    toggleComparison(summary);
  }

  return (
    <Link
      href={`/detail/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-[var(--chayong-bg)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--chayong-surface)]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={vehicleName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
              이미지 없음
            </span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-5.5rem)] flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-[var(--chayong-primary-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--chayong-primary)] shadow-sm">
            {TYPE_LABEL[type]}
          </span>
          {isVerified && <TrustBadge variant="compact" />}
          {mileageVerified && (
            <span className="inline-flex items-center rounded-full border border-white/70 bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--chayong-text)] shadow-sm">
              주행 인증
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-5rem)] flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full border border-white/70 bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--chayong-text)] shadow-sm">
            {accidentCount && accidentCount > 0 ? `사고 ${accidentCount}건` : "무사고"}
          </span>
          {remainingMonths ? (
            <span className="inline-flex items-center rounded-full border border-white/70 bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--chayong-text)] shadow-sm">
              잔여 {remainingMonths}개월
            </span>
          ) : null}
        </div>

        {showCompare && (
          <button
            type="button"
            onClick={handleCompareClick}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              inComparison
                ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white"
                : "border-white/70 bg-white/80 text-gray-600 hover:bg-white"
            }`}
            aria-label={inComparison ? "비교 제거" : "비교 추가"}
          >
            <GitCompareArrows size={14} />
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 p-3">
        <p className="truncate text-sm font-semibold leading-snug" style={{ color: "var(--chayong-text)" }}>
          {vehicleName}
        </p>
        <p className="truncate text-xs tabular-nums leading-snug" style={{ color: "var(--chayong-text-caption)" }}>
          {subtitle}
        </p>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PriceDisplay monthlyPayment={monthlyPayment} size="md" />
            <p className="mt-1 text-[11px] tabular-nums leading-snug" style={{ color: "var(--chayong-text-caption)" }}>
              월납입 기준
            </p>
          </div>
          <div className="rounded-lg border border-[var(--chayong-primary)]/20 bg-[var(--chayong-primary)]/10 px-2 py-1 text-right">
            <p className="text-[10px] leading-none" style={{ color: "var(--chayong-text-caption)" }}>
              조건
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums leading-tight" style={{ color: "var(--chayong-primary)" }}>
              {initialCost ? `${(initialCost / 10000).toLocaleString("ko-KR")}만원` : "보증금 없음"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <CompactInfoPill
            label="보증금"
            value={initialCost ? `${(initialCost / 10000).toLocaleString("ko-KR")}만원` : "없음"}
          />
          <CompactInfoPill
            label="잔여기간"
            value={remainingMonths ? `${remainingMonths}개월` : "정보 없음"}
            tone="primary"
          />
          <CompactInfoPill
            label="사고"
            value={accidentCount && accidentCount > 0 ? `${accidentCount}건` : "무사고"}
            tone={accidentCount && accidentCount > 0 ? "danger" : "success"}
          />
          <CompactInfoPill
            label="검수"
            value={isVerified ? "안심매물" : "확인 필요"}
            tone={isVerified ? "success" : "default"}
          />
        </div>

        {visibleOptions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleOptions.map((opt) => (
              <span
                key={opt}
                className="rounded-full bg-[var(--chayong-surface)] px-2 py-0.5 text-[11px] text-[var(--chayong-text-sub)]"
              >
                {opt}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-full bg-[var(--chayong-surface)] px-2 py-0.5 text-[11px] text-[var(--chayong-text-sub)]">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        <div
          className="flex items-center gap-3 border-t pt-2 text-xs"
          style={{ borderColor: "var(--chayong-divider)" }}
        >
          <span className="flex items-center gap-1 tabular-nums" style={{ color: "var(--chayong-text-caption)" }}>
            <Eye size={12} />
            {viewCount.toLocaleString("ko-KR")}
          </span>
          <span className="flex items-center gap-1 tabular-nums" style={{ color: "var(--chayong-text-caption)" }}>
            <Heart size={12} />
            {favoriteCount.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
