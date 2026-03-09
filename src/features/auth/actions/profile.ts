'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { profileUpdateSchema } from '@/features/auth/schemas/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = ['CUSTOMER', 'DEALER', 'ADMIN'] as const
type UserRole = (typeof VALID_ROLES)[number]

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
  }

  const parsed = profileUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: '입력 정보를 확인해주세요.' }
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
    },
  })

  revalidatePath('/mypage')
  return { success: true }
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: '권한이 없습니다.' }
  }

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

  revalidatePath('/admin/users')
  return { success: true }
}
