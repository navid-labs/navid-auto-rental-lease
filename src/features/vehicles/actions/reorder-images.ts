'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

type ReorderResult = { success: true } | { error: string }

/**
 * Persist a new order for vehicle images.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check
 * - Updates order field for each image, sets isPrimary on order=0
 */
export async function reorderVehicleImages(
  vehicleId: string,
  orderedImageIds: string[]
): Promise<ReorderResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 정렬 권한이 없습니다.' }
  }

  // Ownership check for dealers
  if (user.role === 'DEALER') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { dealerId: true },
    })
    if (vehicle?.dealerId !== user.id) {
      return { error: '본인의 차량만 수정할 수 있습니다.' }
    }
  }

  // Validate all imageIds belong to this vehicle
  const images = await prisma.vehicleImage.findMany({
    where: { vehicleId },
    select: { id: true },
  })
  const validIds = new Set(images.map((img) => img.id))
  const allValid = orderedImageIds.every((id) => validIds.has(id))
  if (!allValid) {
    return { error: '유효하지 않은 이미지가 포함되어 있습니다.' }
  }

  // Update all images in a transaction
  await prisma.$transaction(
    orderedImageIds.map((imageId, index) =>
      prisma.vehicleImage.update({
        where: { id: imageId },
        data: {
          order: index,
          isPrimary: index === 0,
        },
      })
    )
  )

  return { success: true }
}
