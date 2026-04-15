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
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-12 md:px-10 md:py-20"
        style={{ background: "linear-gradient(135deg, #EBF3FE 0%, #F0F4FF 50%, #FFFFFF 100%)" }}
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Left: headline + CTAs */}
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl" style={{ color: "var(--chayong-text)" }}>
              안전하게 승계하는
              <br />
              <span style={{ color: "var(--chayong-primary)" }}>가장 쉬운 방법, 차용</span>
            </h1>
            <p className="mt-4 text-base md:text-lg" style={{ color: "var(--chayong-text-sub)" }}>
              월 납입금만 보고 간편하게 비교하세요.
            </p>
            {newListingCount > 0 && (
              <span
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--chayong-danger)" }}
              >
                이번 달 {newListingCount}건 신규
              </span>
            )}
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

          {/* Right: car illustration + floating widget */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Car SVG illustration */}
            <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md" aria-hidden="true">
              {/* Road shadow */}
              <ellipse cx="200" cy="195" rx="170" ry="12" fill="#E5E8EB" opacity="0.5" />
              {/* Car body */}
              <path d="M80 140 L95 95 C100 80 115 65 140 60 L260 60 C285 65 300 80 305 95 L320 140 Z" fill="var(--chayong-primary)" opacity="0.9" />
              {/* Roof */}
              <path d="M130 65 L145 35 C150 28 160 24 175 24 L225 24 C240 24 250 28 255 35 L270 65 Z" fill="var(--chayong-primary)" opacity="0.7" />
              {/* Windows */}
              <path d="M140 62 L152 38 C155 32 162 28 172 28 L195 28 L195 62 Z" fill="white" opacity="0.85" />
              <path d="M205 28 L228 28 C238 28 245 32 248 38 L260 62 L205 62 Z" fill="white" opacity="0.85" />
              {/* Headlights */}
              <rect x="70" y="115" width="20" height="12" rx="4" fill="#FFD700" opacity="0.9" />
              <rect x="310" y="115" width="20" height="12" rx="4" fill="#FF4444" opacity="0.7" />
              {/* Bottom panel */}
              <rect x="75" y="140" width="250" height="22" rx="6" fill="var(--chayong-primary)" opacity="0.95" />
              {/* Wheels */}
              <circle cx="130" cy="162" r="24" fill="#333" />
              <circle cx="130" cy="162" r="14" fill="#666" />
              <circle cx="130" cy="162" r="6" fill="#999" />
              <circle cx="270" cy="162" r="24" fill="#333" />
              <circle cx="270" cy="162" r="14" fill="#666" />
              <circle cx="270" cy="162" r="6" fill="#999" />
              {/* Door line */}
              <line x1="200" y1="65" x2="200" y2="138" stroke="white" strokeWidth="1" opacity="0.3" />
              {/* Handle */}
              <rect x="210" y="100" width="18" height="4" rx="2" fill="white" opacity="0.4" />
            </svg>

            {/* Floating price widget */}
            <div
              className="absolute -bottom-2 right-0 w-56 rounded-xl border p-4 shadow-lg lg:right-4"
              style={{ backgroundColor: "var(--chayong-bg)", borderColor: "var(--chayong-border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--chayong-text-sub)" }}>차용</span>
                <span className="text-lg font-bold" style={{ color: "var(--chayong-primary)" }}>월 58만원</span>
              </div>
              <div className="my-2.5 h-px" style={{ backgroundColor: "var(--chayong-divider)" }} />
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "초기비용", value: "140만원" },
                  { label: "잔여 기간", value: "32개월" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--chayong-text-caption)" }}>{label}</span>
                    <span className="font-semibold" style={{ color: "var(--chayong-text)" }}>{value}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/list"
                className="mt-3 block w-full rounded-lg py-2 text-center text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                매물 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Hub ── */}
      <section className="py-3 md:py-4">
        <SearchHub brands={topBrands} />
      </section>

      {/* ── Trust Stripe ── */}
      <section className="my-4 md:my-6">
        <TrustStripe />
      </section>

      {/* ── 지금, 이 매물 어때요? ── */}
      <section className="py-5 md:py-8">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div>
            <h2 className="text-lg font-bold md:text-xl" style={{ color: "var(--chayong-text)" }}>
              지금, 이 매물 어때요?
            </h2>
            <p className="mt-0.5 text-xs md:text-sm" style={{ color: "var(--chayong-text-sub)" }}>실시간으로 매칭되는 승계 매물을 확인해보세요.</p>
          </div>
          <Link
            href="/list"
            className="text-xs font-medium md:text-sm"
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
      <section className="py-5 md:py-8">
        <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: "var(--chayong-text)" }}>
          차용으로 이런 거래가 가능해요
        </h2>
        <StoryCards />
      </section>

      {/* ── How It Works Timeline ── */}
      <section className="py-6 mb-4 md:py-10 md:mb-8">
        <h2 className="mb-5 text-lg font-bold md:mb-8 md:text-xl" style={{ color: "var(--chayong-text)" }}>
          이용 방법
        </h2>
        <div className="max-w-lg">
          <HowItWorksTimeline />
        </div>
      </section>

      {/* ── Sell CTA Banner ── */}
      <section className="mb-6 md:mb-8">
        <SellCtaBanner />
      </section>
    </div>
  );
}
