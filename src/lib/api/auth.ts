import { NextResponse } from 'next/server'
import { getCurrentUser, type UserProfile } from '@/lib/auth/helpers'

export type AuthResult =
  | { user: UserProfile; error?: never }
  | { user?: never; error: NextResponse }

export async function requireAuth(): Promise<AuthResult> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 },
      ),
    }
  }
  return { user }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result

  if (result.user.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 },
      ),
    }
  }
  return result
}

export async function requireRole(
  ...roles: UserProfile['role'][]
): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result

  if (!roles.includes(result.user.role)) {
    return {
      error: NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 },
      ),
    }
  }
  return result
}
