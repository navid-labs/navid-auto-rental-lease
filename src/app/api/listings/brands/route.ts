import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const results = await prisma.listing.findMany({
      where: { status: "ACTIVE", brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });

    const brands = results
      .map((r) => r.brand)
      .filter((b): b is string => b !== null);

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/listings/brands error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
