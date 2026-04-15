"use client";

import Link from "next/link";
import Image from "next/image";
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

export function VehicleCard({ listing, priority = false, showCompare = false }: VehicleCardProps) {
  const {
    id,
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

  function handleCompareClick(e: React.MouseEvent) {
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
      className="group flex flex-col overflow-hidden rounded-xl border bg-[var(--chayong-bg)] shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      {/* Image */}
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

        {/* TrustBadge overlay */}
        {isVerified && (
          <div className="absolute left-2 top-2">
            <TrustBadge variant="compact" />
          </div>
        )}

        {/* Compare button */}
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

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
          {vehicleName}
        </p>
        <p className="truncate text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          {subtitle}
        </p>

        <PriceDisplay monthlyPayment={monthlyPayment} size="md" />

        <div className="flex items-center justify-between text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          <span>
            보증금 {initialCost ? `${(initialCost / 10000).toLocaleString("ko-KR")}만원` : "없음"}
            {remainingMonths ? ` · 잔여 ${remainingMonths}개월` : ""}
          </span>
        </div>

        {/* Options chips */}
        {visibleOptions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleOptions.map((opt) => (
              <span
                key={opt}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]"
              >
                {opt}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Accident count badge */}
        {accidentCount !== undefined && accidentCount !== null && accidentCount > 0 && (
          <span className="text-[10px] font-medium" style={{ color: "var(--chayong-danger)" }}>
            사고 {accidentCount}회
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 border-t pt-2" style={{ borderColor: "var(--chayong-divider)" }}>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            <Eye size={12} />
            {viewCount.toLocaleString("ko-KR")}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            <Heart size={12} />
            {favoriteCount.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
