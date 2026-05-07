import { NextRequest, NextResponse } from "next/server";

import { isAuthError, requireActiveProfile } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_TYPES,
  BUCKET,
  MAX_SIZE,
  createSignedKeyUrl,
  deletePrivateObject,
  uploadPrivateObject,
} from "@/lib/supabase/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireActiveProfile();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        registrationDocumentKey: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (listing.sellerId !== auth.userId && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (listing.status === "REJECTED") {
      return NextResponse.json(
        { error: "거절된 매물에는 업로드 불가" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: "허용되지 않는 파일 형식입니다. (JPEG, PNG, WebP, PDF만 가능)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 20MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const bucket = BUCKET.LISTING_DOCUMENTS;
    const { key } = await uploadPrivateObject({
      bucket,
      folder: `listing-${id}`,
      file,
      contentType: file.type,
      fileName: file.name,
    });

    const previousKey = listing.registrationDocumentKey;
    await prisma.listing.update({
      where: { id },
      data: { registrationDocumentKey: key },
    });

    if (previousKey) {
      await deletePrivateObject(bucket, previousKey);
    }

    const signedUrl = await createSignedKeyUrl(bucket, key, 3600);

    return NextResponse.json({ key, signedUrl });
  } catch (error) {
    console.error("POST /api/listings/[id]/registration-document error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
