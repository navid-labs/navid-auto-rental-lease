import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const now = new Date();

  const escrow = await prisma.escrowPayment.update({
    where: { id },
    data: {
      ...(body.status === "RELEASED" && {
        status: "RELEASED",
        releasedAt: now,
      }),
      ...(body.status === "REFUNDED" && {
        status: "REFUNDED",
        refundedAt: now,
      }),
    },
  });

  return NextResponse.json(escrow);
}
