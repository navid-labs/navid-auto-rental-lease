'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type DeactivateResult = { success: true } | { error: string }

/**
 * Admin-only user deactivation.
 * Since Profile schema lacks isActive field, we mark the user by appending
 * "(비활성)" suffix to name as a demo-ready approach.
 * For production, add isActive column via migration.
 */
export async function deactivateUser(userId: string): Promise<DeactivateResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'ADMIN') return { error: '관리자만 사용자를 비활성화할 수 있습니다.' }

  if (userId === user.id) return { error: '자기 자신은 비활성화할 수 없습니다.' }

  const target = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  })

  if (!target) return { error: '사용자를 찾을 수 없습니다.' }
  if (target.name?.includes('(비활성)')) return { error: '이미 비활성화된 사용자입니다.' }

  const deactivatedName = target.name
    ? `${target.name} (비활성)`
    : '(비활성)'

  await prisma.profile.update({
    where: { id: userId },
    data: { name: deactivatedName },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
