import Link from "next/link";
import Image from "next/image";
import { Eye, Heart } from "lucide-react";
import type { ListingCardData } from "@/types";
import { PriceDisplay } from "./price-display";
import { TrustBadge } from "./trust-badge";

interface VehicleCardProps {
  listing: ListingCardData;
}

export function VehicleCard({ listing }: VehicleCardProps) {
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
    viewCount,
    favoriteCount,
    primaryImage,
  } = listing;

  const vehicleName = `${brand} ${model}`;
  const subtitle = [year && `${year}년`, trim, mileage && `${mileage.toLocaleString("ko-KR")}km`]
    .filter(Boolean)
    .join(" · ");

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
