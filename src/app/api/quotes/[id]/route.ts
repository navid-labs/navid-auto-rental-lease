import { apiSuccess, apiError } from '@/lib/api/response'
import { getQuoteRequestById } from '@/features/quotes/queries/quote'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const quote = await getQuoteRequestById(id)
    if (!quote) return apiError('견적 요청을 찾을 수 없습니다', 404)
    return apiSuccess(quote)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
