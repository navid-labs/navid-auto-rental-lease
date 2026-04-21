"use client";

import { useState } from "react";
import Link from "next/link";

/** 차량가 대비 월 납입금 추정 (단순 근사: 1.2%) */
export function estimateMonthlyPayment(vehiclePriceKRW: number): number {
  return Math.round(vehiclePriceKRW * 0.012);
}

/** 신차 리스 대비 월 절감액 추정 (신차 ≈ 차용 월납입금의 1.667배 가정 → 40% 저렴) */
export function estimateNewLeaseSavings(vehiclePriceKRW: number): number {
  const chayong = estimateMonthlyPayment(vehiclePriceKRW);
  const newLease = Math.round(chayong * 1.667);
  return newLease - chayong;
}

const MIN = 5_000_000;
const MAX = 100_000_000;
const STEP = 1_000_000;

function formatManwon(krw: number): string {
  const manwon = Math.round(krw / 10_000);
  return manwon.toLocaleString("ko-KR");
}

export function CostCalculatorHome() {
  const [price, setPrice] = useState(50_000_000);
  const monthly = estimateMonthlyPayment(price);
  const savings = estimateNewLeaseSavings(price);

  return (
    <section
      aria-label="비용 계산기"
      className="rounded-2xl border p-5 md:p-8"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
            내 예산으로 얼마짜리 차를 탈 수 있을까요?
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            차량가 슬라이더를 움직여보세요.
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold chayong-tabular-nums"
          style={{
            backgroundColor: "var(--chayong-primary-soft)",
            color: "var(--chayong-primary)",
          }}
        >
          차량가 {formatManwon(price)}만원
        </span>
      </div>

      <label className="block">
        <span className="sr-only">차량 가격</span>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full accent-[var(--chayong-primary)]"
          aria-label="차량 가격 (원)"
        />
        <div
          className="mt-1 flex justify-between text-[11px] chayong-tabular-nums"
          style={{ color: "var(--chayong-text-caption)" }}
        >
          <span>{formatManwon(MIN)}만</span>
          <span>{formatManwon(MAX)}만</span>
        </div>
      </label>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            차용 월 납입금 (예상)
          </p>
          <p
            className="mt-1 text-2xl font-bold chayong-tabular-nums"
            style={{ color: "var(--chayong-primary)" }}
          >
            월 {formatManwon(monthly)}만원
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            신차 리스 대비 절감
          </p>
          <p
            className="mt-1 text-2xl font-bold chayong-tabular-nums"
            style={{ color: "var(--chayong-success)" }}
          >
            월 -{formatManwon(savings)}만원
          </p>
        </div>
      </div>

      <Link
        href="/list"
        className="mt-5 flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        이 예산에 맞는 매물 보기 →
      </Link>

      <p
        className="mt-3 text-[11px] leading-relaxed"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        * 월 납입금은 차량가의 약 1.2% 기준 단순 추정치입니다. 실제 납입금은 차종, 잔여 기간, 신용에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
