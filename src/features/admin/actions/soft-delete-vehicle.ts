'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type SoftDeleteResult = { success: true } | { error: string }

/**
 * Admin-only soft delete: sets vehicle status to HIDDEN with audit trail.
 */
export async function softDeleteVehicle(vehicleId: string): Promise<SoftDeleteResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'ADMIN') return { error: '관리자만 차량을 삭제할 수 있습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, status: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }
  if (vehicle.status === 'HIDDEN') return { error: '이미 숨김 처리된 차량입니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'HIDDEN' },
    })

    await tx.vehicleStatusLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.status,
        toStatus: 'HIDDEN',
        changedBy: user.id,
        note: '관리자 차량 삭제 (숨김 처리)',
      },
    })
  })

  revalidatePath('/admin/vehicles')
  return { success: true }
}
