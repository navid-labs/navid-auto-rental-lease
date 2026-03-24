import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { MAX_IMAGES_PER_VEHICLE } from '@/features/vehicles/utils/image-compression'

type UploadResult =
  | { success: true; image: { id: string; url: string; order: number } }
  | { error: string }

type DeleteResult = { success: true } | { error: string }
type ReorderResult = { success: true } | { error: string }

/**
 * Upload a vehicle image to Supabase Storage and create a VehicleImage record.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check (vehicle.dealerId === user.id)
 * - Max 10 images per vehicle; first image is set as primary
 */
export async function uploadImageMutation(
  vehicleId: string,
  formData: FormData,
  user: UserProfile,
): Promise<UploadResult> {
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 업로드 권한이 없습니다.' }
  }

  if (user.role === 'DEALER') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { dealerId: true },
    })
    if (vehicle?.dealerId !== user.id) {
      return { error: '본인의 차량만 수정할 수 있습니다.' }
    }
  }

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

/**
 * Delete a vehicle image from Supabase Storage and database.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check via vehicle relation
 * - If deleted image was primary, promotes next image (lowest order) to primary
 */
export async function deleteImageMutation(
  imageId: string,
  user: UserProfile,
): Promise<DeleteResult> {
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 삭제 권한이 없습니다.' }
  }

  const image = await prisma.vehicleImage.findUnique({
    where: { id: imageId },
    include: { vehicle: { select: { dealerId: true } } },
  })

  if (!image) return { error: '이미지를 찾을 수 없습니다.' }

  if (user.role === 'DEALER' && image.vehicle.dealerId !== user.id) {
    return { error: '본인의 차량 이미지만 삭제할 수 있습니다.' }
  }

  const storagePath = extractStoragePath(image.url)
  if (storagePath) {
    const supabase = createAdminClient()
    await supabase.storage.from('vehicle-images').remove([storagePath])
  }

  await prisma.vehicleImage.delete({ where: { id: imageId } })

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

/**
 * Persist a new order for vehicle images.
 * - Auth: DEALER or ADMIN only
 * - Dealer: ownership check
 * - Updates order field for each image, sets isPrimary on order=0
 */
export async function reorderImagesMutation(
  vehicleId: string,
  orderedImageIds: string[],
  user: UserProfile,
): Promise<ReorderResult> {
  if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return { error: '이미지 정렬 권한이 없습니다.' }
  }

  if (user.role === 'DEALER') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { dealerId: true },
    })
    if (vehicle?.dealerId !== user.id) {
      return { error: '본인의 차량만 수정할 수 있습니다.' }
    }
  }

  const images = await prisma.vehicleImage.findMany({
    where: { vehicleId },
    select: { id: true },
  })
  const validIds = new Set(images.map((img) => img.id))
  const allValid = orderedImageIds.every((id) => validIds.has(id))
  if (!allValid) {
    return { error: '유효하지 않은 이미지가 포함되어 있습니다.' }
  }

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

/** Extract storage path from a Supabase public URL */
function extractStoragePath(url: string): string | null {
  const marker = '/vehicle-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}
