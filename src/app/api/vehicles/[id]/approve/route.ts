import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { approveVehicleMutation } from '@/features/vehicles/mutations/approval'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = (await request.json()) as { action: 'APPROVED' | 'REJECTED'; reason?: string }
    const result = await approveVehicleMutation(id, body.action, body.reason, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
