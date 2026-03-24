import { apiSuccess, apiError } from '@/lib/api/response'
import { createVehicleInquiryMutation } from '@/features/vehicles/queries/inquiry'
import type { InquiryFormData } from '@/features/vehicles/queries/inquiry'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { name, phone, message } = (await request.json()) as Pick<
      InquiryFormData,
      'name' | 'phone' | 'message'
    >
    const result = await createVehicleInquiryMutation({ vehicleId: id, name, phone, message })
    if ('error' in result) return apiError(result.error as string, 400)
    return apiSuccess(result, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
