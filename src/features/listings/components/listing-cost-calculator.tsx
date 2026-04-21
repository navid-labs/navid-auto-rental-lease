"use client";

import {
  calcTotalAcquisitionCost,
  calcRemainingPayments,
  calcTotalEffectiveCost,
} from "@/lib/finance/calculations";
import { formatKRWCompact } from "@/lib/utils/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ListingCostCalculatorProps {
  initialCost: number;
  transferFee: number;
  monthlyPayment: number;
  remainingMonths: number;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

function Row({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--chayong-text-sub)" }}>{label}</span>
      <span
        className={`chayong-tabular-nums ${emphasize ? "font-bold text-base" : "font-medium"}`}
        style={{ color: emphasize ? "var(--chayong-primary)" : "var(--chayong-text)" }}
      >
        {value}
      </span>
    </div>
  );
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
  const safeRemainingMonths = remainingMonths ?? 0;
  const safeTransferFee = transferFee ?? 0;

  return (
    <div
      className="rounded-xl border shadow-sm p-4"
      style={{ borderColor: "var(--chayong-border)", backgroundColor: "var(--chayong-bg)" }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
        비용 계산
      </h3>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl">
          <TabsTrigger value="monthly" className="rounded-lg text-xs">월 납입금</TabsTrigger>
          <TabsTrigger value="total" className="rounded-lg text-xs">총 지출</TabsTrigger>
          <TabsTrigger value="vs-new" className="rounded-lg text-xs">신차 비교</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <div className="flex flex-col gap-2 text-sm">
            {/* Acquisition cost */}
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--chayong-text-sub)" }}>총 인수 비용</span>
              <span className="font-medium" style={{ color: "var(--chayong-text)" }}>
                {formatKRWCompact(acquisitionCost)}
              </span>
            </div>

            {/* Sub-rows */}
            <div
              className="ml-3 flex flex-col gap-1.5 rounded-lg p-3 text-xs"
              style={{ backgroundColor: "var(--chayong-surface)" }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--chayong-text-caption)" }}>보증금</span>
                <span style={{ color: "var(--chayong-text-sub)" }}>{formatKRWCompact(initialCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--chayong-text-caption)" }}>승계 수수료</span>
                <span style={{ color: "var(--chayong-text-sub)" }}>{formatKRWCompact(transferFee)}</span>
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
                {formatKRWCompact(remainingPayments)}
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
                {formatKRWCompact(totalEffectiveCost)}
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="total" className="mt-4 space-y-2 text-sm">
          <Row label="월 납입금 × 잔여 개월" value={`${fmt(monthlyPayment * safeRemainingMonths)}원`} />
          <Row label="초기 비용" value={`${fmt(initialCost)}원`} />
          {safeTransferFee > 0 && <Row label="승계 수수료" value={`${fmt(safeTransferFee)}원`} />}
          <div className="h-px my-2" style={{ backgroundColor: "var(--chayong-divider)" }} />
          <Row
            label="총 지출"
            value={`${fmt(monthlyPayment * safeRemainingMonths + initialCost + safeTransferFee)}원`}
            emphasize
          />
        </TabsContent>

        <TabsContent value="vs-new" className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--chayong-text-sub)" }}>신차 리스 추정</span>
            <span className="chayong-tabular-nums font-semibold" style={{ color: "var(--chayong-text-caption)" }}>
              월 {fmt(Math.round(monthlyPayment * 1.667))}원
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--chayong-text-sub)" }}>차용 월 납입금</span>
            <span className="chayong-tabular-nums font-bold" style={{ color: "var(--chayong-primary)" }}>
              월 {fmt(monthlyPayment)}원
            </span>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--chayong-primary-soft)" }}>
            <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>월 절감</p>
            <p className="mt-0.5 text-lg font-bold chayong-tabular-nums" style={{ color: "var(--chayong-success)" }}>
              -{fmt(Math.round(monthlyPayment * 0.667))}원
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
