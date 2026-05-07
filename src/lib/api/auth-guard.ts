import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@prisma/client";

export type AuthResult = {
  userId: string;
  role: UserRole;
};

/**
 * Require authenticated user. Returns userId and role, or a 401 response.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 401 });
  }

  return { userId: profile.id, role: profile.role };
}

/**
 * Require specific role(s). Returns auth result or 403 response.
 */
export async function requireRole(...roles: UserRole[]): Promise<AuthResult | NextResponse> {
  const result = await requireAuth();
  if (isAuthError(result)) return result;

  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  return result;
}

export async function requireActiveProfile(): Promise<AuthResult | NextResponse> {
  const result = await requireAuth();
  if (isAuthError(result)) return result;

  const profile = await prisma.profile.findUnique({
    where: { id: result.userId },
    select: {
      bannedAt: true,
      suspendedUntil: true,
      penaltyLevel: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 401 });
  }

  if (profile.bannedAt) {
    return NextResponse.json(
      { error: "계정이 영구 정지되었습니다.", code: "BANNED" },
      { status: 403 }
    );
  }

  if (profile.suspendedUntil && profile.suspendedUntil > new Date()) {
    return NextResponse.json(
      {
        error: `계정이 ${profile.suspendedUntil.toISOString().slice(0, 10)}까지 정지되었습니다.`,
        code: "SUSPENDED",
        suspendedUntil: profile.suspendedUntil.toISOString(),
      },
      { status: 403 }
    );
  }

  return result;
}

/** Type guard to check if auth result is an error response */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
