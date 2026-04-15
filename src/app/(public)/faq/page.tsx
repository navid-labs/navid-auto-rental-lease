import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "차용 이용 중 자주 묻는 질문 모음",
};

const FAQS = [
  {
    q: "승계 차량이란 무엇인가요?",
    a: "기존 리스/렌트 계약자가 남은 계약 기간을 양도하는 차량입니다. 초기 비용 부담이 적고 잔여 계약만 이어가면 되는 장점이 있습니다.",
  },
  {
    q: "월 납입금 외에 드는 비용은?",
    a: "보증금(반환 대상), 승계 수수료, 차량 점검/정비 비용 등이 발생할 수 있습니다. 매물 상세 페이지의 비용 계산기에서 총 비용을 확인하세요.",
  },
  {
    q: "안심마크(Verified)는 무엇을 의미하나요?",
    a: "차용이 차량 등록증, 계약서, 납부 내역 등을 확인한 매물입니다. 신뢰도가 높은 매물을 우선 확인하실 수 있습니다.",
  },
  {
    q: "거래는 어떻게 진행되나요?",
    a: "플랫폼에서 상담 신청 후 전문 딜러가 승계 심사·서류 작업을 대행합니다. 결제는 에스크로를 통해 안전하게 처리됩니다.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
        자주 묻는 질문
      </h1>
      <div className="space-y-4">
        {FAQS.map(({ q, a }) => (
          <div
            key={q}
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <h2
              className="mb-2 text-base font-semibold"
              style={{ color: "var(--chayong-text)" }}
            >
              Q. {q}
            </h2>
            <p className="text-sm leading-6" style={{ color: "var(--chayong-text-sub)" }}>
              {a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
