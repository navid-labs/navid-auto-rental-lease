import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { CompareTable } from "@/features/compare/compare-table";
import type { Listing, ListingImage } from "@prisma/client";

type ListingForCompare = Listing & { images: ListingImage[] };

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const rawParams = await searchParams;
  const idsParam = rawParams["ids"] ?? "";

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
          비교할 차량이 없습니다. 매물 목록에서 최대 3대를 선택해주세요.
        </p>
        <Link
          href="/list"
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          <ArrowLeft size={16} />
          매물 목록으로
        </Link>
      </div>
    );
  }

  const listings = await prisma.listing.findMany({
    where: { id: { in: ids } },
    include: { images: true },
  });

  // Preserve the order from the ids param
  const ordered: ListingForCompare[] = ids
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is ListingForCompare => l != null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/list"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ backgroundColor: "var(--chayong-surface)", color: "var(--chayong-text-sub)" }}
          aria-label="목록으로 돌아가기"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
          차량 비교
        </h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {ordered.length}대
        </span>
      </div>

      {ordered.length === 0 ? (
        <div
          className="flex h-48 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
            해당 매물을 찾을 수 없습니다.
          </p>
        </div>
      ) : (
        <CompareTable listings={ordered} />
      )}
    </div>
  );
}
