import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { lookupPlateMutation } from '@/features/vehicles/queries/lookup'

export async function GET(request: Request) {
  const auth = await requireRole('DEALER', 'ADMIN')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const plateNumber = searchParams.get('plateNumber')
    if (!plateNumber) return apiError('번호판을 입력해주세요', 400)

    const result = await lookupPlateMutation(plateNumber, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result.data)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
