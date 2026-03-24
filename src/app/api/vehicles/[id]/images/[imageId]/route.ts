import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { deleteImageMutation } from '@/features/vehicles/mutations/images'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const auth = await requireRole('DEALER', 'ADMIN')
  if (auth.error) return auth.error

  try {
    const { imageId } = await params
    const result = await deleteImageMutation(imageId, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
