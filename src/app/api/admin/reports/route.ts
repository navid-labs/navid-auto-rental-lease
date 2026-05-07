import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type Prisma } from "@prisma/client";

import { isAuthError, requireRole } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";

const querySchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]).default("PENDING"),
  targetType: z.enum(["LISTING", "MESSAGE", "PROFILE", "REVIEW"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const parsed = querySchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      targetType: request.nextUrl.searchParams.get("targetType") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, targetType, page, pageSize, sort } = parsed.data;
    const where: Prisma.ReportWhereInput = {
      status,
      ...(targetType && { targetType }),
    };

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          status: true,
          targetType: true,
          targetId: true,
          reason: true,
          description: true,
          resolution: true,
          createdAt: true,
          reviewedAt: true,
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
