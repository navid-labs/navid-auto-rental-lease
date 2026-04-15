import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole, isAuthError } from "@/lib/api/auth-guard";
import {
  ListingStatus,
  FuelType,
  Transmission,
  BodyType,
  Drivetrain,
  PlateType,
  Grade,
} from "@prisma/client";

const adminListingUpdateSchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  isVerified: z.boolean().optional(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1990).max(2030).optional().nullable(),
  trim: z.string().max(200).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  plateNumber: z.string().max(20).optional().nullable(),
  fuelType: z.nativeEnum(FuelType).optional().nullable(),
  transmission: z.nativeEnum(Transmission).optional().nullable(),
  seatingCapacity: z.number().int().min(1).max(15).optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  displacement: z.number().int().min(0).optional().nullable(),
  bodyType: z.nativeEnum(BodyType).optional().nullable(),
  drivetrain: z.nativeEnum(Drivetrain).optional().nullable(),
  plateType: z.nativeEnum(PlateType).optional().nullable(),
  options: z.array(z.string()).optional(),
  description: z.string().max(5000).optional().nullable(),
  accidentCount: z.number().int().min(0).optional().nullable(),
  ownerCount: z.number().int().min(0).optional().nullable(),
  exteriorGrade: z.nativeEnum(Grade).optional().nullable(),
  interiorGrade: z.nativeEnum(Grade).optional().nullable(),
  mileageVerified: z.boolean().optional(),
  registrationRegion: z.string().max(100).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();

    const parsed = adminListingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("PATCH /api/admin/listings/[id] error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
