import { apiSuccess, apiError } from '@/lib/api/response'
import { createGeneralInquiryMutation } from '@/features/inquiry/mutations/create'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createGeneralInquiryMutation(body)

    if ('error' in result) {
      return apiError(result.error, 422)
    }

    return apiSuccess(result, 201)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('입력값을 확인해주세요', 422)
    }
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
