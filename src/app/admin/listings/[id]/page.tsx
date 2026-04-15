import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ListingEditForm } from "@/features/admin/components/listing-edit-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { brand: true, model: true },
  });
  const name = listing
    ? [listing.brand, listing.model].filter(Boolean).join(" ")
    : "매물";
  return { title: `${name} 편집` };
}

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { select: { id: true, url: true, order: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  if (!listing) notFound();

  const serialized = {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    inspectionDate: listing.inspectionDate?.toISOString() ?? null,
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/listings"
          className="text-sm"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          ← 매물 목록
        </Link>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          {[listing.brand, listing.model].filter(Boolean).join(" ") || "매물"} 편집
        </h1>
      </div>

      <div
        className="mb-4 rounded-lg border p-3 text-sm"
        style={{
          borderColor: "var(--chayong-divider)",
          backgroundColor: "var(--chayong-surface)",
        }}
      >
        <span style={{ color: "var(--chayong-text-sub)" }}>등록자: </span>
        <span style={{ color: "var(--chayong-text)" }}>
          {listing.seller.name ?? listing.seller.email}
        </span>
        <span className="mx-2" style={{ color: "var(--chayong-divider)" }}>
          |
        </span>
        <span style={{ color: "var(--chayong-text-sub)" }}>등록일: </span>
        <span style={{ color: "var(--chayong-text)" }}>
          {new Date(listing.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <ListingEditForm listing={serialized} />
    </div>
  );
}
