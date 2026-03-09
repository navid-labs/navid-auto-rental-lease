import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Navid Auto - 중고차 렌탈/리스',
  description: '프리미엄 중고차 렌탈 및 리스 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
