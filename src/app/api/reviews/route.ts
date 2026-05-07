import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireActiveProfile, isAuthError } from "@/lib/api/auth-guard";

const reviewSchema = z.object({
  dealerId: z.string().uuid("딜러 ID가 유효하지 않습니다."),
  listingId: z.string().uuid("매물 ID가 유효하지 않습니다."),
  rating: z.number().int().min(1, "별점은 1 이상이어야 합니다.").max(5, "별점은 5 이하여야 합니다."),
  comment: z
    .string()
    .min(1, "후기를 입력해주세요.")
    .max(100, "후기는 100자 이하로 입력해주세요."),
});

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get("dealerId");
    if (!dealerId) {
      return NextResponse.json({ error: "dealerId가 필요합니다." }, { status: 400 });
    }

    const reviews = await prisma.dealerReview.findMany({
      where: { dealerId },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { name: true } },
      },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      count: reviews.length,
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveProfile();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { dealerId, listingId, rating, comment } = parsed.data;

    // 자기 자신에게 후기 불가
    if (auth.userId === dealerId) {
      return NextResponse.json(
        { error: "자신에게 후기를 작성할 수 없습니다." },
        { status: 400 }
      );
    }

    // listing SOLD 상태 확인
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }
    if (listing.status !== "SOLD") {
      return NextResponse.json(
        { error: "거래가 완료된 매물에만 후기를 작성할 수 있습니다." },
        { status: 400 }
      );
    }

    const review = await prisma.dealerReview.create({
      data: {
        reviewerId: auth.userId,
        dealerId,
        listingId,
        rating,
        comment,
      },
      include: {
        reviewer: { select: { name: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    // unique 제약 위반 (이미 후기 작성)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "이미 이 매물에 대한 후기를 작성했습니다." },
        { status: 409 }
      );
    }
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
