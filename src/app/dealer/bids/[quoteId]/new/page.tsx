import { BidForm } from '@/features/quotes/components/dealer/bid-form'

type Props = { params: Promise<{ quoteId: string }> }

export default async function NewBidPage({ params }: Props) {
  const { quoteId } = await params

  return (
    <div className="mx-auto max-w-xl py-8">
      <BidForm quoteRequestId={quoteId} />
    </div>
  )
}
