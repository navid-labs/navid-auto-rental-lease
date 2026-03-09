import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NuqsAdapter>
  )
}
