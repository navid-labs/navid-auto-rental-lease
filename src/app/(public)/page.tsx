import Link from "next/link";
import Image from "next/image";
import { Shield, BadgeCheck, MessageCircle, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { VehicleCard } from "@/components/ui/vehicle-card";
import type { ListingCardData } from "@/types";

export const dynamic = "force-dynamic";

async function getRecommendedListings(): Promise<ListingCardData[]> {
  // Try verified+active first, fall back to newest active
  const [verified, newest] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", isVerified: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
  ]);

  const source = verified.length > 0 ? verified : newest;

  return source.map((l) => ({
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
    accidentFree: l.accidentFree,
    viewCount: l.viewCount,
    favoriteCount: l.favoriteCount,
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

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "100% 안심거래",
    description: "에스크로 시스템으로 가계약금을 안전하게 보호합니다.",
  },
  {
    icon: BadgeCheck,
    title: "금융사 승인 지원",
    description: "전문 딜러가 캐피탈 승계 심사를 처음부터 끝까지 도와드립니다.",
  },
  {
    icon: MessageCircle,
    title: "전문가 1:1 상담",
    description: "승계 경험이 풍부한 전문 상담사가 빠르게 응답합니다.",
  },
  {
    icon: RefreshCw,
    title: "승계 실패 시 환불",
    description: "금융사 심사 탈락 시 가계약금 전액을 환불해 드립니다.",
  },
] as const;

const HOW_IT_WORKS = [
  { step: 1, label: "매물 탐색", description: "월 납입금 기준으로 원하는 차량을 찾아보세요." },
  { step: 2, label: "상담 신청", description: "마음에 드는 매물에 상담을 신청하세요." },
  { step: 3, label: "승계 심사", description: "전문 딜러가 금융사 승계 심사를 진행합니다." },
  { step: 4, label: "안전거래", description: "에스크로로 보호된 안전한 거래를 완료합니다." },
] as const;

export default async function HomePage() {
  const [listings, newListingCount] = await Promise.all([
    getRecommendedListings(),
    getNewListingCount(),
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
                className="rounded-xl px-6 py-3 font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                매물 보러가기
              </Link>
              <Link
                href="/sell"
                className="rounded-xl border px-6 py-3 font-semibold transition-colors"
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

      {/* ── Category Tabs ── */}
      <section className="py-4">
        <div
          className="flex items-center gap-2 rounded-xl p-1"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <Link
            href="/list?type=TRANSFER"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors"
            style={{ backgroundColor: "var(--chayong-bg)", color: "var(--chayong-text)" }}
          >
            승계 차량
          </Link>
          <Link
            href="/list?type=USED_LEASE"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium transition-colors"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            중고 리스·렌트
          </Link>
        </div>
      </section>

      {/* ── 지금, 이 매물 어때요? ── */}
      {listings.length > 0 && (
        <section className="py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
                지금, 이 매물 어때요?
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                실시간으로 매칭되는 승계 매물을 확인해보세요.
              </p>
            </div>
            <Link href="/list" className="shrink-0 text-sm font-medium" style={{ color: "var(--chayong-primary)" }}>
              전체보기 &gt;
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {listings.slice(0, 5).map((listing) => (
              <Link
                key={listing.id}
                href={`/detail/${listing.id}`}
                className="flex shrink-0 w-36 flex-col gap-2 rounded-xl border p-3 transition-colors hover:border-[var(--chayong-primary)]"
                style={{
                  borderColor: "var(--chayong-border)",
                  backgroundColor: "var(--chayong-bg)",
                }}
              >
                {/* Thumbnail */}
                <div
                  className="h-24 w-full overflow-hidden rounded-lg"
                  style={{ backgroundColor: "var(--chayong-surface)" }}
                >
                  {listing.primaryImage ? (
                    <Image
                      src={listing.primaryImage}
                      alt={[listing.brand, listing.model].filter(Boolean).join(" ") || "차량"}
                      width={144}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs" style={{ color: "var(--chayong-text-caption)" }}>
                      사진 없음
                    </div>
                  )}
                </div>
                {/* Info */}
                <div>
                  <p className="truncate text-xs font-semibold leading-tight" style={{ color: "var(--chayong-text)" }}>
                    {[listing.brand, listing.model].filter(Boolean).join(" ") || "차량"}
                  </p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "var(--chayong-primary)" }}>
                    월 {listing.monthlyPayment.toLocaleString("ko-KR")}원
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recommended Listings ── */}
      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
            추천 매물
          </h2>
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
            {listings.map((listing) => (
              <VehicleCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* ── Trust Section ── */}
      <section
        className="rounded-2xl py-10 px-6 my-8"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2 className="mb-8 text-center text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          왜 차용인가요?
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--chayong-primary-light)" }}
              >
                <Icon size={22} style={{ color: "var(--chayong-primary)" }} />
              </div>
              <h3 className="mb-1 font-semibold" style={{ color: "var(--chayong-text)" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-10 mb-8">
        <h2 className="mb-8 text-center text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          이용 방법
        </h2>
        <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ step, label, description }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                {step}
              </div>
              <h3 className="mb-1 font-semibold" style={{ color: "var(--chayong-text)" }}>
                {label}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
