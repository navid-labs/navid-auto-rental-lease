import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotificationType } from "@prisma/client";

import { isAuthError, requireRole } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/notifications/send";

const resolveReportSchema = z.object({
  resolution: z.enum(["UPHELD_HIDE", "DISMISSED_FALSE", "ESCALATED"]),
  adminNote: z.string().max(1000).optional(),
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
    const parsed = resolveReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        reporterId: true,
        targetType: true,
        targetId: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "신고를 찾을 수 없습니다." }, { status: 404 });
    }

    if (report.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 신고" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resolved = await tx.report.update({
        where: { id },
        data: {
          status: "REVIEWED",
          resolution: parsed.data.resolution,
          reviewedBy: auth.userId,
          reviewedAt: new Date(),
        },
        select: { id: true, status: true, resolution: true },
      });

      if (parsed.data.resolution === "ESCALATED") {
        return resolved;
      }

      if (report.targetType === "LISTING") {
        if (parsed.data.resolution === "UPHELD_HIDE") {
          await tx.listing.updateMany({
            where: { id: report.targetId, status: { not: "REJECTED" } },
            data: {
              status: "REJECTED",
              rejectionReason:
                parsed.data.adminNote?.trim() ||
                "신고 검토 결과 비공개 처리되었습니다.",
            },
          });
        } else {
          await tx.listing.updateMany({
            where: {
              id: report.targetId,
              status: "PENDING",
              reviewReason: "REPORTS_THRESHOLD",
            },
            data: { status: "ACTIVE", reviewReason: null },
          });
        }
      }

      if (report.targetType === "MESSAGE") {
        if (parsed.data.resolution === "UPHELD_HIDE") {
          await tx.chatMessage.updateMany({
            where: { id: report.targetId },
            data: { reviewStatus: "BLOCKED", blockReason: "ADMIN_BLOCK" },
          });
        } else {
          await tx.chatMessage.updateMany({
            where: {
              id: report.targetId,
              reviewStatus: "BLOCKED",
              blockReason: "REPORTS_THRESHOLD",
            },
            data: { reviewStatus: "APPROVED", blockReason: null },
          });
        }
      }

      return resolved;
    });

    if (parsed.data.resolution === "UPHELD_HIDE") {
      await sendNotification({
        userId: report.reporterId,
        type: NotificationType.REVIEW_REQUESTED,
        title: "신고 처리 결과",
        message: "접수하신 신고가 검토되어 조치되었습니다.",
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/admin/reports/[id]/resolve error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
