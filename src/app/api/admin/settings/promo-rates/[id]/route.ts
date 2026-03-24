import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { deletePromoRateMutation } from '@/features/settings/mutations/settings'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const result = await deletePromoRateMutation(id, auth.user)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
