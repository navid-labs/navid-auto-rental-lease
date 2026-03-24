import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getDashboardStatsQuery } from '@/features/admin/queries/dashboard'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const data = await getDashboardStatsQuery()
    return apiSuccess(data)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
