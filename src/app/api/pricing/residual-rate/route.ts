import { type NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getResidualRateQuery } from '@/features/pricing/queries/residual-rates'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const brandId = url.searchParams.get('brandId')
    const carModelId = url.searchParams.get('carModelId')
    const yearParam = url.searchParams.get('year')

    if (!brandId || !carModelId || !yearParam) {
      return apiError('brandId, carModelId, year 파라미터가 필요합니다', 400)
    }

    const year = parseInt(yearParam, 10)
    if (isNaN(year)) {
      return apiError('year는 숫자여야 합니다', 400)
    }

    const rate = await getResidualRateQuery(brandId, carModelId, year)
    return apiSuccess({ rate })
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
