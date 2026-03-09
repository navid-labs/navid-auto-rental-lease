import { Suspense } from 'react'
import { HeroSection } from '@/features/marketing/components/hero-section'
import { FeaturedVehicles } from '@/features/marketing/components/featured-vehicles'
import { BrandShortcuts } from '@/features/marketing/components/brand-shortcuts'
import { HowItWorks } from '@/features/marketing/components/how-it-works'
import { TrustMetrics } from '@/features/marketing/components/trust-metrics'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedVehicles />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BrandShortcuts />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<SectionSkeleton />}>
        <TrustMetrics />
      </Suspense>
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
