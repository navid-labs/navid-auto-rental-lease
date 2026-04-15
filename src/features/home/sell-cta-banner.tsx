import Link from "next/link";

export function SellCtaBanner() {
  return (
    <section
      className="rounded-2xl px-6 py-10 text-center"
      style={{ backgroundColor: "var(--chayong-surface)" }}
    >
      <h2
        className="text-xl font-bold"
        style={{ color: "var(--chayong-text)" }}
      >
        리스·렌트 계약, 부담되시나요?
      </h2>
      <p
        className="mt-2 text-sm"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        차용에서 안전하게 승계하세요.
      </p>
      <Link
        href="/sell"
        className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        내 차 등록하기 &rarr;
      </Link>
    </section>
  );
}
