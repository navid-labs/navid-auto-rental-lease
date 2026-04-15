import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "차용 플랫폼 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
        이용약관
      </h1>
      <div
        className="space-y-4 text-sm leading-7"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        <section>
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
            제1조 (목적)
          </h2>
          <p>
            본 약관은 차용(이하 &quot;회사&quot;)이 제공하는 중고 리스/렌트 승계 및 거래
            중개 서비스(이하 &quot;서비스&quot;) 이용에 관한 조건과 절차를 규정합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
            제2조 (서비스의 성격)
          </h2>
          <p>
            회사는 매물 정보 게시와 상담 연결을 제공하는 플랫폼 사업자이며, 실제 계약은
            당사자 간 체결됩니다. 금융사 승계 심사 결과는 캐피탈사의 내부 기준에 따릅니다.
          </p>
        </section>
        <p className="pt-4 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          ※ 본 약관은 초안이며, 정식 버전은 서비스 출시 전 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
