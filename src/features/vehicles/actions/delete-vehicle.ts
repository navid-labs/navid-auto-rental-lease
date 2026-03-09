'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type DeleteResult = { success: true } | { error: string }

/**
 * Soft delete a vehicle by setting status to HIDDEN.
 * Creates a VehicleStatusLog entry for audit trail.
 * - Dealer: can only delete own vehicles
 * - Admin: can delete any vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<DeleteResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role === 'CUSTOMER') return { error: '차량 삭제 권한이 없습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, dealerId: true, status: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  if (user.role === 'DEALER' && vehicle.dealerId !== user.id) {
    return { error: '이 차량을 삭제할 권한이 없습니다.' }
  }

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
        note: '차량 삭제 (숨김 처리)',
      },
    })
  })

  return { success: true }
}
