import { notFound } from 'next/navigation'
import { getQuoteRequestById } from '@/features/quotes/queries/quote'
import { ComparisonView } from '@/features/quotes/components/comparison-view'
import type { BidCard } from '@/features/quotes/components/comparison-view'

type Props = { params: Promise<{ id: string }> }

export default async function QuoteComparePage({ params }: Props) {
  const { id } = await params

  const quote = await getQuoteRequestById(id)
  if (!quote) notFound()

  const selectedBid = quote.bids.find((b) => b.status === 'SELECTED')
  const isSelectable = quote.status === 'COMPARING'

  const bids: BidCard[] = quote.bids.map((bid) => {
    const trim = bid.vehicle?.trim
    const generation = trim?.generation
    const carModel = generation?.carModel
    const brand = carModel?.brand

    const brandName = brand?.nameKo ?? brand?.name ?? ''
    const modelName = carModel?.nameKo ?? carModel?.name ?? ''
    const trimName = trim?.name ?? ''
    const vehicleName = [brandName, modelName, trimName].filter(Boolean).join(' ') || '차량 정보 없음'

    return {
      id: bid.id,
      dealerName: bid.dealer?.name ?? '딜러',
      vehicleName,
      monthlyPayment: bid.monthlyPayment,
      deposit: bid.deposit,
      totalCost: bid.totalCost,
      residualValue: bid.residualValue ?? null,
      interestRate: bid.interestRate ? Number(bid.interestRate) : null,
      promotionNote: bid.promotionNote ?? null,
    }
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">견적 비교</h1>
        <p className="mt-1 text-sm text-gray-500">
          {bids.length}개의 견적이 도착했습니다.{' '}
          {isSelectable ? '마음에 드는 견적을 선택하세요.' : ''}
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          아직 도착한 견적이 없습니다.
        </div>
      ) : (
        <ComparisonView
          quoteId={id}
          bids={bids}
          isSelectable={isSelectable}
          selectedBidId={selectedBid?.id ?? null}
        />
      )}
    </div>
  )
}
