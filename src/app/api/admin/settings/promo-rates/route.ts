import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getPromoRatesQuery } from '@/features/settings/queries/settings'
import { upsertPromoRateMutation } from '@/features/settings/mutations/settings'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const data = await getPromoRatesQuery()
    return apiSuccess(data)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const result = await upsertPromoRateMutation(body, auth.user)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
