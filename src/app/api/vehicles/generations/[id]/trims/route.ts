import { apiSuccess, apiError } from '@/lib/api/response'
import { getTrimsByGeneration } from '@/features/vehicles/queries/cascade'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const trims = await getTrimsByGeneration(id)
    return apiSuccess(trims)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
