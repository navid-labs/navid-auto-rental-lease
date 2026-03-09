import type { Metadata } from 'next'
import { PricingCalculator } from '@/features/pricing/components/pricing-calculator'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '렌탈/리스 계산기 | Navid Auto',
  description: '중고차 렌탈과 리스 월 납입금을 비교해보세요. 기간과 보증금을 조절하여 최적의 조건을 찾아보세요.',
}

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f1e3c] to-[#1a3a6e] px-8 py-10 text-white">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
              Navid Auto
            </p>
            <h1 className="text-3xl font-bold leading-tight">렌탈/리스 계산기</h1>
            <p className="text-sm leading-relaxed text-slate-300">
              차량 가격과 조건을 입력하면 렌탈과 리스 월 납입금을 즉시 비교할 수 있습니다.
            </p>
          </div>
          {/* Decorative icon */}
          <div className="hidden shrink-0 sm:flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-8 text-blue-300"
              aria-hidden="true"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 6h8M8 10h8M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M15 16l1.5 1.5L19 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <PricingCalculator />
    </div>
  )
}
