import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { batchApproveVehiclesMutation } from '@/features/vehicles/mutations/approval'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = (await request.json()) as { vehicleIds: string[] }
    const result = await batchApproveVehiclesMutation(body.vehicleIds, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
