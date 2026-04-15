import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { SearchHub } from "@/features/home/search-hub";
import { TrustStripe } from "@/features/home/trust-stripe";
import { StoryCards } from "@/features/home/story-cards";
import { HowItWorksTimeline } from "@/features/home/how-it-works-timeline";
import { SellCtaBanner } from "@/features/home/sell-cta-banner";
import type { ListingCardData } from "@/types";

export const dynamic = "force-dynamic";

async function getRecommendedListings(): Promise<ListingCardData[]> {
  const selectFields = {
    id: true,
    type: true,
    brand: true,
    model: true,
    year: true,
    trim: true,
    mileage: true,
    monthlyPayment: true,
    initialCost: true,
    remainingMonths: true,
    isVerified: true,
    accidentCount: true,
    mileageVerified: true,
    viewCount: true,
    favoriteCount: true,
    options: true,
    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
  } as const;

  // Try verified+active first, fall back to newest active only if empty
  let listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", isVerified: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: selectFields,
  });

  if (listings.length === 0) {
    listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: selectFields,
    });
  }

  return listings.map((l) => ({
    id: l.id,
    type: l.type,
    brand: l.brand,
    model: l.model,
    year: l.year,
    trim: l.trim,
    mileage: l.mileage,
    monthlyPayment: l.monthlyPayment,
    initialCost: l.initialCost,
    remainingMonths: l.remainingMonths,
    isVerified: l.isVerified,
    accidentCount: l.accidentCount,
    mileageVerified: l.mileageVerified,
    viewCount: l.viewCount,
    favoriteCount: l.favoriteCount,
    options: l.options,
    primaryImage: l.images[0]?.url ?? null,
  }));
}

async function getNewListingCount(): Promise<number> {
  const now = new Date();
  return prisma.listing.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    },
  });
}

async function getTopBrands(): Promise<string[]> {
  const rows = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    distinct: ["brand"],
    take: 10,
    select: { brand: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.brand).filter((b): b is string => Boolean(b));
}

export default async function HomePage() {
  const [listings, newListingCount, topBrands] = await Promise.all([
    getRecommendedListings(),
    getNewListingCount(),
    getTopBrands(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* ── Hero ── */}
      <section className="py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: headline + CTAs */}
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl" style={{ color: "var(--chayong-text)" }}>
              안전하게 승계하는
              <br />
              <span style={{ color: "var(--chayong-primary)" }}>가장 쉬운 방법, 차용</span>
            </h1>
            <p className="mt-4 text-base md:text-lg" style={{ color: "var(--chayong-text-sub)" }}>
              월 납입금만 보고 간편하게 비교하세요.
              {newListingCount > 0 && (
                <span
                  className="ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--chayong-danger)" }}
                >
                  이번 달 {newListingCount}건 신규
                </span>
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/list"
                className="inline-flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                매물 보러가기
              </Link>
              <Link
                href="/sell"
                className="inline-flex h-12 items-center rounded-xl border px-6 text-[15px] font-semibold transition-colors hover:bg-[var(--chayong-surface)]"
                style={{
                  borderColor: "var(--chayong-border)",
                  color: "var(--chayong-text)",
                  backgroundColor: "var(--chayong-bg)",
                }}
              >
                내 차 등록하기
              </Link>
            </div>
          </div>

          {/* Right: preview widget card */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="w-full max-w-sm rounded-2xl border p-6 shadow-lg"
              style={{
                backgroundColor: "var(--chayong-bg)",
                borderColor: "var(--chayong-border)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--chayong-text-sub)" }}>
                  차용
                </span>
                <span className="text-2xl font-bold" style={{ color: "var(--chayong-primary)" }}>
                  월 580,000원
                </span>
              </div>
              <div
                className="my-4 h-px"
                style={{ backgroundColor: "var(--chayong-divider)" }}
              />
              <div className="flex flex-col gap-3">
                {[
                  { label: "초기비용", value: "1,400,000원" },
                  { label: "남은 총 납입금", value: "18,560,000원" },
                  { label: "실질 총 비용", value: "21,400,000원" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--chayong-text-caption)" }}>· {label}</span>
                    <span className="font-semibold" style={{ color: "var(--chayong-text)" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="my-4 h-px"
                style={{ backgroundColor: "var(--chayong-divider)" }}
              />
              <Link
                href="/list"
                className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                계산 결과 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Hub ── */}
      <section className="py-4">
        <SearchHub brands={topBrands} />
      </section>

      {/* ── Trust Stripe ── */}
      <section className="my-6">
        <TrustStripe />
      </section>

      {/* ── 지금, 이 매물 어때요? ── */}
      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
              지금, 이 매물 어때요?
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>실시간으로 매칭되는 승계 매물을 확인해보세요.</p>
          </div>
          <Link
            href="/list"
            className="text-sm font-medium"
            style={{ color: "var(--chayong-primary)" }}
          >
            전체보기 &gt;
          </Link>
        </div>

        {listings.length === 0 ? (
          <div
            className="flex h-48 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--chayong-surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
              등록된 매물이 없습니다
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing, i) => (
              <VehicleCard key={listing.id} listing={listing} priority={i === 0} />
            ))}
          </div>
        )}
      </section>

      {/* ── Story Cards ── */}
      <section className="py-8">
        <h2 className="mb-6 text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          차용으로 이런 거래가 가능해요
        </h2>
        <StoryCards />
      </section>

      {/* ── How It Works Timeline ── */}
      <section className="py-10 mb-8">
        <h2 className="mb-8 text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          이용 방법
        </h2>
        <div className="max-w-lg">
          <HowItWorksTimeline />
        </div>
      </section>

      {/* ── Sell CTA Banner ── */}
      <section className="mb-8">
        <SellCtaBanner />
      </section>
    </div>
  );
}
