"use client";

import { PriceDisplay } from "@/components/ui/price-display";
import { ChatInquiryModal } from "@/features/chat/components/chat-inquiry-modal";

interface MobileCTABarProps {
  monthlyPayment: number;
  listingId: string;
  listingName?: string;
}

export function MobileCTABar({
  monthlyPayment,
  listingId,
  listingName = "매물",
}: MobileCTABarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-3 md:hidden"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <PriceDisplay monthlyPayment={monthlyPayment} size="sm" />
        <ChatInquiryModal
          listingId={listingId}
          listingName={listingName}
          monthlyPayment={monthlyPayment}
          className="flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          상담 신청하기
        </ChatInquiryModal>
      </div>
    </div>
  );
}
