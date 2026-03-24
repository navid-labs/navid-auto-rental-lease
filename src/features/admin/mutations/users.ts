import { prisma } from '@/lib/db/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile } from '@/lib/auth/helpers'

const VALID_ROLES = ['CUSTOMER', 'DEALER', 'ADMIN'] as const
type UserRole = (typeof VALID_ROLES)[number]

export type DeactivateUserResult = { success: true } | { error: string }
export type ChangeUserRoleResult = { success: true } | { error: string }

/**
 * Admin-only user deactivation.
 * Marks the user by appending "(비활성)" suffix to name as a demo-ready approach.
 * For production, add isActive column via migration.
 */
export async function deactivateUserMutation(
  userId: string,
  user: UserProfile
): Promise<DeactivateUserResult> {
  if (user.role !== 'ADMIN') return { error: '관리자만 사용자를 비활성화할 수 있습니다.' }
  if (userId === user.id) return { error: '자기 자신은 비활성화할 수 없습니다.' }

  const target = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  })

  if (!target) return { error: '사용자를 찾을 수 없습니다.' }
  if (target.name?.includes('(비활성)')) return { error: '이미 비활성화된 사용자입니다.' }

  const deactivatedName = target.name ? `${target.name} (비활성)` : '(비활성)'

  await prisma.profile.update({
    where: { id: userId },
    data: { name: deactivatedName },
  })

  return { success: true }
}

/**
 * Admin-only role change: updates both Prisma profile and Supabase auth metadata.
 */
export async function changeUserRoleMutation(
  userId: string,
  newRole: UserRole,
  user: UserProfile
): Promise<ChangeUserRoleResult> {
  if (user.role !== 'ADMIN') return { error: '권한이 없습니다.' }

  if (!VALID_ROLES.includes(newRole)) {
    return { error: '유효하지 않은 역할입니다.' }
  }

  const adminClient = createAdminClient()
  await Promise.all([
    prisma.profile.update({
      where: { id: userId },
      data: { role: newRole },
    }),
    adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { role: newRole },
    }),
  ])

  return { success: true }
}
