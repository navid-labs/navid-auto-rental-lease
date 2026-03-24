import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { loadInventoryDataMutation } from '@/features/inventory/queries/inventory'

export async function POST() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const result = await loadInventoryDataMutation()
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
