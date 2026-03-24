import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { verifySettingsPasswordMutation } from '@/features/settings/mutations/auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { password } = await request.json()
    const result = await verifySettingsPasswordMutation(password)

    if ('error' in result) {
      return apiError(result.error, 401)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
