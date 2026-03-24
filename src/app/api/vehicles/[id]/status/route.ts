import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { updateVehicleStatusMutation } from '@/features/vehicles/mutations/status'
import type { VehicleStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('DEALER', 'ADMIN')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = (await request.json()) as { status: VehicleStatus; note?: string }
    const result = await updateVehicleStatusMutation(id, body.status, body.note, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
