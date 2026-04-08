import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <section className="py-12 text-center">
        <h1 className="text-3xl font-bold leading-tight text-[var(--chayong-text)] md:text-5xl">
          안전하게 승계하는
          <br />
          <span className="text-[var(--chayong-primary)]">
            가장 쉬운 방법, 차용
          </span>
        </h1>
        <p className="mt-4 text-[var(--chayong-text-sub)]">
          월 납입금만 보고 간편하게 비교하세요.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/list"
            className="rounded-xl bg-[var(--chayong-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--chayong-primary-hover)]"
          >
            매물 보러가기
          </Link>
          <Link
            href="/sell"
            className="rounded-xl border border-[var(--chayong-border)] px-6 py-3 font-medium text-[var(--chayong-text)] transition-colors hover:bg-[var(--chayong-surface)]"
          >
            내 차 등록하기
          </Link>
        </div>
      </section>
      <section className="py-8">
        <p className="text-center text-sm text-[var(--chayong-text-caption)]">
          추천 매물 영역 — Phase 1에서 구현
        </p>
      </section>
    </div>
  );
}
