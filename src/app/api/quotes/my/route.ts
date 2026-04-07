import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getMyQuoteRequests } from '@/features/quotes/queries/quote'

export async function GET() {
  const auth = await requireRole('CUSTOMER')
  if (auth.error) return auth.error

  try {
    const quotes = await getMyQuoteRequests(auth.user.id)
    return apiSuccess(quotes)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
