import { prisma } from "@/lib/db/prisma";
import { PipelineClient } from "./pipeline-client";
import type { SerializedKanbanListing } from "./pipeline-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "매물 파이프라인" };

async function getKanbanListings(): Promise<SerializedKanbanListing[]> {
  const listings = await prisma.listing.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      brand: true,
      model: true,
      year: true,
      monthlyPayment: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      seller: { select: { id: true, name: true } },
      _count: { select: { images: true } },
    },
  });

  return listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));
}

export default async function PipelinePage() {
  const listings = await getKanbanListings();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          매물 파이프라인
        </h1>
        <span className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
          총 {listings.length}건
        </span>
      </div>
      <PipelineClient initialListings={listings} />
    </div>
  );
}
