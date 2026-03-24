import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { restoreVehicleMutation } from '@/features/vehicles/mutations/misc'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const result = await restoreVehicleMutation(id, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
