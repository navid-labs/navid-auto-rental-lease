import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck, CheckCircle, ArrowRight, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { TrustBadge } from "@/components/ui/trust-badge";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import { ListingCostCalculator } from "@/features/listings/components/listing-cost-calculator";
import { ListingCtaSidebar } from "@/features/listings/components/listing-cta-sidebar";
import { ShareButton } from "@/features/listings/components/share-button";
import { MobileCTABar } from "@/features/listings/components/mobile-cta-bar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getListing(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      seller: { select: { id: true, name: true, role: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "매물을 찾을 수 없습니다" };

  const name = [listing.brand, listing.model].filter(Boolean).join(" ") || "차량";
  return {
    title: `${name} - 월 ${listing.monthlyPayment.toLocaleString("ko-KR")}원`,
    description: `${name} ${listing.year ?? ""}년식, 월 ${listing.monthlyPayment.toLocaleString("ko-KR")}원, 잔여 ${listing.remainingMonths}개월`,
  };
}

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고 리스",
  USED_RENTAL: "중고 렌트",
};

const ESCROW_STEPS = [
  {
    icon: ShieldCheck,
    title: "가계약금 보호",
    description: "에스크로 계좌에 안전하게 보관",
  },
  {
    icon: ArrowRight,
    title: "승계 진행",
    description: "금융사 심사 및 명의 이전 처리",
  },
  {
    icon: CheckCircle,
    title: "거래 완료",
    description: "심사 완료 후 판매자에게 지급",
  },
] as const;

export default async function DetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) notFound();

  // Increment view count (fire-and-forget — do not await to avoid slowing page)
  void prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const vehicleName =
    [listing.brand, listing.model].filter(Boolean).join(" ") || "차량 정보 없음";

  const infoRows: { label: string; value: string | null | undefined }[] = [
    { label: "차량번호", value: listing.plateNumber },
    { label: "연식", value: listing.year ? `${listing.year}년` : null },
    {
      label: "주행거리",
      value: listing.mileage
        ? `${listing.mileage.toLocaleString("ko-KR")}km`
        : null,
    },
    { label: "연료", value: listing.fuelType },
    { label: "미션", value: listing.transmission },
    { label: "색상", value: listing.color },
    {
      label: "사고유무",
      value:
        listing.accidentFree === null
          ? null
          : listing.accidentFree
          ? "무사고"
          : "사고 있음",
    },
    { label: "캐피탈사", value: listing.capitalCompany },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
        <span>{TYPE_LABEL[listing.type] ?? listing.type}</span>
        <span>/</span>
        <span className="font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          {vehicleName}
        </span>
      </div>

      {/* Title row */}
      <div className="mb-6 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--chayong-text)" }}>
            {vehicleName}
          </h1>
          {listing.isVerified && <TrustBadge />}
          {listing.capitalCompany && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--chayong-primary-light)",
                color: "var(--chayong-primary)",
              }}
            >
              <BadgeCheck size={14} />
              금융사 승인 가능
            </span>
          )}
        </div>
        <ShareButton
          title={`${vehicleName} - 월 ${listing.monthlyPayment.toLocaleString("ko-KR")}원`}
          url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/detail/${listing.id}`}
        />
      </div>

      {/* Main layout: 2 cols on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">
          {/* Gallery */}
          <ListingGallery
            images={listing.images}
            vehicleName={vehicleName}
          />

          {/* Vehicle info table */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--chayong-border)" }}
          >
            <div
              className="px-4 py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--chayong-surface)",
                color: "var(--chayong-text)",
                borderBottom: `1px solid var(--chayong-divider)`,
              }}
            >
              차량 정보
            </div>
            <table className="w-full text-sm">
              <tbody>
                {infoRows.map(({ label, value }) => (
                  <tr
                    key={label}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--chayong-divider)" }}
                  >
                    <td
                      className="w-28 px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--chayong-text-caption)", backgroundColor: "var(--chayong-surface)" }}
                    >
                      {label}
                    </td>
                    <td className="px-4 py-3" style={{ color: value ? "var(--chayong-text)" : "var(--chayong-text-caption)" }}>
                      {value ?? "정보 없음"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 추가 옵션 */}
          {listing.options && listing.options.length > 0 && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--chayong-border)" }}
            >
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                추가 옵션
              </h3>
              <div className="flex flex-wrap gap-2">
                {listing.options.map((opt) => (
                  <span
                    key={opt}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--chayong-surface)",
                      color: "var(--chayong-text-sub)",
                      border: "1px solid var(--chayong-border)",
                    }}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (sticky sidebar) ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <ListingCtaSidebar
            monthlyPayment={listing.monthlyPayment}
            initialCost={listing.initialCost}
            remainingMonths={listing.remainingMonths}
            listingId={listing.id}
          />

          <ListingCostCalculator
            initialCost={listing.initialCost}
            transferFee={listing.transferFee}
            monthlyPayment={listing.monthlyPayment}
            remainingMonths={listing.remainingMonths}
          />
        </div>
      </div>

      {/* ── Below fold ── */}

      {/* Trust / Escrow section */}
      <section
        className="mt-10 rounded-2xl px-6 py-8"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2 className="mb-6 text-center text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
          안심거래 시스템
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ESCROW_STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--chayong-primary-light)" }}
              >
                <Icon size={22} style={{ color: "var(--chayong-primary)" }} />
              </div>
              <div
                className="mb-1 text-xs font-semibold"
                style={{ color: "var(--chayong-primary)" }}
              >
                STEP {i + 1}
              </div>
              <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                {title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      {listing.description && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
            상세 설명
          </h2>
          <div
            className="rounded-xl border p-5 text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-sub)",
            }}
          >
            {listing.description}
          </div>
        </section>
      )}

      {/* Mobile fixed bottom CTA */}
      <MobileCTABar monthlyPayment={listing.monthlyPayment} listingId={listing.id} />
    </div>
  );
}
