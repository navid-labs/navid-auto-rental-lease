import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { sendVerificationCodeMutation } from '@/features/contracts/mutations/ekyc'

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body: { phone: string } = await request.json()
    if (!body.phone) return apiError('phone은 필수입니다', 400)
    const result = await sendVerificationCodeMutation(body.phone)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
