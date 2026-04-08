"use client";

import {
  calcTotalAcquisitionCost,
  calcRemainingPayments,
  calcTotalEffectiveCost,
} from "@/lib/finance/calculations";

interface ListingCostCalculatorProps {
  initialCost: number;
  transferFee: number;
  monthlyPayment: number;
  remainingMonths: number;
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.round((amount % 100_000_000) / 10_000);
    return man > 0 ? `${eok}억 ${man.toLocaleString("ko-KR")}만원` : `${eok}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function ListingCostCalculator({
  initialCost,
  transferFee,
  monthlyPayment,
  remainingMonths,
}: ListingCostCalculatorProps) {
  const acquisitionCost = calcTotalAcquisitionCost({ initialCost, transferFee });
  const remainingPayments = calcRemainingPayments({ monthlyPayment, remainingMonths });
  const totalEffectiveCost = calcTotalEffectiveCost({
    initialCost,
    transferFee,
    monthlyPayment,
    remainingMonths,
  });

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-bg)" }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
        비용 계산
      </h3>

      <div className="flex flex-col gap-2 text-sm">
        {/* Acquisition cost */}
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--chayong-text-sub)" }}>총 인수 비용</span>
          <span className="font-medium" style={{ color: "var(--chayong-text)" }}>
            {formatKRW(acquisitionCost)}
          </span>
        </div>

        {/* Sub-rows */}
        <div
          className="ml-3 flex flex-col gap-1.5 rounded-lg p-3 text-xs"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--chayong-text-caption)" }}>보증금</span>
            <span style={{ color: "var(--chayong-text-sub)" }}>{formatKRW(initialCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--chayong-text-caption)" }}>승계 수수료</span>
            <span style={{ color: "var(--chayong-text-sub)" }}>{formatKRW(transferFee)}</span>
          </div>
        </div>

        <div
          className="border-t pt-2"
          style={{ borderColor: "var(--chayong-divider)" }}
        />

        {/* Remaining payments */}
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--chayong-text-sub)" }}>
            남은 총 납입금
            <span className="ml-1 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
              ({monthlyPayment.toLocaleString("ko-KR")}원 × {remainingMonths}개월)
            </span>
          </span>
          <span className="font-medium" style={{ color: "var(--chayong-text)" }}>
            {formatKRW(remainingPayments)}
          </span>
        </div>

        <div
          className="border-t pt-2"
          style={{ borderColor: "var(--chayong-divider)" }}
        />

        {/* Total effective cost */}
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: "var(--chayong-text)" }}>
            실질 총 비용
          </span>
          <span className="text-base font-bold" style={{ color: "var(--chayong-primary)" }}>
            {formatKRW(totalEffectiveCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
