import { prisma } from '@/lib/db/prisma'
import type { CreateQuoteRequestInput } from '../schemas/quote-request'

export async function createQuoteRequest(customerId: string, input: CreateQuoteRequestInput) {
  const { expiresInDays, ...data } = input
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)
  return prisma.quoteRequest.create({
    data: { customerId, ...data, status: 'OPEN', expiresAt },
  })
}
