'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type RestoreResult = { success: true } | { error: string }

/**
 * Restore a hidden vehicle back to AVAILABLE status.
 * Admin only -- dealers cannot restore hidden vehicles.
 */
export async function restoreVehicle(vehicleId: string): Promise<RestoreResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'ADMIN') return { error: '관리자만 차량을 복구할 수 있습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, status: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }
  if (vehicle.status !== 'HIDDEN') return { error: '숨김 상태인 차량만 복구할 수 있습니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'AVAILABLE' },
    })

    await tx.vehicleStatusLog.create({
      data: {
        vehicleId,
        fromStatus: 'HIDDEN',
        toStatus: 'AVAILABLE',
        changedBy: user.id,
        note: '차량 복구 (숨김 해제)',
      },
    })
  })

  return { success: true }
}
