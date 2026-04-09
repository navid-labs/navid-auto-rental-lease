import { prisma } from "@/lib/db/prisma";
import { ListingAdminTable } from "@/features/admin/components/listing-admin-table";

export const dynamic = "force-dynamic";

export const metadata = { title: "매물 관리" };

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    where: { status: { in: ["PENDING", "ACTIVE", "HIDDEN"] } },
    include: {
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = listings.map((l) => ({
    id: l.id,
    type: l.type,
    status: l.status,
    brand: l.brand,
    model: l.model,
    isVerified: l.isVerified,
    createdAt: l.createdAt.toISOString(),
    seller: l.seller,
  }));

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{ color: "var(--chayong-text)" }}
      >
        매물 관리
      </h1>
      <ListingAdminTable listings={serialized} />
    </div>
  );
}
