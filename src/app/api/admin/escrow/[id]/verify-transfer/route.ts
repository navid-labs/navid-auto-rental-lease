import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotificationType } from "@prisma/client";

import { isAuthError, requireRole } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { sendBulkNotifications } from "@/lib/notifications/send";

const verifyTransferSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().min(10).max(1000).optional(),
  rejectionProofKey: z.string().max(500).optional(),
  payoutAmount: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const parsed = verifyTransferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "reject" && !data.rejectionReason) {
      return NextResponse.json(
        { error: "거부 사유는 10자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    const current = await prisma.escrowPayment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        transferProofKey: true,
        totalAmount: true,
        buyerId: true,
        sellerId: true,
        listingId: true,
        listing: { select: { status: true } },
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Escrow payment not found" }, { status: 404 });
    }

    if (current.status !== "PAID") {
      return NextResponse.json(
        { error: "결제 완료 상태에서만 명의변경 증빙을 검증할 수 있습니다." },
        { status: 400 }
      );
    }

    const now = new Date();

    if (data.action === "approve") {
      if (!current.transferProofKey) {
        return NextResponse.json({ error: "증빙 미업로드" }, { status: 400 });
      }

      if (current.listing.status !== "RESERVED") {
        return NextResponse.json(
          { error: "예약중인 매물만 거래완료 처리할 수 있습니다." },
          { status: 409 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const escrow = await tx.escrowPayment.update({
          where: { id },
          data: {
            status: "RELEASED",
            verifiedBy: auth.userId,
            verifiedAt: now,
            payoutAmount: data.payoutAmount ?? current.totalAmount,
            payoutAt: now,
          },
        });

        const listing = await tx.listing.update({
          where: { id: current.listingId },
          data: { status: "SOLD" },
        });

        return { escrow, listing };
      });

      await sendBulkNotifications([
        {
          userId: current.buyerId,
          type: NotificationType.ESCROW_RELEASED,
          title: "명의변경이 확인되었습니다",
          message: "명의변경 증빙 검증이 완료되었습니다.",
          linkUrl: `/payment/${id}`,
        },
        {
          userId: current.sellerId,
          type: NotificationType.ESCROW_RELEASED,
          title: "대금이 정산됩니다",
          message: "명의변경 검증이 완료되어 대금 정산을 진행합니다.",
          linkUrl: `/payment/${id}`,
        },
      ]);

      return NextResponse.json(result);
    }

    const result = await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrowPayment.update({
        where: { id },
        data: {
          verificationRejectedAt: now,
          rejectionReason: data.rejectionReason,
          rejectionProofKey: data.rejectionProofKey,
        },
      });
      const listing = await tx.listing.findUnique({
        where: { id: current.listingId },
      });

      return { escrow, listing };
    });

    await sendBulkNotifications([
      {
        userId: current.buyerId,
        type: NotificationType.ESCROW_DISPUTE_OPENED,
        title: "명의변경 증빙 확인이 필요합니다",
        message: data.rejectionReason ?? "명의변경 증빙이 반려되었습니다.",
        linkUrl: `/payment/${id}`,
      },
      {
        userId: current.sellerId,
        type: NotificationType.ESCROW_DISPUTE_OPENED,
        title: "명의변경 증빙 확인이 필요합니다",
        message: data.rejectionReason ?? "명의변경 증빙이 반려되었습니다.",
        linkUrl: `/payment/${id}`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/admin/escrow/[id]/verify-transfer error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
