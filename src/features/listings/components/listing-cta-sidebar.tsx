"use client";

import type { ComponentProps } from "react";
import { Calculator, Heart, ShieldCheck } from "lucide-react";
import { PriceDisplay } from "@/components/ui/price-display";
import { ChatInquiryModal } from "@/features/chat/components/chat-inquiry-modal";
import { useFavorite } from "@/features/listings/hooks/use-favorite";

type InitialChatRoom = ComponentProps<typeof ChatInquiryModal>["initialRoom"];

interface ListingCtaSidebarProps {
  monthlyPayment: number;
  initialCost: number;
  remainingMonths: number;
  listingId: string;
  listingName?: string;
  initialChatRoom?: InitialChatRoom;
  initialFavoriteCount?: number;
}

function formatInitialCost(initialCost: number) {
  if (initialCost <= 0) {
    return "0원";
  }

  return `${Math.round(initialCost / 10_000).toLocaleString("ko-KR")}만원`;
}

function formatWon(value: number) {
  return `${Math.max(0, Math.round(value)).toLocaleString("ko-KR")}원`;
}

export function ListingCtaSidebar({
  monthlyPayment,
  initialCost,
  remainingMonths,
  listingId,
  listingName = "매물",
  initialChatRoom,
  initialFavoriteCount = 0,
}: ListingCtaSidebarProps) {
  const { isFavorited, count, loading, toggle } = useFavorite(listingId, initialFavoriteCount);
  const estimatedTotalPayment = Math.max(0, monthlyPayment) * Math.max(0, remainingMonths);
  const summaryItems = [
    { label: "초기비용", value: formatInitialCost(initialCost) },
    { label: "잔여기간", value: `${Math.max(0, remainingMonths)}개월` },
    { label: "예상 총 납입", value: formatWon(estimatedTotalPayment) },
    { label: "승계 진행", value: "상담 후 확인" },
  ];

  return (
    <div
      className="rounded-xl border chayong-shadow-float p-5"
      style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-bg)" }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "var(--chayong-primary-light)", color: "var(--chayong-primary)" }}
        >
          검수완료
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
        >
          안심거래
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}
        >
          비용계산
        </span>
      </div>

      <div className="mb-1 min-w-0">
        <PriceDisplay monthlyPayment={monthlyPayment} size="lg" />
      </div>

      <p className="mb-4 text-sm leading-5" style={{ color: "var(--chayong-text-caption)" }}>
        월 납입 기준으로 조건을 빠르게 확인하고, 상담에서 승계 가능 여부를 안내받으세요.
      </p>

      <div className="mb-5 grid gap-3 rounded-xl border p-4 sm:grid-cols-2" style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-surface)" }}>
        {summaryItems.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-xs font-medium leading-4" style={{ color: "var(--chayong-text-caption)" }}>
              {item.label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold tabular-nums leading-5" style={{ color: "var(--chayong-text)" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <ChatInquiryModal
          listingId={listingId}
          listingName={listingName}
          monthlyPayment={monthlyPayment}
          initialRoom={initialChatRoom}
          className="flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          <ShieldCheck size={16} className="shrink-0" />
          <span className="truncate">채팅 문의하기</span>
        </ChatInquiryModal>

        <button
          type="button"
          disabled
          className="flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-80"
          style={{
            borderColor: "var(--chayong-border)",
            color: "var(--chayong-text-sub)",
            backgroundColor: "var(--chayong-bg)",
          }}
        >
          <Calculator size={16} className="shrink-0" />
          <span className="truncate">비용 계산 안내</span>
        </button>

        <p className="text-xs leading-5" style={{ color: "var(--chayong-text-caption)" }}>
          예상 총 납입액과 초기비용을 먼저 확인한 뒤, 상담에서 상세 조건을 조정하세요.
        </p>

        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-60"
          style={{
            borderColor: isFavorited ? "#ef4444" : "var(--chayong-border)",
            color: isFavorited ? "#ef4444" : "var(--chayong-text-sub)",
            backgroundColor: "var(--chayong-bg)",
          }}
        >
          <Heart
            size={16}
            className="shrink-0"
            fill={isFavorited ? "#ef4444" : "none"}
            stroke={isFavorited ? "#ef4444" : "currentColor"}
          />
          <span className="truncate">찜하기</span>
          {count > 0 && (
            <span
              className="ml-1 shrink-0 text-sm font-normal tabular-nums"
              style={{ color: isFavorited ? "#ef4444" : "var(--chayong-text-caption)" }}
            >
              {count.toLocaleString("ko-KR")}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
