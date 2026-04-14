import { Shield, MessageCircle, FileCheck, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용가이드",
  description: "차용 플랫폼 이용 방법을 안내합니다.",
};

const STEPS = [
  {
    icon: Shield,
    step: 1,
    title: "매물 탐색",
    description:
      "월 납입금 기준으로 승계 차량과 중고 리스·렌트 매물을 비교해보세요. 안심마크가 있는 매물은 상세 정보가 검증된 매물입니다.",
  },
  {
    icon: MessageCircle,
    step: 2,
    title: "상담 신청",
    description:
      "마음에 드는 매물을 찾으셨다면 상담 신청 버튼을 눌러주세요. 전문 상담사가 1:1로 빠르게 연락드립니다.",
  },
  {
    icon: FileCheck,
    step: 3,
    title: "승계 심사",
    description:
      "전문 딜러가 금융사 승계 심사를 대행합니다. 캐피탈사와의 복잡한 절차를 차용이 대신 처리해드립니다.",
  },
  {
    icon: CheckCircle,
    step: 4,
    title: "안전거래",
    description:
      "에스크로 시스템으로 가계약금을 안전하게 보호합니다. 승계 실패 시 100% 환불을 보장합니다.",
  },
] as const;

const FAQS = [
  {
    q: "승계란 무엇인가요?",
    a: "리스나 렌트 계약의 남은 기간을 다른 사람에게 넘기는 것입니다. 새 차를 구매하는 것보다 월 납입금이 저렴하고, 초기비용 부담이 적습니다.",
  },
  {
    q: "안심마크는 어떻게 받나요?",
    a: "매물 등록 시 차량 기본정보(제조사, 모델, 연식, 트림, 주행거리, 색상)와 사진을 모두 입력하면 자동으로 안심마크가 부여됩니다.",
  },
  {
    q: "에스크로 결제는 안전한가요?",
    a: "토스페이먼츠 에스크로 시스템을 사용합니다. 가계약금은 승계 완료 전까지 안전하게 보관되며, 승계 실패 시 전액 환불됩니다.",
  },
  {
    q: "수수료는 어떻게 되나요?",
    a: "매물 등록은 무료입니다. 거래 성사 시 승계 대행 수수료가 발생하며, 결제 전에 정확한 금액을 안내해드립니다.",
  },
] as const;

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          이용가이드
        </h1>
        <p
          className="mt-3 text-base"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          차용으로 안전하고 간편하게 차량을 승계하는 방법
        </p>
      </div>

      {/* Steps */}
      <section className="mb-16">
        <h2
          className="mb-8 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          이용 방법
        </h2>
        <div className="grid gap-6">
          {STEPS.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="flex gap-4 rounded-xl border p-5"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--chayong-primary-light)" }}
              >
                <Icon size={20} style={{ color: "var(--chayong-primary)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--chayong-primary)" }}
                  >
                    STEP {step}
                  </span>
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--chayong-text)" }}
                  >
                    {title}
                  </h3>
                </div>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: "var(--chayong-text-sub)" }}
                >
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escrow Section */}
      <section
        id="escrow"
        className="mb-16 rounded-2xl px-6 py-8"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2
          className="mb-4 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          안심거래 시스템
        </h2>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          차용은 토스페이먼츠 에스크로 시스템을 통해 안전한 거래를 보장합니다.
          가계약금은 거래 완료 전까지 에스크로 계좌에 보관되며, 문제 발생 시
          전액 환불됩니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {["승계 실패 시 100% 환불", "캐피탈 승인 불가 시 전액 환불", "실차 미인도 시 전액 환불"].map(
            (text) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-lg bg-white p-3"
              >
                <CheckCircle
                  size={16}
                  style={{ color: "var(--chayong-success)" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {text}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          자주 묻는 질문
        </h2>
        <div className="grid gap-4">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <h3
                className="font-semibold"
                style={{ color: "var(--chayong-text)" }}
              >
                {q}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--chayong-text-sub)" }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
