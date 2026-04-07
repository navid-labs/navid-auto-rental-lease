import { redirect, notFound } from 'next/navigation'
import { getQuoteRequestById } from '@/features/quotes/queries/quote'
import { QuoteStatusBanner } from '@/features/quotes/components/quote-status-banner'

type Props = { params: Promise<{ id: string }> }

export default async function QuotePage({ params }: Props) {
  const { id } = await params

  const quote = await getQuoteRequestById(id)
  if (!quote) notFound()

  if (quote.status === 'COMPARING' || quote.status === 'SELECTED') {
    redirect(`/quote/${id}/compare`)
  }

  const bidCount = quote.bids?.length ?? 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">견적 현황</h1>
        <p className="mt-1 text-sm text-gray-500">
          딜러들이 맞춤 견적을 준비 중입니다.
        </p>
      </div>

      <QuoteStatusBanner
        quoteId={id}
        initialBidCount={bidCount}
        expiresAt={quote.expiresAt.toISOString()}
      />
    </div>
  )
}
