import type { Metadata } from 'next'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import {
  SellHeroSection,
  BonusSection,
  ProcessSection,
  FaqSection,
} from '@/features/marketing/components/sell-my-car-sections'

export const metadata: Metadata = {
  title: '내차팔기 | Navid Auto',
  description:
    '차량 번호만 입력하면 실시간 AI 시세 분석으로 최적의 매각 견적을 받아보실 수 있습니다. 무료 시세 조회, 48시간 내 방문 매입, 즉시 입금.',
}

export default function SellPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <BreadcrumbNav items={[{ label: '내차팔기' }]} />
      </div>
      <SellHeroSection />
      <BonusSection />
      <ProcessSection />
      <FaqSection />
    </>
  )
}
