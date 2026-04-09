import { prisma } from "@/lib/db/prisma";
import { EscrowAdminTable } from "@/features/admin/components/escrow-admin-table";

export const metadata = { title: "에스크로 관리" };

export default async function AdminEscrowPage() {
  const escrows = await prisma.escrowPayment.findMany({
    include: {
      listing: { select: { id: true, brand: true, model: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = escrows.map((e) => ({
    id: e.id,
    status: e.status,
    totalAmount: e.totalAmount,
    paidAt: e.paidAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    listing: e.listing,
    buyer: e.buyer,
    seller: e.seller,
  }));

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{ color: "var(--chayong-text)" }}
      >
        에스크로 관리
      </h1>
      <EscrowAdminTable escrows={serialized} />
    </div>
  );
}
