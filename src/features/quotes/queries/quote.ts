import { prisma } from '@/lib/db/prisma'

export async function getQuoteRequestById(id: string) {
  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      preferredBrand: true,
      preferredModel: true,
      bids: {
        where: { status: { in: ['SUBMITTED', 'SELECTED'] } },
        include: {
          dealer: true,
          vehicle: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
              trim: {
                include: {
                  generation: {
                    include: {
                      carModel: {
                        include: { brand: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getMyQuoteRequests(customerId: string) {
  return prisma.quoteRequest.findMany({
    where: { customerId },
    include: {
      preferredBrand: true,
      preferredModel: true,
      _count: {
        select: {
          bids: { where: { status: 'SUBMITTED' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
