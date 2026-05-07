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
      "에스크로 안내를 바탕으로 거래 자금 보호 기준을 설명하고, 처리 조건은 상담 과정에서 안내합니다.",
  },
] as const;

const FAST_TRANSFER_FLOW = [
  {
    step: 1,
    title: "내 차 등록",
    description: "차량 기본 정보와 사진을 등록해 상담을 시작합니다.",
  },
  {
    step: 2,
    title: "상담/검수",
    description:
      "상담사가 상태와 진행 가능 여부를 확인하고 대행 범위를 안내합니다.",
  },
  {
    step: 3,
    title: "상단 노출/문의 대응",
    description:
      "검수 완료 매물은 노출을 돕고, 유입 문의는 매니저가 응대합니다.",
  },
  {
    step: 4,
    title: "완료 후 수수료 안내",
    description:
      "승계 완료 시점에 기획 기준 수수료를 최종 안내합니다.",
  },
] as const;

const SERVICE_NOTES = [
  "일반 등록은 무료",
  "빠른승계 매니저 대행은 별도 유료 상품",
  "세금계산서·환불 조건은 계약/상담 단계에서 별도 안내",
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
    a: "토스페이먼츠 에스크로 안내를 기준으로 안전한 거래 흐름을 설명합니다. 가계약금 보관과 환불 기준은 거래 조건과 상담 결과에 따라 별도로 안내됩니다.",
  },
  {
    q: "수수료는 어떻게 되나요?",
    a: "일반 매물 등록은 무료입니다. 다만 매니저가 진행하는 빠른승계 대행은 별도 유료 상품이며, 기획 기준으로 등록비 99,000원, 승계 완료 수수료는 중고차 시세의 4%, 최저 수수료 770,000원(VAT 포함)입니다. 최종 금액은 상담·검수 후 안내됩니다.",
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

      {/* Service Notes */}
      <section className="mb-12">
        <div className="grid gap-3 sm:grid-cols-3">
          {SERVICE_NOTES.map((text) => (
            <div
              key={text}
              className="rounded-xl border bg-white px-4 py-3 text-sm font-medium leading-relaxed"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <span style={{ color: "var(--chayong-text)" }}>{text}</span>
            </div>
          ))}
        </div>
      </section>

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

      {/* Fast Transfer Flow */}
      <section
        className="mb-16 rounded-2xl border px-6 py-8"
        style={{ borderColor: "var(--chayong-divider)", backgroundColor: "var(--chayong-surface)" }}
      >
        <h2
          className="mb-3 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          빠른승계 대행 흐름
        </h2>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          빠른승계는 일반 등록과 분리된 유료 대행 상품입니다. 등록 후 상담과 검수를 거쳐 노출과 문의 대응을 진행하고, 완료 시점에 수수료를 안내합니다.
        </p>
        <div className="grid gap-3">
          {FAST_TRANSFER_FLOW.map(({ step, title, description }) => (
            <div
              key={step}
              className="flex gap-4 rounded-xl bg-white p-4"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--chayong-primary-light)" }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--chayong-primary)" }}
                >
                  {step}
                </span>
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {title}
                </h3>
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
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "등록비 99,000원",
            "승계 완료 수수료: 중고차 시세의 4%",
            "최저 수수료 770,000원(VAT 포함)",
          ].map((text) => (
            <span
              key={text}
              className="rounded-full px-3 py-2 text-xs font-semibold"
              style={{
                backgroundColor: "var(--chayong-primary-light)",
                color: "var(--chayong-primary)",
              }}
            >
              {text}
            </span>
          ))}
        </div>
        <p
          className="mt-4 text-xs leading-relaxed"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          기획 기준 금액이며, 최종 안내는 상담·검수 후 확정됩니다.
        </p>
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
          차용은 토스페이먼츠 에스크로 안내를 바탕으로 안전한 거래 흐름을 설명합니다. 가계약금 보관과 환불 기준은 실제 계약 조건과 상담 결과에 따라 별도로 안내됩니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {["보관 조건은 거래별로 안내", "승인 결과에 따라 진행 기준 안내", "실차 인도 전 단계는 별도 확인"].map(
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
