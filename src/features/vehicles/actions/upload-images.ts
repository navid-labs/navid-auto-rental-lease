'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { MAX_IMAGES_PER_VEHICLE } from '@/features/vehicles/utils/image-compression'

type UploadResult =
  | { success: true; image: { id: string; url: string; order: number } }
  | { error: string }

/**
 * Upload a vehicle image to Supabase Storage and create a VehicleImage record.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check (vehicle.dealerId === user.id)
 * - Max 10 images per vehicle
 * - First image is set as primary
 */
export async function uploadVehicleImage(
  vehicleId: string,
  formData: FormData
): Promise<UploadResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 업로드 권한이 없습니다.' }
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

  // Check image count limit
  const existingCount = await prisma.vehicleImage.count({
    where: { vehicleId },
  })
  if (existingCount >= MAX_IMAGES_PER_VEHICLE) {
    return { error: `최대 ${MAX_IMAGES_PER_VEHICLE}장까지 업로드할 수 있습니다.` }
  }

  const file = formData.get('file') as File | null
  if (!file) return { error: '파일을 선택해주세요.' }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'webp'
  const filePath = `vehicles/${vehicleId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: '이미지 업로드에 실패했습니다.' }
  }

  const { data: urlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(filePath)

  const image = await prisma.vehicleImage.create({
    data: {
      vehicleId,
      url: urlData.publicUrl,
      order: existingCount,
      isPrimary: existingCount === 0,
    },
  })

  return { success: true, image: { id: image.id, url: image.url, order: image.order } }
}
