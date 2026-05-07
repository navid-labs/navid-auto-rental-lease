import { NextRequest, NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api/auth-guard";
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
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const escrow = await prisma.escrowPayment.findUnique({
      where: { id },
      select: {
        buyerId: true,
        sellerId: true,
        status: true,
        transferProofKey: true,
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow payment not found" }, { status: 404 });
    }

    if (escrow.buyerId !== auth.userId && escrow.sellerId !== auth.userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (escrow.status !== "PAID") {
      return NextResponse.json(
        { error: "명의변경 증빙은 결제 완료 후 업로드 가능합니다" },
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

    const bucket = BUCKET.TRANSFER_PROOFS;
    const { key } = await uploadPrivateObject({
      bucket,
      folder: `escrow-${id}`,
      file,
      contentType: file.type,
      fileName: file.name,
    });

    const previousKey = escrow.transferProofKey;
    await prisma.escrowPayment.update({
      where: { id },
      data: { transferProofKey: key },
    });

    if (previousKey) {
      await deletePrivateObject(bucket, previousKey);
    }

    const signedUrl = await createSignedKeyUrl(bucket, key, 3600);

    return NextResponse.json({ key, signedUrl });
  } catch (error) {
    console.error("POST /api/escrow/[id]/transfer-proof error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
