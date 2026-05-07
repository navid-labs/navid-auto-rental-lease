import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotificationType, type PenaltyLevel } from "@prisma/client";

import { isAuthError, requireRole } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/notifications/send";

const penaltySchema = z.object({
  level: z.enum(["WARNING", "LIGHT", "HEAVY", "BAN", "CLEAR"]),
  reason: z.string().min(10).max(1000),
  durationDays: z.number().int().min(1).max(365).optional(),
});

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const parsed = penaltySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id },
      select: { id: true, penaltyLevel: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    const now = new Date();
    const { level, reason, durationDays } = parsed.data;
    const penaltyLevel =
      level === "WARNING" && !["NONE", "WARNING"].includes(profile.penaltyLevel)
        ? profile.penaltyLevel
        : (level === "CLEAR" ? "NONE" : level);

    const updated = await prisma.profile.update({
      where: { id },
      data: {
        ...(level !== "CLEAR" && {
          violationCount: { increment: 1 },
          lastViolationAt: now,
        }),
        penaltyLevel: penaltyLevel as PenaltyLevel,
        ...(level === "WARNING" && {
          suspensionReason: reason,
        }),
        ...(level === "LIGHT" && {
          suspendedUntil: addDays(now, durationDays ?? 30),
          suspensionReason: reason,
          bannedAt: null,
        }),
        ...(level === "HEAVY" && {
          suspendedUntil: addDays(now, durationDays ?? 90),
          suspensionReason: reason,
          bannedAt: null,
        }),
        ...(level === "BAN" && {
          bannedAt: now,
          suspendedUntil: null,
          suspensionReason: reason,
        }),
        ...(level === "CLEAR" && {
          suspendedUntil: null,
          bannedAt: null,
          suspensionReason: null,
        }),
      },
      select: {
        id: true,
        penaltyLevel: true,
        suspendedUntil: true,
        bannedAt: true,
      },
    });

    await sendNotification({
      userId: id,
      type: NotificationType.REVIEW_REQUESTED,
      title: level === "CLEAR" ? "계정 제한이 해제되었습니다" : "계정 이용 제한 안내",
      message: reason,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/admin/profiles/[id]/penalty error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
