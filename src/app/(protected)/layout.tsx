import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] pt-6">{children}</main>
      <Footer />
    </>
  )
}
