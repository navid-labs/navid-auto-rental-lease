import { type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getResidualRatesQuery } from '@/features/pricing/queries/residual-rates'
import { upsertResidualRateMutation } from '@/features/pricing/mutations/residual-rates'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const brandId = url.searchParams.get('brandId') ?? undefined
    const data = await getResidualRatesQuery(brandId)
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
    const result = await upsertResidualRateMutation(body, auth.user)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
