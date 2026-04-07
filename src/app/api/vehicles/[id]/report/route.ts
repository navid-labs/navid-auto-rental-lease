import { apiSuccess, apiError } from '@/lib/api/response'
import { getVehicleReport } from '@/features/vehicles/queries/report'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const report = await getVehicleReport(id)

  if (!report) {
    return apiError('차량을 찾을 수 없습니다.', 404)
  }

  return apiSuccess(report)
}
