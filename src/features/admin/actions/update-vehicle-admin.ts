'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'

const updateVehicleSchema = z.object({
  year: z.number().int().min(2000).max(2026),
  mileage: z.number().int().min(0),
  color: z.string().min(1, '색상을 입력해주세요.'),
  price: z.number().int().min(0),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'LEASED', 'MAINTENANCE']),
})

export type UpdateVehicleData = z.infer<typeof updateVehicleSchema>

type UpdateResult = { success: true } | { error: string }

/**
 * Admin-only vehicle update action.
 */
export async function updateVehicleAdmin(
  vehicleId: string,
  data: UpdateVehicleData
): Promise<UpdateResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'ADMIN') return { error: '관리자만 차량을 수정할 수 있습니다.' }

  const parsed = updateVehicleSchema.safeParse(data)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { error: firstIssue?.message ?? '유효하지 않은 데이터입니다.' }
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, status: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        year: parsed.data.year,
        mileage: parsed.data.mileage,
        color: parsed.data.color,
        price: parsed.data.price,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
      },
    })

    // Log status change if status changed
    if (vehicle.status !== parsed.data.status) {
      await tx.vehicleStatusLog.create({
        data: {
          vehicleId,
          fromStatus: vehicle.status,
          toStatus: parsed.data.status,
          changedBy: user.id,
          note: '관리자 차량 정보 수정',
        },
      })
    }
  })

  revalidatePath('/admin/vehicles')
  return { success: true }
}
