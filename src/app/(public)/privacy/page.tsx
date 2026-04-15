import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "차용 플랫폼 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
        개인정보처리방침
      </h1>
      <div
        className="space-y-4 text-sm leading-7"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        <section>
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
            1. 수집 항목
          </h2>
          <p>이메일, 이름, 전화번호, 매물 정보(등록 시), 결제 정보(에스크로 이용 시).</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
            2. 수집 목적
          </h2>
          <p>회원 식별, 상담 연결, 거래 중개, 에스크로 결제 처리, 법적 고지.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
            3. 보유 기간
          </h2>
          <p>회원 탈퇴 시까지. 단, 관련 법령에 따라 보존 의무가 있는 경우 해당 기간까지 보관합니다.</p>
        </section>
        <p className="pt-4 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          ※ 본 방침은 초안이며, 정식 버전은 서비스 출시 전 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
