import { apiSuccess, apiError } from '@/lib/api/response'
import { getBrands } from '@/features/vehicles/queries/cascade'

export async function GET() {
  try {
    const brands = await getBrands()
    return apiSuccess(brands)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
