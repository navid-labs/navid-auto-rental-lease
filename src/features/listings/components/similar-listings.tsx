import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { formatKRW } from "@/lib/utils/format";

interface SimilarListingsProps {
  currentId: string;
  type: string;
  brand?: string | null;
  monthlyPayment: number;
}

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고 리스",
  USED_RENTAL: "중고 렌트",
};

export async function SimilarListings({
  currentId,
  type,
  brand,
  monthlyPayment,
}: SimilarListingsProps) {
  const priceMin = Math.floor(monthlyPayment * 0.8);
  const priceMax = Math.ceil(monthlyPayment * 1.2);

  const listings = await prisma.listing.findMany({
    where: {
      id: { not: currentId },
      type: type as never,
      status: "ACTIVE",
      OR: [
        ...(brand ? [{ brand }] : []),
        { monthlyPayment: { gte: priceMin, lte: priceMax } },
      ],
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  if (listings.length === 0) return null;

  return (
    <section aria-label="유사 매물">
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: "var(--chayong-text)" }}
      >
        유사 매물
      </h2>

      {/* Horizontal scroll carousel */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        role="list"
        style={{ scrollbarWidth: "none" }}
      >
        {listings.map((listing) => {
          const primaryImage = listing.images[0]?.url ?? null;
          const name =
            [listing.brand, listing.model].filter(Boolean).join(" ") ||
            "차량 정보 없음";

          return (
            <Link
              key={listing.id}
              href={`/detail/${listing.id}`}
              role="listitem"
              className="group flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--chayong-border)" }}
            >
              {/* Image */}
              <div
                className="relative aspect-[4/3] w-full overflow-hidden"
                style={{ backgroundColor: "var(--chayong-surface)" }}
              >
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    sizes="192px"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-xs"
                    style={{ color: "var(--chayong-text-caption)" }}
                  >
                    이미지 없음
                  </div>
                )}
                {/* Type badge */}
                <span
                  className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                >
                  {TYPE_LABEL[listing.type] ?? listing.type}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-0.5 p-3">
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {name}
                </p>
                {listing.year && (
                  <p className="text-[11px]" style={{ color: "var(--chayong-text-caption)" }}>
                    {listing.year}년식
                  </p>
                )}
                <p
                  className="mt-1 text-sm font-bold tabular-nums"
                  style={{ color: "var(--chayong-primary)" }}
                >
                  월 {formatKRW(listing.monthlyPayment)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
