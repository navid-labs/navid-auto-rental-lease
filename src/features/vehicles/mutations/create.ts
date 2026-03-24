import { prisma } from '@/lib/db/prisma'
import type { UserProfile } from '@/lib/auth/helpers'
import { vehicleFormSchema } from '@/features/vehicles/schemas/vehicle'
import type { VehicleFormData } from '@/features/vehicles/types'

type CreateResult = { success: true; vehicleId: string } | { error: string }

/**
 * Create a new vehicle listing in the database.
 * - Dealer: dealerId is set to user.id
 * - Admin: accepts optional dealerIdOverride, defaults to user.id
 * Auth check: CUSTOMER role is rejected.
 */
export async function createVehicleMutation(
  data: VehicleFormData,
  user: UserProfile,
  dealerIdOverride?: string,
): Promise<CreateResult> {
  if (user.role === 'CUSTOMER') return { error: '차량 등록 권한이 없습니다.' }

  const parsed = vehicleFormSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'
    return { error: firstError }
  }

  const { trimId, licensePlate, year, mileage, color, price, monthlyRental, monthlyLease, description } = parsed.data

  const dealerId =
    user.role === 'ADMIN' && dealerIdOverride ? dealerIdOverride : user.id

  const isAdmin = user.role === 'ADMIN'

  const vehicle = await prisma.vehicle.create({
    data: {
      trimId,
      dealerId,
      year,
      mileage,
      color,
      price,
      licensePlate: licensePlate || null,
      monthlyRental: monthlyRental ?? null,
      monthlyLease: monthlyLease ?? null,
      description: description ?? null,
      approvalStatus: isAdmin ? 'APPROVED' : 'PENDING',
      approvedBy: isAdmin ? user.id : null,
      approvedAt: isAdmin ? new Date() : null,
    },
  })

  return { success: true, vehicleId: vehicle.id }
}
