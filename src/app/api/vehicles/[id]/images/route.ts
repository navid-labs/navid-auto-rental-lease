import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { uploadImageMutation } from '@/features/vehicles/mutations/images'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const images = await prisma.vehicleImage.findMany({
    where: { vehicleId: id },
    orderBy: { order: 'asc' },
    select: { id: true, url: true, order: true },
  })

  return NextResponse.json({ images })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('DEALER', 'ADMIN')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const formData = await request.formData()
    const result = await uploadImageMutation(id, formData, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
