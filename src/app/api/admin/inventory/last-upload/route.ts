import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getLastUploadTimeQuery } from '@/features/inventory/queries/inventory'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const lastUploadTime = await getLastUploadTimeQuery()
    return apiSuccess({ lastUploadTime })
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
