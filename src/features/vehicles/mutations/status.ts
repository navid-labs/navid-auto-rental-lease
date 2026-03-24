import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'
import { canTransition } from '@/features/vehicles/utils/status-machine'
import type { VehicleStatus } from '@prisma/client'

type StatusResult = { success: true } | { error: string }

/**
 * Update vehicle status with state machine validation and audit logging.
 * Validates the transition via canTransition() before applying.
 * Auth check: CUSTOMER role is rejected; DEALER must own the vehicle.
 */
export async function updateVehicleStatusMutation(
  vehicleId: string,
  newStatus: VehicleStatus,
  note: string | undefined,
  user: UserProfile,
): Promise<StatusResult> {
  if (user.role === 'CUSTOMER') return { error: '차량 상태 변경 권한이 없습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, status: true, dealerId: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  if (user.role === 'DEALER' && vehicle.dealerId !== user.id) {
    return { error: '이 차량의 상태를 변경할 권한이 없습니다.' }
  }

  const role = user.role as 'DEALER' | 'ADMIN'
  if (!canTransition(vehicle.status, newStatus, role)) {
    return { error: '상태를 변경할 수 없습니다.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: newStatus },
    })

    await tx.vehicleStatusLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.status,
        toStatus: newStatus,
        changedBy: user.id,
        note: note ?? null,
      },
    })
  })

  return { success: true }
}
