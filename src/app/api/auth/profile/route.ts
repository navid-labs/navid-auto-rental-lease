import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { updateProfileMutation } from '@/features/auth/mutations/profile'

export async function PATCH(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const result = await updateProfileMutation(formData, auth.user)

    if ('error' in result) {
      return apiError(result.error as string, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
