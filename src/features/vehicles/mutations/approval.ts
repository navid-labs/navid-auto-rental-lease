import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'
import type { ApprovalStatus } from '@prisma/client'

type ApprovalResult = { success: true } | { error: string }

/**
 * Approve or reject a single vehicle. Admin only.
 * Creates an audit log entry in VehicleApprovalLog.
 */
export async function approveVehicleMutation(
  vehicleId: string,
  action: 'APPROVED' | 'REJECTED',
  reason: string | undefined,
  user: UserProfile,
): Promise<ApprovalResult> {
  if (user.role !== 'ADMIN') return { error: '승인 권한이 없습니다.' }

  if (action === 'REJECTED' && !reason?.trim()) {
    return { error: '거절 사유를 입력해주세요.' }
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, approvalStatus: true },
  })
  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        approvalStatus: action,
        rejectionReason: action === 'REJECTED' ? reason!.trim() : null,
        approvedBy: action === 'APPROVED' ? user.id : null,
        approvedAt: action === 'APPROVED' ? new Date() : null,
      },
    })

    await tx.vehicleApprovalLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.approvalStatus,
        toStatus: action,
        reason: reason?.trim() ?? null,
        changedBy: user.id,
      },
    })
  })

  return { success: true }
}

/**
 * Batch approve multiple PENDING vehicles. Admin only.
 * Skips non-PENDING vehicles. Atomic via $transaction.
 */
export async function batchApproveVehiclesMutation(
  vehicleIds: string[],
  user: UserProfile,
): Promise<ApprovalResult> {
  if (user.role !== 'ADMIN') return { error: '승인 권한이 없습니다.' }

  await prisma.$transaction(async (tx) => {
    const vehicles = await tx.vehicle.findMany({
      where: { id: { in: vehicleIds }, approvalStatus: 'PENDING' },
      select: { id: true, approvalStatus: true },
    })

    if (vehicles.length === 0) return

    await tx.vehicle.updateMany({
      where: { id: { in: vehicles.map((v) => v.id) } },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    })

    await tx.vehicleApprovalLog.createMany({
      data: vehicles.map((v) => ({
        vehicleId: v.id,
        fromStatus: v.approvalStatus,
        toStatus: 'APPROVED' as ApprovalStatus,
        changedBy: user.id,
      })),
    })
  })

  return { success: true }
}
