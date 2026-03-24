import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'

export const updateVehicleSchema = z.object({
  year: z.number().int().min(2000).max(2026),
  mileage: z.number().int().min(0),
  color: z.string().min(1, '색상을 입력해주세요.'),
  price: z.number().int().min(0),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'LEASED', 'MAINTENANCE']),
})

export type UpdateVehicleData = z.infer<typeof updateVehicleSchema>
export type UpdateVehicleResult = { success: true } | { error: string }
export type SoftDeleteVehicleResult = { success: true } | { error: string }

/**
 * Admin-only vehicle update with optional status change audit log.
 */
export async function updateVehicleAdminMutation(
  vehicleId: string,
  data: UpdateVehicleData,
  user: UserProfile
): Promise<UpdateVehicleResult> {
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

  return { success: true }
}

/**
 * Admin-only soft delete: sets vehicle status to HIDDEN with audit trail.
 */
export async function softDeleteVehicleMutation(
  vehicleId: string,
  user: UserProfile
): Promise<SoftDeleteVehicleResult> {
  if (user.role !== 'ADMIN') return { error: '관리자만 차량을 삭제할 수 있습니다.' }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, status: true },
  })

  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }
  if (vehicle.status === 'HIDDEN') return { error: '이미 숨김 처리된 차량입니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'HIDDEN' },
    })

    await tx.vehicleStatusLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.status,
        toStatus: 'HIDDEN',
        changedBy: user.id,
        note: '관리자 차량 삭제 (숨김 처리)',
      },
    })
  })

  return { success: true }
}
