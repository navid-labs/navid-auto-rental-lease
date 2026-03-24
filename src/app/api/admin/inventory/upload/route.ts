import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { uploadInventoryCsvMutation } from '@/features/inventory/mutations/upload'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const result = await uploadInventoryCsvMutation(formData, auth.user)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
