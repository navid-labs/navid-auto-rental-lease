import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getAvailableQuoteRequests } from '@/features/quotes/queries/dealer-quotes'

export async function GET() {
  const auth = await requireRole('DEALER')
  if (auth.error) return auth.error

  try {
    const quotes = await getAvailableQuoteRequests()
    return apiSuccess(quotes)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
