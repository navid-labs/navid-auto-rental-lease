import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'

type MutationResult = { success: true } | { error: string }

/**
 * Resubmit a REJECTED vehicle for re-approval. DEALER or ADMIN, owner only for dealers.
 * Resets approval status to PENDING, clears rejectionReason, logs in VehicleApprovalLog.
 */
export async function resubmitVehicleMutation(
  vehicleId: string,
  user: UserProfile,
): Promise<MutationResult> {
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '재승인 요청 권한이 없습니다.' }
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, dealerId: true, approvalStatus: true, rejectionReason: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  if (user.role === 'DEALER' && vehicle.dealerId !== user.id) {
    return { error: '이 차량의 재승인을 요청할 권한이 없습니다.' }
  }

  if (vehicle.approvalStatus !== 'REJECTED') {
    return { error: '거절된 차량만 재승인을 요청할 수 있습니다.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        approvalStatus: 'PENDING',
        rejectionReason: null,
        approvedBy: null,
        approvedAt: null,
      },
    })

    await tx.vehicleApprovalLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.approvalStatus,
        toStatus: 'PENDING',
        reason: null,
        changedBy: user.id,
      },
    })
  })

  return { success: true }
}

/**
 * Restore a hidden vehicle back to AVAILABLE status.
 * Admin only -- dealers cannot restore hidden vehicles.
 */
export async function restoreVehicleMutation(
  vehicleId: string,
  user: UserProfile,
): Promise<MutationResult> {
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
