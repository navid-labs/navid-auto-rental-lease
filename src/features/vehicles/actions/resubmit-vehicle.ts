'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type ResubmitResult = { success: true } | { error: string }

/**
 * Resubmit a REJECTED vehicle for re-approval. Dealer only, owner only.
 * Resets approval status to PENDING, clears rejectionReason, logs in VehicleApprovalLog.
 */
export async function resubmitVehicle(
  vehicleId: string
): Promise<ResubmitResult> {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'DEALER' && user.role !== 'ADMIN')) {
    return { error: '재승인 요청 권한이 없습니다.' }
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, dealerId: true, approvalStatus: true, rejectionReason: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  // Ownership check for dealers
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
