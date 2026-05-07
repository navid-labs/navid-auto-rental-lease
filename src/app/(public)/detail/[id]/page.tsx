import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ShieldCheck, ArrowRight, MessageCircle, FileCheck, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { sanitizeListingForPublic } from "@/lib/listings/sanitize";
import { TrustBadge } from "@/components/ui/trust-badge";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import { ListingCostCalculator } from "@/features/listings/components/listing-cost-calculator";
import { ListingCtaSidebar } from "@/features/listings/components/listing-cta-sidebar";
import { ReportListingButton } from "@/features/listings/components/report-listing-button";
import { ShareButton } from "@/features/listings/components/share-button";
import { MobileCTABar } from "@/features/listings/components/mobile-cta-bar";
import { SpecPanel } from "@/features/listings/components/spec-panel";
import { OptionsChips } from "@/features/listings/components/options-chips";
import { VehicleDiagnosis } from "@/features/listings/components/vehicle-diagnosis";
import { VehicleHistory } from "@/features/listings/components/vehicle-history";
import { SellerCard } from "@/features/listings/components/seller-card";
import { SimilarListings } from "@/features/listings/components/similar-listings";

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
    icon: MessageCircle,
    title: "매물 상담",
    description: "관심 매물에 문의 및 예약",
  },
  {
    icon: ShieldCheck,
    title: "가계약금 입금",
    description: "에스크로 계좌에 안전하게 보관",
  },
  {
    icon: FileCheck,
    title: "금융사 심사",
    description: "신용 및 명의 이전 심사",
  },
  {
    icon: ArrowRight,
    title: "명의 이전",
    description: "본계약 체결 및 차량 인도",
  },
  {
    icon: PackageCheck,
    title: "거래 완료",
    description: "에스크로 해제, 판매자 지급",
  },
] as const;

export default async function DetailPage({ params }: PageProps) {
  const { id } = await params;
  const rawListing = await getListing(id);

  if (!rawListing) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const viewerId = user?.id;
  let isAdmin = false;
  if (viewerId) {
    const profile = await prisma.profile.findUnique({
      where: { id: viewerId },
      select: { role: true },
    });
    isAdmin = profile?.role === "ADMIN";
  }
  const listing = sanitizeListingForPublic(rawListing, { viewerId, isAdmin });

  // Increment view count (fire-and-forget)
  void prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const vehicleName =
    [listing.brand, listing.model].filter(Boolean).join(" ") || "차량 정보 없음";

  // Map images for gallery (add alt text)
  const galleryImages = listing.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: `${vehicleName} ${img.order + 1}번째 이미지`,
    order: img.order,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8">
      {/* Breadcrumb */}
      <div
        className="mb-4 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        <span>{TYPE_LABEL[listing.type] ?? listing.type}</span>
        <span>/</span>
        <span className="font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          {vehicleName}
        </span>
      </div>

      {/* Title row */}
      <div className="mb-6 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: "var(--chayong-text)" }}
          >
            {vehicleName}
          </h1>
          {listing.isVerified && <TrustBadge />}
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
          <ListingGallery images={galleryImages} vehicleName={vehicleName} />

          {/* Spec Panel — replaces old flat info table */}
          <SpecPanel
            year={listing.year}
            mileage={listing.mileage}
            fuelType={listing.fuelType}
            transmission={listing.transmission}
            bodyType={listing.bodyType}
            drivetrain={listing.drivetrain}
            displacement={listing.displacement}
            color={listing.color}
            accidentCount={listing.accidentCount}
            mileageVerified={listing.mileageVerified}
            exteriorGrade={listing.exteriorGrade}
            interiorGrade={listing.interiorGrade}
            capitalCompany={listing.capitalCompany}
            remainingMonths={listing.remainingMonths}
            mileageLimit={listing.mileageLimit}
          />

          {/* Options Chips */}
          {listing.options && listing.options.length > 0 && (
            <OptionsChips options={listing.options} />
          )}

          {/* Vehicle Diagnosis */}
          <VehicleDiagnosis
            accidentCount={listing.accidentCount ?? 0}
            ownerCount={listing.ownerCount ?? 1}
            exteriorGrade={listing.exteriorGrade ?? null}
            interiorGrade={listing.interiorGrade ?? null}
            mileageVerified={listing.mileageVerified}
            inspectionDate={listing.inspectionDate ?? null}
            inspectionReportUrl={
              listing.inspectionReportKey?.startsWith("http") ? listing.inspectionReportKey : null
            }
          />

          {/* Vehicle History */}
          <VehicleHistory
            ownerCount={listing.ownerCount ?? 1}
            accidentCount={listing.accidentCount ?? 0}
          />

          {/* Seller Card */}
          <SellerCard
            sellerId={listing.sellerId}
            sellerName={listing.seller.name}
            sellerRole={listing.seller.role}
            isVerified={listing.isVerified}
            listingId={listing.id}
          />
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

          <ReportListingButton
            listingId={listing.id}
            sellerId={listing.sellerId}
            listingTitle={vehicleName}
          />
        </div>
      </div>

      {/* ── Below fold ── */}

      {/* Trust / Escrow section */}
      <section
        className="mt-10 rounded-2xl px-6 py-8"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2
          className="mb-6 text-center text-lg font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          안심거래 시스템
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
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
              <h3
                className="mb-1 text-sm font-semibold"
                style={{ color: "var(--chayong-text)" }}
              >
                {title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--chayong-text-sub)" }}
              >
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

      {/* Similar Listings */}
      <div className="mt-10">
        <Suspense fallback={null}>
          <SimilarListings
            currentId={listing.id}
            type={listing.type}
            brand={listing.brand}
            monthlyPayment={listing.monthlyPayment}
          />
        </Suspense>
      </div>

      {/* Mobile fixed bottom CTA */}
      <MobileCTABar monthlyPayment={listing.monthlyPayment} listingId={listing.id} />
    </div>
  );
}
