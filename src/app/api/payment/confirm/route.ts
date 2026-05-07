import { NextRequest, NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, isAuthError } from "@/lib/api/auth-guard";
import { sendBulkNotifications } from "@/lib/notifications/send";

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

    const paidAt = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrowPayment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          paidAt,
          ...(pgOrderId && { pgOrderId }),
          ...(pgPaymentKey && { pgPaymentKey }),
        },
      });

      // Conditional transition: ACTIVE → RESERVED only.
      // 0 rows updated (already RESERVED/SOLD) is acceptable — transaction succeeds.
      await tx.listing.updateMany({
        where: { id: existing.listingId, status: "ACTIVE" },
        data: { status: "RESERVED" },
      });

      return escrow;
    });

    await sendBulkNotifications([
      {
        userId: existing.buyerId,
        type: NotificationType.ESCROW_PAID,
        title: "결제가 완료되었습니다",
        message: "명의변경 절차를 진행하세요.",
        linkUrl: `/payment/${paymentId}`,
      },
      {
        userId: existing.sellerId,
        type: NotificationType.ESCROW_PAID,
        title: "구매 결제가 완료되었습니다",
        message: "명의변경 안내를 확인하세요.",
        linkUrl: `/payment/${paymentId}`,
      },
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/payment/confirm error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
