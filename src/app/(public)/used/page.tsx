import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { VehicleCard } from "@/components/ui/vehicle-card";
import type { ListingCardData } from "@/types";

export const metadata: Metadata = {
  title: "중고 리스·렌트",
  description: "중고 리스와 렌트 매물을 월 납입금으로 비교하세요.",
};

export const dynamic = "force-dynamic";

const COMPARISON = [
  { category: "소유권", lease: "만기 시 인수 가능", rental: "반납 원칙" },
  { category: "세제 혜택", lease: "법인 비용처리 가능", rental: "법인 비용처리 가능" },
  { category: "보험·정비", lease: "개별 가입", rental: "렌트료에 포함" },
  { category: "계약 기간", lease: "24~60개월 (장기)", rental: "12~36개월 (유연)" },
  { category: "초기 비용", lease: "보증금 필요", rental: "보증금 또는 선납금" },
] as const;

const FAQS = [
  {
    q: "중고 리스란?",
    a: "이전 리스 이용자의 계약이 만료된 차량을 새로운 리스 조건으로 이용하는 것입니다. 신차 리스 대비 월 납입금이 저렴합니다.",
  },
  {
    q: "중고 렌트란?",
    a: "렌트 만기 차량을 새로운 렌트 조건으로 이용하는 것입니다. 보험·정비가 포함되어 관리 부담이 적습니다.",
  },
  {
    q: "승계와 뭐가 다른가요?",
    a: "승계는 기존 계약의 남은 기간을 그대로 이어받는 것이고, 중고 리스·렌트는 만기 차량으로 새 계약을 맺는 것입니다.",
  },
  {
    q: "세제 혜택은 어떻게 되나요?",
    a: "법인 또는 개인사업자의 경우 리스료·렌트료를 비용으로 처리할 수 있습니다. 세부 사항은 세무사와 상담하세요.",
  },
] as const;

async function getUsedListings(): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      type: { in: ["USED_LEASE", "USED_RENTAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

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

export default async function UsedPage() {
  const listings = await getUsedListings();

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="py-16 text-center">
        <h1
          className="text-3xl font-bold leading-tight md:text-4xl"
          style={{ color: "var(--chayong-text)" }}
        >
          중고 리스·렌트
          <br />
          <span style={{ color: "var(--chayong-primary)" }}>
            월 납입금부터 비교하세요
          </span>
        </h1>
        <p
          className="mt-4 text-base"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          새 차 리스 대비 부담 없는 월 납입금
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/list?type=USED_LEASE"
            className="inline-flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            리스 매물 보기
          </Link>
          <Link
            href="/list?type=USED_RENTAL"
            className="inline-flex h-12 items-center rounded-xl border px-6 text-[15px] font-semibold transition-colors hover:bg-[var(--chayong-surface)]"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text)",
            }}
          >
            렌트 매물 보기
          </Link>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-8">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          리스 vs 렌트, 뭐가 다를까?
        </h2>
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-text-sub)" }}>
                  구분
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-primary)" }}>
                  중고 리스
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-primary)" }}>
                  중고 렌트
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ category, lease, rental }) => (
                <tr
                  key={category}
                  className="border-t"
                  style={{ borderColor: "var(--chayong-divider)" }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--chayong-text)" }}>
                    {category}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--chayong-text-sub)" }}>
                    {lease}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--chayong-text-sub)" }}>
                    {rental}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Latest Listings */}
      {listings.length > 0 && (
        <section className="py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--chayong-text)" }}
            >
              최신 리스·렌트 매물
            </h2>
            <Link
              href="/list?type=USED_LEASE"
              className="text-sm font-medium"
              style={{ color: "var(--chayong-primary)" }}
            >
              전체보기 &gt;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <VehicleCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-8">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          자주 묻는 질문
        </h2>
        <div className="grid gap-4">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <h3
                className="font-semibold"
                style={{ color: "var(--chayong-text)" }}
              >
                {q}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--chayong-text-sub)" }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="my-8 rounded-2xl px-6 py-10 text-center"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          내 리스·렌트 차량을 등록해보세요
        </h2>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          무료로 등록하고, 관심 있는 구매자와 매칭되세요.
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          내 차 등록하기 &rarr;
        </Link>
      </section>
    </div>
  );
}
