import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DynamicOverlays } from '@/components/layout/dynamic-overlays'
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
      <DynamicOverlays />
    </NuqsAdapter>
  )
}
