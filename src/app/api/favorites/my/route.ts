import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";
import type { ListingCardData } from "@/types";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    });

    const data: ListingCardData[] = favorites.map(({ listing: l }) => ({
      id: l.id,
      type: l.type,
      brand: l.brand,
      model: l.model,
      year: l.year,
      trim: l.trim,
      mileage: l.mileage,
      monthlyPayment: l.monthlyPayment,
      initialCost: l.initialCost,
      remainingMonths: l.remainingMonths,
      isVerified: l.isVerified,
      accidentFree: l.accidentFree,
      viewCount: l.viewCount,
      favoriteCount: l.favoriteCount,
      primaryImage: l.images[0]?.url ?? null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/favorites/my error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
