'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

type DeleteResult = { success: true } | { error: string }

/**
 * Delete a vehicle image from Supabase Storage and database.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check via vehicle relation
 * - If deleted image was primary, promotes next image (lowest order) to primary
 */
export async function deleteVehicleImage(imageId: string): Promise<DeleteResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 삭제 권한이 없습니다.' }
  }

  const image = await prisma.vehicleImage.findUnique({
    where: { id: imageId },
    include: { vehicle: { select: { dealerId: true } } },
  })

  if (!image) return { error: '이미지를 찾을 수 없습니다.' }

  // Ownership check for dealers
  if (user.role === 'DEALER' && image.vehicle.dealerId !== user.id) {
    return { error: '본인의 차량 이미지만 삭제할 수 있습니다.' }
  }

  // Remove from Supabase Storage
  // Parse storage path from public URL: extract everything after /vehicle-images/
  const storagePath = extractStoragePath(image.url)
  if (storagePath) {
    const supabase = createAdminClient()
    await supabase.storage.from('vehicle-images').remove([storagePath])
  }

  // Delete DB record
  await prisma.vehicleImage.delete({ where: { id: imageId } })

  // If deleted image was primary, promote next image
  if (image.isPrimary) {
    const nextImage = await prisma.vehicleImage.findFirst({
      where: { vehicleId: image.vehicleId },
      orderBy: { order: 'asc' },
    })
    if (nextImage) {
      await prisma.vehicleImage.update({
        where: { id: nextImage.id },
        data: { isPrimary: true },
      })
    }
  }

  return { success: true }
}

/** Extract storage path from a Supabase public URL */
function extractStoragePath(url: string): string | null {
  const marker = '/vehicle-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}
