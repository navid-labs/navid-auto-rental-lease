import type { Metadata } from 'next'
import { QuoteWizard } from '@/features/quotes/components/quote-wizard'

export const metadata: Metadata = {
  title: '견적 요청 | Navid Auto',
  description: '렌탈/리스 맞춤 견적을 딜러에게 요청하세요.',
}

export default function QuoteRequestPage() {
  return <QuoteWizard />
}
