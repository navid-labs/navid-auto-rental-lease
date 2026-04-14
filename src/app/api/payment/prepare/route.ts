import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

const DEPOSIT_AMOUNT = 500_000; // 가계약금 고정 500,000원

// POST /api/payment/prepare
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
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

    // buyerId is always taken from the session — never from body
    const payment = await prisma.escrowPayment.create({
      data: {
        listingId,
        buyerId: auth.userId,
        sellerId: listing.sellerId,
        depositAmount: DEPOSIT_AMOUNT,
        transferFee,
        totalAmount,
        status: "PENDING",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("POST /api/payment/prepare error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
