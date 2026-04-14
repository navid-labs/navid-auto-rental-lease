import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";

// POST /api/payment/confirm
// Called after PG (Toss Payments) callback — verify then update escrow status
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { paymentId, pgOrderId, pgPaymentKey } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const existing = await prisma.escrowPayment.findUnique({
      where: { id: paymentId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Only the buyer of this payment may confirm it
    if (existing.buyerId !== auth.userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment is not in PENDING state" },
        { status: 409 }
      );
    }

    // When pgPaymentKey and pgOrderId are present, verify with Toss Payments API.
    // In test mode they are omitted and we skip PG verification.
    // TODO: call verifyTossPayment(pgPaymentKey, pgOrderId, existing.totalAmount) in production

    const updated = await prisma.escrowPayment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        ...(pgOrderId && { pgOrderId }),
        ...(pgPaymentKey && { pgPaymentKey }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/payment/confirm error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
