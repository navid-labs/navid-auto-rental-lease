import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { urls } = (await request.json()) as { urls: string[] };

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array is required" }, { status: 400 });
  }

  const images = await prisma.listingImage.createMany({
    data: urls.map((url: string, i: number) => ({
      listingId: id,
      url,
      order: i,
      isPrimary: i === 0,
    })),
  });

  return NextResponse.json({ count: images.count }, { status: 201 });
}
