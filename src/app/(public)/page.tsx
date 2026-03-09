import { Suspense } from 'react'
import { HeroSection } from '@/features/marketing/components/hero-section'
import { QuickMenu } from '@/features/marketing/components/quick-menu'
import { FeaturedVehicles } from '@/features/marketing/components/featured-vehicles'
import { EventBanners } from '@/features/marketing/components/event-banners'
import { RentSubscription } from '@/features/marketing/components/rent-subscription'
import { FinancePartners } from '@/features/marketing/components/finance-partners'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickMenu />
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedVehicles />
      </Suspense>
      <EventBanners />
      <Suspense fallback={<SectionSkeleton />}>
        <RentSubscription />
      </Suspense>
      <FinancePartners />
    </>
  )
}

function SectionSkeleton() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
