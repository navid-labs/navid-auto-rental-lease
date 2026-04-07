import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getMyDealerBids } from '@/features/quotes/queries/dealer-quotes'

export async function GET() {
  const auth = await requireRole('DEALER')
  if (auth.error) return auth.error

  try {
    const bids = await getMyDealerBids(auth.user.id)
    return apiSuccess(bids)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
