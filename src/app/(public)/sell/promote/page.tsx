import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "등록 완료 및 노출 선택",
  description: "매물 등록 후 노출 옵션과 광고 결제 단계를 확인하세요.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PROMOTION_OPTIONS = [
  {
    title: "기본 검수 등록",
    price: "무료",
    description: "관리자 검수 후 일반 목록에 노출됩니다.",
  },
  {
    title: "목록 상단 노출",
    price: "결제 연동 예정",
    description: "검색 결과와 필터 목록에서 더 잘 보이도록 우선 노출합니다.",
  },
  {
    title: "홈 추천 구좌",
    price: "결제 연동 예정",
    description: "홈 추천 영역과 주요 진입 화면에서 매물을 강조합니다.",
  },
] as const;

export default async function SellPromotePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const listingId = typeof params.listingId === "string" ? params.listingId : "";

  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/sell/promote?listingId=${listingId}`)}`);
  }

  return (
    <div className="bg-[var(--chayong-bg)] px-4 py-10 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl">
        <section className="rounded-xl border border-[var(--chayong-border)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--chayong-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--chayong-primary)]">
                <CheckCircle2 size={14} aria-hidden="true" />
                등록 접수 완료
              </div>
              <h1 className="text-2xl font-bold text-[var(--chayong-text)] sm:text-3xl">
                검수 전 노출 옵션을 선택할 수 있습니다
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--chayong-text-sub)]">
                기본 등록은 바로 접수되었습니다. 유료 상단 노출과 홈 추천 구좌는 판매자 광고 결제
                시스템과 연결될 예정이며, 에스크로 결제와는 별도 흐름으로 다룹니다.
              </p>
            </div>
            <Link
              href="/my"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[var(--chayong-border)] bg-white px-5 text-sm font-semibold text-[var(--chayong-text)]"
            >
              내 매물로 이동
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {PROMOTION_OPTIONS.map((option, index) => (
            <article
              key={option.title}
              className="rounded-xl border border-[var(--chayong-border)] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-[var(--chayong-primary)]">
                옵션 {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-bold text-[var(--chayong-text)]">
                {option.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[var(--chayong-text)]">
                {option.price}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--chayong-text-sub)]">
                {option.description}
              </p>
              <button
                type="button"
                disabled={index > 0}
                className="mt-5 h-10 w-full rounded-xl border border-[var(--chayong-border)] px-4 text-sm font-semibold text-[var(--chayong-text)] disabled:cursor-not-allowed disabled:bg-[var(--chayong-surface)] disabled:text-[var(--chayong-text-caption)]"
              >
                {index === 0 ? "기본 등록 유지" : "결제 연동 후 사용"}
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
