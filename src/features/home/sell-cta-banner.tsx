import Link from "next/link";

export function SellCtaBanner() {
  return (
    <section
      className="rounded-2xl px-6 py-12 text-center"
      style={{ background: "linear-gradient(135deg, #3182F6 0%, #5B9CF6 100%)" }}
    >
      <h2 className="text-xl font-bold text-white">
        리스·렌트 계약, 부담되시나요?
      </h2>
      <p className="mt-2 text-sm text-white/80">
        차용에서 안전하게 승계하세요.
      </p>
      <Link
        href="/sell"
        className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold transition-colors hover:opacity-90"
        style={{ backgroundColor: "#ffffff", color: "var(--chayong-primary)" }}
      >
        내 차 등록하기 &rarr;
      </Link>
    </section>
  );
}
