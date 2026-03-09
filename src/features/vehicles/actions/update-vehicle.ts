'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type UpdateResult = { success: true } | { error: string }

/**
 * Update a vehicle listing.
 * - Dealer: can only update own vehicles (dealerId matches)
 * - Admin: can update any vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  data: Record<string, unknown>
): Promise<UpdateResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role === 'CUSTOMER') return { error: '차량 수정 권한이 없습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, dealerId: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  // Ownership check for dealers
  if (user.role === 'DEALER' && vehicle.dealerId !== user.id) {
    return { error: '이 차량을 수정할 권한이 없습니다.' }
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data,
  })

  return { success: true }
}
