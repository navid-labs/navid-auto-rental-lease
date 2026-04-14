import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";
import type { ListingStatus, ListingType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") as ListingType | null;
    const monthlyMin = searchParams.get("monthlyMin");
    const monthlyMax = searchParams.get("monthlyMax");
    const brand = searchParams.get("brand");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = 12;

    const where = {
      status: "ACTIVE" as ListingStatus,
      ...(type && { type }),
      ...(brand && { brand }),
      ...(monthlyMin || monthlyMax
        ? {
            monthlyPayment: {
              ...(monthlyMin && { gte: Number(monthlyMin) }),
              ...(monthlyMax && { lte: Number(monthlyMax) }),
            },
          }
        : {}),
    };

    const orderBy =
      sort === "price_asc"
        ? { monthlyPayment: "asc" as const }
        : sort === "price_desc"
          ? { monthlyPayment: "desc" as const }
          : { createdAt: "desc" as const };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: [{ isVerified: "desc" }, orderBy],
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    const data = listings.map((listing) => ({
      id: listing.id,
      type: listing.type,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      trim: listing.trim,
      mileage: listing.mileage,
      monthlyPayment: listing.monthlyPayment,
      initialCost: listing.initialCost,
      remainingMonths: listing.remainingMonths,
      isVerified: listing.isVerified,
      accidentFree: listing.accidentFree,
      viewCount: listing.viewCount,
      favoriteCount: listing.favoriteCount,
      primaryImage: listing.images[0]?.url ?? null,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    if (!body.type || !body.monthlyPayment || !body.remainingMonths) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다. (type, monthlyPayment, remainingMonths)" }, { status: 400 });
    }
    if (typeof body.monthlyPayment !== "number" || body.monthlyPayment <= 0) {
      return NextResponse.json({ error: "월 납입금이 올바르지 않습니다." }, { status: 400 });
    }
    if (typeof body.remainingMonths !== "number" || body.remainingMonths <= 0) {
      return NextResponse.json({ error: "잔여 개월수가 올바르지 않습니다." }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: auth.userId,
        type: body.type,
        monthlyPayment: body.monthlyPayment,
        initialCost: body.initialCost ?? 0,
        remainingMonths: body.remainingMonths,
        transferFee: body.transferFee ?? 0,
        brand: body.brand ?? null,
        model: body.model ?? null,
        year: body.year ?? null,
        trim: body.trim ?? null,
        description: body.description ?? null,
        status: "DRAFT",
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
