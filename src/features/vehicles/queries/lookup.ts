import type { UserProfile } from '@/lib/auth/helpers'
import { lookupPlate as lookupPlateAdapter, type PlateResult } from '@/features/vehicles/utils/plate-adapter'

type LookupResult = { success: true; data: PlateResult } | { error: string }

/**
 * Look up vehicle data by license plate number.
 * Requires DEALER or ADMIN role.
 */
export async function lookupPlateMutation(
  plateNumber: string,
  user: UserProfile,
): Promise<LookupResult> {
  if (user.role === 'CUSTOMER') return { error: '번호판 조회 권한이 없습니다.' }

  const result = await lookupPlateAdapter(plateNumber)
  if (!result) return { error: '차량 정보를 찾을 수 없습니다.' }

  return { success: true, data: result }
}
