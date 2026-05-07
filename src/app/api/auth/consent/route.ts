import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const optIn =
    payload && typeof payload === "object" && "marketingOptIn" in payload
      ? (payload as { marketingOptIn: unknown }).marketingOptIn
      : undefined;
  if (typeof optIn !== "boolean") {
    return NextResponse.json({ error: "marketingOptIn must be boolean" }, { status: 400 });
  }

  const now = new Date();
  await prisma.profile.update({
    where: { id: auth.userId },
    data: {
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      marketingOptIn: optIn,
      marketingOptInAt: optIn ? now : null,
    },
  });

  return NextResponse.json({ ok: true });
}
