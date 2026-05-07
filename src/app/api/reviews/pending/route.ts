import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthError, requireActiveProfile } from "@/lib/api/auth-guard";

type PendingReviewItem = {
  escrowId: string;
  listingId: string;
  listingTitle: string;
  dealerId: string;
  dealerName: string | null;
  completedAt: string;
};

export async function GET() {
  try {
    const auth = await requireActiveProfile();
    if (isAuthError(auth)) return auth;

    const releasedPayments = await prisma.escrowPayment.findMany({
      where: {
        buyerId: auth.userId,
        status: "RELEASED",
      },
      select: {
        id: true,
        listingId: true,
        releasedAt: true,
        updatedAt: true,
        listing: {
          select: {
            brand: true,
            model: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (releasedPayments.length === 0) {
      return NextResponse.json({ items: [] satisfies PendingReviewItem[] });
    }

    const reviewedListings = await prisma.dealerReview.findMany({
      where: {
        reviewerId: auth.userId,
        listingId: {
          in: releasedPayments.map((payment) => payment.listingId),
        },
      },
      select: {
        listingId: true,
      },
    });

    const reviewedListingIds = new Set(reviewedListings.map((review) => review.listingId));

    const items: PendingReviewItem[] = releasedPayments
      .filter((payment) => !reviewedListingIds.has(payment.listingId))
      .sort((a, b) => {
        const aCompletedAt = (a.releasedAt ?? a.updatedAt).getTime();
        const bCompletedAt = (b.releasedAt ?? b.updatedAt).getTime();
        return bCompletedAt - aCompletedAt;
      })
      .slice(0, 50)
      .map((payment) => ({
        escrowId: payment.id,
        listingId: payment.listingId,
        listingTitle:
          [payment.listing.brand, payment.listing.model]
            .filter((part): part is string => Boolean(part))
            .join(" ") || "매물",
        dealerId: payment.seller.id,
        dealerName: payment.seller.name,
        completedAt: (payment.releasedAt ?? payment.updatedAt).toISOString(),
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/reviews/pending error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
