"use client";

import Link from "next/link";
import { PriceDisplay } from "@/components/ui/price-display";

interface MobileCTABarProps {
  monthlyPayment: number;
  listingId: string;
}

export function MobileCTABar({ monthlyPayment, listingId }: MobileCTABarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-3 md:hidden"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <PriceDisplay monthlyPayment={monthlyPayment} size="sm" />
        <Link
          href={`/chat?listing=${listingId}`}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          상담 신청하기
        </Link>
      </div>
    </div>
  );
}
