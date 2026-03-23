import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FloatingCTA } from '@/components/layout/floating-cta'
import { RecentlyViewedDrawer } from '@/components/layout/recently-viewed-drawer'
import { ComparisonBar } from '@/components/layout/comparison-bar'
import { StoreHydration } from '@/components/layout/store-hydration'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <StoreHydration />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pt-6">{children}</main>
        <Footer />
      </div>
      <FloatingCTA />
      <RecentlyViewedDrawer />
      <ComparisonBar />
    </NuqsAdapter>
  )
}
