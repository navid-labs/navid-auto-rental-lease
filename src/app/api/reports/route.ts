import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAuthError, requireActiveProfile } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9_\-./]+$/;

const reportSchema = z.object({
  targetType: z.enum(["LISTING", "MESSAGE", "PROFILE", "REVIEW"]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "FALSE_LISTING",
    "CONTACT_BYPASS",
    "HARASSMENT",
    "SPAM",
    "SCAM",
    "OTHER",
  ]),
  description: z.string().max(1000).optional(),
  evidenceKeys: z.array(z.string()).max(5).optional(),
});

type AutoAction = "LISTING_HIDDEN" | "MESSAGE_BLOCKED" | "NONE";

function isSafeEvidenceKey(key: string): boolean {
  return (
    !key.startsWith("/") &&
    !key.endsWith("/") &&
    !key.includes("..") &&
    !key.startsWith("http://") &&
    !key.startsWith("https://") &&
    SAFE_KEY_PATTERN.test(key)
  );
}

async function applyReportThresholdAction(input: {
  targetType: "LISTING" | "MESSAGE" | "PROFILE" | "REVIEW";
  targetId: string;
  since: Date;
}): Promise<AutoAction> {
  if (input.targetType !== "LISTING" && input.targetType !== "MESSAGE") {
    return "NONE";
  }

  const reporters = await prisma.report.findMany({
    where: {
      targetType: input.targetType,
      targetId: input.targetId,
      createdAt: { gt: input.since },
    },
    distinct: ["reporterId"],
    select: { reporterId: true },
  });

  if (input.targetType === "LISTING" && reporters.length >= 3) {
    const result = await prisma.listing.updateMany({
      where: { id: input.targetId, status: "ACTIVE" },
      data: { status: "PENDING", reviewReason: "REPORTS_THRESHOLD" },
    });
    return result.count > 0 ? "LISTING_HIDDEN" : "NONE";
  }

  if (input.targetType === "MESSAGE" && reporters.length >= 2) {
    const result = await prisma.chatMessage.updateMany({
      where: { id: input.targetId, reviewStatus: { not: "BLOCKED" } },
      data: { reviewStatus: "BLOCKED", blockReason: "REPORTS_THRESHOLD" },
    });
    return result.count > 0 ? "MESSAGE_BLOCKED" : "NONE";
  }

  return "NONE";
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveProfile();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const evidenceKeys = data.evidenceKeys ?? [];

    if (!evidenceKeys.every(isSafeEvidenceKey)) {
      return NextResponse.json(
        { error: "증빙 key 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: auth.userId },
      select: { createdAt: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 401 });
    }

    const now = new Date();
    const oneDayAfterSignup = new Date(profile.createdAt.getTime() + 24 * 60 * 60 * 1000);

    if (oneDayAfterSignup > now) {
      return NextResponse.json({ error: "신고 자격이 부족합니다" }, { status: 403 });
    }

    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [
      listingCount,
      sentMessageCount,
      buyerPaymentCount,
      sellerPaymentCount,
      recentReportCount,
    ] = await Promise.all([
      prisma.listing.count({ where: { sellerId: auth.userId } }),
      prisma.chatMessage.count({ where: { senderId: auth.userId } }),
      prisma.escrowPayment.count({ where: { buyerId: auth.userId } }),
      prisma.escrowPayment.count({ where: { sellerId: auth.userId } }),
      prisma.report.count({
        where: {
          reporterId: auth.userId,
          createdAt: { gt: since24h },
        },
      }),
    ]);

    if (
      listingCount === 0 &&
      sentMessageCount === 0 &&
      buyerPaymentCount === 0 &&
      sellerPaymentCount === 0
    ) {
      return NextResponse.json({ error: "신고 자격이 부족합니다" }, { status: 403 });
    }

    if (recentReportCount >= 5) {
      return NextResponse.json(
        { error: "신고는 24시간에 5건까지만 가능합니다." },
        { status: 429 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: auth.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        evidenceKeys: evidenceKeys.length > 0 ? evidenceKeys : undefined,
        status: "PENDING",
      },
      select: { id: true, status: true },
    });

    const autoAction = await applyReportThresholdAction({
      targetType: data.targetType,
      targetId: data.targetId,
      since: since24h,
    });

    return NextResponse.json({ ...report, autoAction });
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
