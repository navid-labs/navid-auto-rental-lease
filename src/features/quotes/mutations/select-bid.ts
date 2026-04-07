import { prisma } from '@/lib/db/prisma'
import {
  canTransitionQuote,
  canTransitionBid,
} from '../lib/quote-state-machine'

type SelectBidResult =
  | { success: true; data: { quoteId: string; bidId: string } }
  | { success: false; error: string }

export async function selectBid(
  quoteId: string,
  bidId: string,
  customerId: string,
): Promise<SelectBidResult> {
  // 1. Validate quote ownership and state
  const quote = await prisma.quoteRequest.findUnique({ where: { id: quoteId } })
  if (!quote) {
    return { success: false, error: '견적 요청을 찾을 수 없습니다' }
  }
  if (quote.customerId !== customerId) {
    return { success: false, error: '권한이 없습니다' }
  }
  if (!canTransitionQuote(quote.status as Parameters<typeof canTransitionQuote>[0], 'SELECTED')) {
    return { success: false, error: `현재 상태(${quote.status})에서 선택할 수 없습니다` }
  }

  // 2. Validate bid state
  const bid = await prisma.dealerBid.findUnique({ where: { id: bidId } })
  if (!bid || bid.quoteRequestId !== quoteId) {
    return { success: false, error: '입찰을 찾을 수 없습니다' }
  }
  if (!canTransitionBid(bid.status as Parameters<typeof canTransitionBid>[0], 'SELECTED')) {
    return { success: false, error: `입찰 상태(${bid.status})에서 선택할 수 없습니다` }
  }

  // 3. Execute transaction: select bid, reject others, update quote
  await prisma.$transaction([
    prisma.quoteRequest.update({
      where: { id: quoteId },
      data: { status: 'SELECTED', selectedBidId: bidId },
    }),
    prisma.dealerBid.update({
      where: { id: bidId },
      data: { status: 'SELECTED' },
    }),
    prisma.dealerBid.updateMany({
      where: {
        quoteRequestId: quoteId,
        status: 'SUBMITTED',
        id: { not: bidId },
      },
      data: { status: 'REJECTED' },
    }),
  ])

  return { success: true, data: { quoteId, bidId } }
}
