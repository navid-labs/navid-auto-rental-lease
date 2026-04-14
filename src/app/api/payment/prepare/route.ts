import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const DEPOSIT_AMOUNT = 500_000; // 가계약금 고정 500,000원

// POST /api/payment/prepare
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { listingId, buyerId } = body;

  if (!listingId || !buyerId) {
    return NextResponse.json(
      { error: "listingId and buyerId are required" },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      transferFee: true,
      monthlyPayment: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const transferFee = listing.transferFee ?? 0;
  const totalAmount = DEPOSIT_AMOUNT + transferFee;

  const payment = await prisma.escrowPayment.create({
    data: {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      depositAmount: DEPOSIT_AMOUNT,
      transferFee,
      totalAmount,
      status: "PENDING",
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
