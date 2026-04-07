import { DealerQuoteList } from '@/features/quotes/components/dealer/quote-list'

export default function DealerBidsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">견적 요청 / 입찰</h1>
      <DealerQuoteList />
    </div>
  )
}
