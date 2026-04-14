import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.isVerified !== undefined && { isVerified: body.isVerified }),
    },
  });

  return NextResponse.json(listing);
}
