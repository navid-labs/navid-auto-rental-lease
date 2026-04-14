import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Only the owner may add images
    if (listing.sellerId !== auth.userId && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { urls } = (await request.json()) as { urls: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls array is required" }, { status: 400 });
    }

    const images = await prisma.listingImage.createMany({
      data: urls.map((url: string, i: number) => ({
        listingId: id,
        url,
        order: i,
        isPrimary: i === 0,
      })),
    });

    return NextResponse.json({ count: images.count }, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings/[id]/images error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
