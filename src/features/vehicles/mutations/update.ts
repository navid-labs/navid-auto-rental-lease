import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'

type UpdateResult = { success: true } | { error: string }

/**
 * Update a vehicle listing.
 * - Dealer: can only update own vehicles; resets approval to PENDING if currently APPROVED
 * - Admin: can update any vehicle without approval reset
 * Auth check: CUSTOMER role is rejected.
 */
export async function updateVehicleMutation(
  vehicleId: string,
  data: Record<string, unknown>,
  user: UserProfile,
): Promise<UpdateResult> {
  if (user.role === 'CUSTOMER') return { error: '차량 수정 권한이 없습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, dealerId: true, approvalStatus: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  if (user.role === 'DEALER' && vehicle.dealerId !== user.id) {
    return { error: '이 차량을 수정할 권한이 없습니다.' }
  }

  // Reset approval when dealer edits an approved vehicle
  const shouldResetApproval =
    user.role === 'DEALER' && vehicle.approvalStatus === 'APPROVED'

  if (shouldResetApproval) {
    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...data,
          approvalStatus: 'PENDING',
          approvedBy: null,
          approvedAt: null,
          rejectionReason: null,
        },
      })

      await tx.vehicleApprovalLog.create({
        data: {
          vehicleId,
          fromStatus: 'APPROVED',
          toStatus: 'PENDING',
          reason: '딜러 수정으로 인한 재승인 필요',
          changedBy: user.id,
        },
      })
    })
  } else {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data,
    })
  }

  return { success: true }
}
