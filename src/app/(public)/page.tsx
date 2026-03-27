import { Suspense } from 'react'
import { HeroBanner } from '@/features/marketing/components/hero-banner'
import { HeroSearchBox } from '@/features/marketing/components/hero-search-box'
import { QuickLinks } from '@/features/marketing/components/quick-links'
import { RecommendedVehicles } from '@/features/marketing/components/recommended-vehicles'
import { PromoBanners } from '@/features/marketing/components/promo-banners'
import { PartnerLogos } from '@/features/marketing/components/partner-logos'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      {/* WCAG 1.3.1: Semantic h1 for heading hierarchy */}
      <h1 className="sr-only">Navid Auto - 중고차 렌탈 리스</h1>

      {/* 1. Hero Banner Carousel */}
      <div className="-mt-6">
        <HeroBanner />
      </div>

      {/* 2. Search Box (extracted from old hero) */}
      <div className="mt-10">
        <HeroSearchBox />
      </div>

      {/* 3. Quick Links Icon Bar */}
      <QuickLinks />

      {/* 4. Recommended Vehicles (Server Component with Suspense) */}
      <Suspense fallback={<SectionSkeleton title="추천 차량" />}>
        <RecommendedVehicles />
      </Suspense>

      {/* 5. Promo Banners */}
      <PromoBanners />

      {/* 6. Partner Logos */}
      <PartnerLogos />
    </>
  )
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-[#F9FAFB] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-6">
          <div className="h-7 w-28 animate-pulse rounded bg-muted" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
