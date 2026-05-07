import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireActiveProfile, isAuthError, requireAuth } from "@/lib/api/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) {
      return NextResponse.json({ error: "listingId가 필요합니다." }, { status: 400 });
    }

    const favorite = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: auth.userId, listingId } },
      select: { id: true },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveProfile();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { listingId } = body as { listingId: string };

    if (!listingId) {
      return NextResponse.json({ error: "listingId가 필요합니다." }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: auth.userId, listingId } },
    });

    if (existing) {
      // Remove favorite and decrement count
      const [, updated] = await prisma.$transaction([
        prisma.favorite.delete({ where: { id: existing.id } }),
        prisma.listing.update({
          where: { id: listingId },
          data: { favoriteCount: { decrement: 1 } },
          select: { favoriteCount: true },
        }),
      ]);
      return NextResponse.json({ isFavorited: false, favoriteCount: updated.favoriteCount });
    } else {
      // Add favorite and increment count
      const [, updated] = await prisma.$transaction([
        prisma.favorite.create({ data: { userId: auth.userId, listingId } }),
        prisma.listing.update({
          where: { id: listingId },
          data: { favoriteCount: { increment: 1 } },
          select: { favoriteCount: true },
        }),
      ]);
      return NextResponse.json({ isFavorited: true, favoriteCount: updated.favoriteCount });
    }
  } catch (error) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
