"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PriceDisplay } from "@/components/ui/price-display";
import { useFavorite } from "@/features/listings/hooks/use-favorite";

interface ListingCtaSidebarProps {
  monthlyPayment: number;
  initialCost: number;
  remainingMonths: number;
  listingId: string;
  initialFavoriteCount?: number;
}

export function ListingCtaSidebar({
  monthlyPayment,
  initialCost,
  remainingMonths,
  listingId,
  initialFavoriteCount = 0,
}: ListingCtaSidebarProps) {
  const { isFavorited, count, loading, toggle } = useFavorite(listingId, initialFavoriteCount);

  return (
    <div
      className="rounded-xl border chayong-shadow-float p-5"
      style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-bg)" }}
    >
      {/* Price */}
      <div className="mb-1">
        <PriceDisplay monthlyPayment={monthlyPayment} size="lg" />
      </div>

      {/* Meta */}
      <p className="mb-5 text-sm" style={{ color: "var(--chayong-text-caption)" }}>
        초기비용 {initialCost ? `${Math.round(initialCost / 10_000).toLocaleString("ko-KR")}만원` : "없음"}
        {" · "}
        잔여 {remainingMonths}개월
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <Link
          href={`/chat?listing=${listingId}`}
          className="flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          상담 신청하기
        </Link>

        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-60"
          style={{
            borderColor: isFavorited ? "#ef4444" : "var(--chayong-border)",
            color: isFavorited ? "#ef4444" : "var(--chayong-text-sub)",
            backgroundColor: "var(--chayong-bg)",
          }}
        >
          <Heart
            size={16}
            fill={isFavorited ? "#ef4444" : "none"}
            stroke={isFavorited ? "#ef4444" : "currentColor"}
          />
          찜하기
          {count > 0 && (
            <span className="text-sm font-normal" style={{ color: isFavorited ? "#ef4444" : "var(--chayong-text-caption)" }}>
              {count.toLocaleString("ko-KR")}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
