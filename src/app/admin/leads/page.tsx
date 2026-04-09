import { prisma } from "@/lib/db/prisma";
import { LeadTable } from "@/features/admin/components/lead-table";

export const dynamic = "force-dynamic";

export const metadata = { title: "상담 리드" };

export default async function AdminLeadsPage() {
  const leads = await prisma.consultationLead.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      listing: { select: { id: true, brand: true, model: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates for client component
  const serialized = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{ color: "var(--chayong-text)" }}
      >
        상담 리드
      </h1>
      <LeadTable leads={serialized} />
    </div>
  );
}
