import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getInventoryCountQuery } from '@/features/inventory/queries/inventory'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const count = await getInventoryCountQuery()
    return apiSuccess({ count })
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
