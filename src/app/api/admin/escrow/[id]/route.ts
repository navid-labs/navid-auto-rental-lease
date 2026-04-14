import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole, isAuthError } from "@/lib/api/auth-guard";
import type { EscrowStatus } from "@prisma/client";

// Valid state transitions for the escrow state machine
const VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  PENDING: ["PAID"],
  PAID: ["RELEASED", "REFUNDED"],
  RELEASED: [],
  REFUNDED: [],
  DISPUTED: ["RELEASED", "REFUNDED"],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const newStatus = body.status as EscrowStatus | undefined;

    if (!newStatus) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const current = await prisma.escrowPayment.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Escrow payment not found" }, { status: 404 });
    }

    // Enforce state machine — reject invalid transitions
    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `${current.status}에서 ${newStatus}로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }

    const now = new Date();

    const escrow = await prisma.escrowPayment.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "RELEASED" && { releasedAt: now }),
        ...(newStatus === "REFUNDED" && { refundedAt: now }),
      },
    });

    return NextResponse.json(escrow);
  } catch (error) {
    console.error("PATCH /api/admin/escrow/[id] error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
