import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getMyContractsQuery } from '@/features/contracts/queries/my-contracts'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const contracts = await getMyContractsQuery(auth.user.id)
    return apiSuccess(contracts)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
