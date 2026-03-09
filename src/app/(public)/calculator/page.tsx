import type { Metadata } from 'next'
import { PricingCalculator } from '@/features/pricing/components/pricing-calculator'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '렌탈/리스 계산기 | Navid Auto',
  description: '중고차 렌탈과 리스 월 납입금을 비교해보세요. 기간과 보증금을 조절하여 최적의 조건을 찾아보세요.',
}

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">렌탈/리스 계산기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          차량 가격을 입력하고, 기간과 보증금을 조절하여 렌탈과 리스 비용을 비교해보세요.
        </p>
      </div>
      <PricingCalculator />
    </div>
  )
}
