import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

type RouteContext = { params: Promise<{ id: string }> };

// Fields that sellers are allowed to update on their own listings
const UPDATABLE_FIELDS = [
  "brand", "model", "year", "trim", "fuelType", "transmission",
  "seatingCapacity", "mileage", "color", "plateNumber",
  "monthlyPayment", "initialCost", "remainingMonths", "transferFee",
  "capitalCompany", "accidentFree", "description", "options", "status",
] as const;

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        seller: { select: { id: true, name: true, role: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // fire-and-forget view count increment
    prisma.listing
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return NextResponse.json(listing);
  } catch (error) {
    console.error("GET /api/listings/[id] error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { id } = await context.params;

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Only the owner or an ADMIN may update a listing
    if (existing.sellerId !== auth.userId && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();

    // Only pick explicitly allowed fields — never spread raw body
    const data: Record<string, unknown> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("PUT /api/listings/[id] error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
