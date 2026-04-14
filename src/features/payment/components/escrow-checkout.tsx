"use client";

import { useState, useEffect } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { CheckCircle, ShieldCheck, Lock } from "lucide-react";

interface ListingInfo {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  monthlyPayment: number;
  initialCost: number;
  transferFee: number;
}

interface EscrowCheckoutProps {
  listing: ListingInfo;
  buyerId: string;
}

const STEPS = ["결제 내역", "안심 보장", "결제하기", "거래완료"];
const DEPOSIT_AMOUNT = 500_000;

function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function vehicleLabel(listing: ListingInfo): string {
  return [listing.brand, listing.model].filter(Boolean).join(" ") || "매물";
}

export function EscrowCheckout({ listing, buyerId }: EscrowCheckoutProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showTestConfirm, setShowTestConfirm] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const depositAmount = DEPOSIT_AMOUNT;
  const transferFee = listing.transferFee ?? 0;
  const totalAmount = depositAmount + transferFee;

  // Load Toss Payments SDK when reaching payment step
  useEffect(() => {
    if (step !== 2) return;

    const existing = document.getElementById("toss-sdk");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "toss-sdk";
    script.src = "https://js.tosspayments.com/v2/standard";
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("toss-sdk");
      if (el) document.head.removeChild(el);
    };
  }, [step]);

  const handlePreparePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, buyerId }),
      });

      if (!res.ok) throw new Error("결제 준비에 실패했습니다.");

      const payment = await res.json();
      setPendingPaymentId(payment.id);

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TossPayments = (window as any).TossPayments;

      if (clientKey && TossPayments) {
        // Real Toss Payments flow
        const tossPayments = TossPayments(clientKey);
        await tossPayments.requestPayment("카드", {
          amount: totalAmount,
          orderId: payment.id,
          orderName: `${vehicleLabel(listing)} 가계약금`,
          customerName: buyerId,
          successUrl: `${window.location.origin}/api/payment/confirm?paymentId=${payment.id}`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
      } else {
        // Test mode: show styled confirmation dialog
        setShowTestConfirm(true);
      }
    } catch {
      alert("결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConfirm = async () => {
    if (!pendingPaymentId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pendingPaymentId }),
      });
      if (!res.ok) throw new Error("결제 확인에 실패했습니다.");
      setShowTestConfirm(false);
      setStep(3);
    } catch {
      alert("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 0: 결제 내역 확인
  const renderStep0 = () => (
    <div className="space-y-6">
      {/* Listing card */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--chayong-surface)",
          border: "1px solid var(--chayong-border)",
        }}
      >
        <p
          className="text-xs font-medium mb-1"
          style={{ color: "var(--chayong-text-caption)" }}
        >
          승계 매물
        </p>
        <p
          className="text-base font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          {vehicleLabel(listing)}
          {listing.year && (
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: "var(--chayong-text-sub)" }}
            >
              {listing.year}년식
            </span>
          )}
        </p>
        <p
          className="mt-1 text-sm font-semibold"
          style={{ color: "var(--chayong-primary)" }}
        >
          월 {listing.monthlyPayment.toLocaleString("ko-KR")}원
        </p>
      </div>

      {/* Breakdown table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--chayong-border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--chayong-divider)" }}
        >
          <span
            className="text-sm"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            가계약금
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--chayong-text)" }}
          >
            {formatKRW(depositAmount)}
          </span>
        </div>
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--chayong-divider)" }}
        >
          <span
            className="text-sm"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            승계 대행 수수료
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--chayong-text)" }}
          >
            {formatKRW(transferFee)}
          </span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--chayong-text)" }}
          >
            총 결제금액
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--chayong-primary)" }}
          >
            {formatKRW(totalAmount)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full rounded-xl py-3.5 text-base font-bold text-white transition-colors"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        다음 단계
      </button>
    </div>
  );

  // Step 1: 안심 보장 안내
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        {[
          "승계 실패 시 100% 환불",
          "캐피탈 승인 불가 시 전액 환불",
          "실차 미인도 시 전액 환불",
        ].map((text) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
            }}
          >
            <CheckCircle
              size={20}
              style={{ color: "var(--chayong-success)", flexShrink: 0 }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "#15803D" }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>

      <p
        className="text-center text-xs"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        토스페이먼츠 에스크로로 안전하게 결제됩니다.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="flex-1 rounded-xl py-3.5 text-base font-medium transition-colors"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text-sub)",
            border: "1px solid var(--chayong-border)",
          }}
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex-[2] rounded-xl py-3.5 text-base font-bold text-white transition-colors"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          결제하기
        </button>
      </div>
    </div>
  );

  // Step 2: 결제
  const renderStep2 = () => (
    <div className="space-y-6">
      <div
        className="rounded-2xl px-5 py-6 text-center"
        style={{
          backgroundColor: "var(--chayong-surface)",
          border: "1px solid var(--chayong-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
          총 결제금액
        </p>
        <p
          className="mt-1 text-3xl font-bold"
          style={{ color: "var(--chayong-primary)" }}
        >
          {formatKRW(totalAmount)}
        </p>
      </div>

      {/* Test mode confirmation dialog */}
      {showTestConfirm && (
        <div
          className="rounded-2xl px-5 py-6 space-y-3"
          style={{
            backgroundColor: "#EBF2FF",
            border: "1px solid #BFDBFE",
          }}
        >
          <p
            className="text-sm font-semibold text-center"
            style={{ color: "var(--chayong-primary)" }}
          >
            테스트 모드: 결제를 시뮬레이션합니다
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "var(--chayong-text-caption)" }}
          >
            NEXT_PUBLIC_TOSS_CLIENT_KEY 설정 시 실제 토스페이먼츠 결제창이 열립니다.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowTestConfirm(false)}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--chayong-surface)",
                color: "var(--chayong-text-sub)",
                border: "1px solid var(--chayong-border)",
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleTestConfirm}
              disabled={isLoading}
              className="flex-[2] rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--chayong-primary)" }}
            >
              {isLoading ? "처리 중..." : "확인"}
            </button>
          </div>
        </div>
      )}

      {!showTestConfirm && (
        <button
          type="button"
          onClick={handlePreparePayment}
          disabled={isLoading}
          className="w-full rounded-xl py-3.5 text-base font-bold text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {isLoading ? "처리 중..." : `${formatKRW(totalAmount)} 안심하게 결제하기`}
        </button>
      )}

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <Lock size={13} style={{ color: "var(--chayong-text-caption)" }} />
          <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            SSL 보안
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} style={{ color: "var(--chayong-text-caption)" }} />
          <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            개인정보 암호화
          </span>
        </div>
      </div>
    </div>
  );

  // Step 3: 거래 완료
  const renderStep3 = () => (
    <div className="flex flex-col items-center py-10 space-y-4 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "#F0FDF4" }}
      >
        <CheckCircle
          size={40}
          style={{ color: "var(--chayong-success)" }}
        />
      </div>
      <h2
        className="text-xl font-bold"
        style={{ color: "var(--chayong-text)" }}
      >
        결제가 완료되었습니다
      </h2>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        승계 심사가 진행됩니다.
        <br />
        결과는 채팅으로 안내드립니다.
      </p>
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex justify-center">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Step content */}
      {stepContent[step]?.()}
    </div>
  );
}
