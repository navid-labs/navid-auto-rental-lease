import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'
import { canTransitionBid } from '@/features/quotes/lib/quote-state-machine'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('DEALER')
  if (auth.error) return auth.error

  try {
    const { id } = await params

    const bid = await prisma.dealerBid.findUnique({
      where: { id },
    })

    if (!bid) {
      return apiError('입찰을 찾을 수 없습니다', 404)
    }

    if (bid.dealerId !== auth.user.id) {
      return apiError('본인의 입찰만 취소할 수 있습니다', 403)
    }

    if (!canTransitionBid(bid.status, 'WITHDRAWN')) {
      return apiError('현재 상태에서는 입찰을 취소할 수 없습니다', 400)
    }

    const updated = await prisma.dealerBid.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    })

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
