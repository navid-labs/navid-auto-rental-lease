import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/supabase/auth";
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

/** Type guard to check if auth result is an error response */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
