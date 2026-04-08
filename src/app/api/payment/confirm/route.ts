import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// POST /api/payment/confirm
// Called after PG (Toss Payments) callback — verify then update escrow status
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paymentId, pgOrderId, pgPaymentKey } = body;

  if (!paymentId || !pgOrderId || !pgPaymentKey) {
    return NextResponse.json(
      { error: "paymentId, pgOrderId, pgPaymentKey are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Payment is not in PENDING state" },
      { status: 409 }
    );
  }

  // TODO: Verify payment with Toss Payments API before updating status
  // const verified = await verifyTossPayment(pgPaymentKey, pgOrderId, existing.totalAmount);
  // if (!verified) return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });

  const updated = await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      pgOrderId,
      pgPaymentKey,
    },
  });

  return NextResponse.json(updated);
}
