import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import type { CreateDealerBidInput } from '@/features/quotes/schemas/quote-request'

export type CreateBidResult =
  | { success: true; data: { id: string; status: string } }
  | { success: false; error: string }

/**
 * Create a dealer bid for a quote request.
 * Validates quote exists, is not expired, is in OPEN/BIDDING status,
 * and the dealer has not already placed an active bid.
 */
export async function createDealerBid(
  dealerId: string,
  input: CreateDealerBidInput,
): Promise<CreateBidResult> {
  const { quoteRequestId } = input

  try {
    // 1. Find quote, check exists
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
    })

    if (!quote) {
      return { success: false, error: '견적 요청을 찾을 수 없습니다' }
    }

    // 2. Check not expired
    if (quote.expiresAt < new Date()) {
      return { success: false, error: '만료된 견적 요청입니다' }
    }

    // 3. Check status is OPEN or BIDDING
    if (quote.status !== 'OPEN' && quote.status !== 'BIDDING') {
      return { success: false, error: '입찰 가능한 상태가 아닙니다' }
    }

    // 4. Check no existing active bid from this dealer
    const existingBid = await prisma.dealerBid.findFirst({
      where: {
        dealerId,
        quoteRequestId,
        status: { in: ['PENDING', 'SUBMITTED'] },
      },
    })

    if (existingBid) {
      return { success: false, error: '이미 해당 견적에 입찰하셨습니다' }
    }

    // 5. Create bid with status SUBMITTED
    const bid = await prisma.dealerBid.create({
      data: {
        quoteRequestId,
        dealerId,
        vehicleId: input.vehicleId,
        monthlyPayment: input.monthlyPayment,
        deposit: input.deposit,
        totalCost: input.totalCost,
        residualValue: input.residualValue,
        interestRate: input.interestRate,
        contractTerms: input.contractTerms !== undefined
          ? (input.contractTerms as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        promotionNote: input.promotionNote,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    // 6. If quote was OPEN, update to BIDDING (first bid)
    if (quote.status === 'OPEN') {
      await prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { status: 'BIDDING' },
      })
    }

    return { success: true, data: { id: bid.id, status: bid.status } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: '입찰 생성 중 오류가 발생했습니다' }
  }
}
