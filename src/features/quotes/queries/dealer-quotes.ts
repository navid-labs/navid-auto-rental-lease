import { prisma } from '@/lib/db/prisma'

const quoteRequestCustomerInclude = {
  customer: {
    select: { id: true, name: true },
  },
  preferredBrand: {
    select: { id: true, name: true, nameKo: true },
  },
  preferredModel: {
    select: { id: true, name: true, nameKo: true },
  },
  _count: {
    select: {
      bids: {
        where: { status: 'SUBMITTED' as const },
      },
    },
  },
} as const

const dealerBidInclude = {
  quoteRequest: {
    include: {
      customer: {
        select: { id: true, name: true },
      },
      preferredBrand: {
        select: { id: true, name: true, nameKo: true },
      },
      preferredModel: {
        select: { id: true, name: true, nameKo: true },
      },
    },
  },
  vehicle: {
    include: {
      trim: {
        include: {
          generation: {
            include: {
              carModel: {
                include: {
                  brand: {
                    select: { id: true, name: true, nameKo: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

/**
 * Get available quote requests that dealers can bid on.
 * Returns OPEN and BIDDING quotes that have not yet expired.
 */
export async function getAvailableQuoteRequests() {
  return prisma.quoteRequest.findMany({
    where: {
      status: { in: ['OPEN', 'BIDDING'] },
      expiresAt: { gt: new Date() },
    },
    include: quoteRequestCustomerInclude,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get all bids submitted by a specific dealer.
 */
export async function getMyDealerBids(dealerId: string) {
  return prisma.dealerBid.findMany({
    where: { dealerId },
    include: dealerBidInclude,
    orderBy: { createdAt: 'desc' },
  })
}
