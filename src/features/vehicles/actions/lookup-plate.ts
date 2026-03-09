'use server'

import { getCurrentUser } from '@/lib/auth/helpers'
import { lookupPlate as lookupPlateAdapter, type PlateResult } from '@/features/vehicles/utils/plate-adapter'

type LookupResult = { success: true; data: PlateResult } | { error: string }

/**
 * Server Action wrapper for license plate lookup.
 * Requires DEALER or ADMIN role.
 */
export async function lookupPlateAction(plateNumber: string): Promise<LookupResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role === 'CUSTOMER') return { error: '번호판 조회 권한이 없습니다.' }

  const result = await lookupPlateAdapter(plateNumber)
  if (!result) return { error: '차량 정보를 찾을 수 없습니다.' }

  return { success: true, data: result }
}
