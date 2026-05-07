import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";
import { listingInputSchema } from "@/lib/validation/listing";
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
    const q = searchParams.get("q");
    const remainingMin = searchParams.get("remainingMin");
    const initialCostMax = searchParams.get("initialCostMax");
    const yearMin = searchParams.get("yearMin");

    const where: Record<string, unknown> = {
      status: "ACTIVE" as ListingStatus,
      ...(type && { type }),
      ...(brand && { brand: { contains: brand, mode: "insensitive" } }),
      ...(monthlyMin || monthlyMax
        ? {
            monthlyPayment: {
              ...(monthlyMin && { gte: Number(monthlyMin) }),
              ...(monthlyMax && { lte: Number(monthlyMax) }),
            },
          }
        : {}),
      ...(remainingMin && { remainingMonths: { gte: Number(remainingMin) } }),
      ...(initialCostMax && { initialCost: { lte: Number(initialCostMax) } }),
      ...(yearMin && { year: { gte: Number(yearMin) } }),
    };

    if (q) {
      where.OR = [
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

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
      accidentCount: listing.accidentCount,
      mileageVerified: listing.mileageVerified,
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
    const parsed = listingInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력 검증 실패", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const listing = await prisma.listing.create({
      data: {
        sellerId: auth.userId,
        status: "DRAFT",
        type: input.type,
        brand: input.brand,
        model: input.model,
        year: input.year,
        mileage: input.mileage ?? null,
        vin: input.vin ?? null,
        plateNumber: input.plateNumber ?? null,
        fuelType: input.fuelType ?? null,
        transmission: input.transmission ?? null,
        displacement: input.displacement ?? null,
        bodyType: input.bodyType ?? null,
        drivetrain: input.drivetrain ?? null,
        plateType: input.plateType ?? null,
        color: input.color ?? null,
        seatingCapacity: input.seatingCapacity ?? null,
        trim: input.trim ?? null,
        options: input.options,
        accidentCount: input.accidentCount,
        ownerCount: input.ownerCount ?? null,
        exteriorGrade: input.exteriorGrade ?? null,
        interiorGrade: input.interiorGrade ?? null,
        mileageVerified: input.mileageVerified,
        registrationRegion: input.registrationRegion ?? null,
        inspectionReportKey: input.inspectionReportKey ?? null,
        inspectionDate: input.inspectionDate ?? null,
        monthlyPayment: input.monthlyPayment,
        remainingMonths: input.remainingMonths,
        totalPrice: input.totalPrice ?? null,
        remainingBalance: input.remainingBalance ?? null,
        initialCost: input.initialCost,
        capitalCompany: input.capitalCompany ?? null,
        description: input.description ?? null,
        // type-specific fields
        transferFee: input.type === "TRANSFER" ? input.transferFee : 0,
        carryoverPremium: input.type === "TRANSFER" ? input.carryoverPremium : null,
        deposit: input.type === "TRANSFER" ? null : input.deposit,
        terminationFee: input.type === "TRANSFER" ? null : input.terminationFee,
        mileageLimit: input.type === "TRANSFER" ? null : (input.mileageLimit ?? null),
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
