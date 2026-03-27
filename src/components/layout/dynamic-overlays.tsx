'use client'

import dynamic from 'next/dynamic'

const FloatingCTA = dynamic(
  () => import('@/components/layout/floating-cta').then(mod => mod.FloatingCTA),
  { ssr: false }
)
const RecentlyViewedDrawer = dynamic(
  () => import('@/components/layout/recently-viewed-drawer').then(mod => mod.RecentlyViewedDrawer),
  { ssr: false }
)
const ComparisonBar = dynamic(
  () => import('@/components/layout/comparison-bar').then(mod => mod.ComparisonBar),
  { ssr: false }
)

export function DynamicOverlays() {
  return (
    <>
      <FloatingCTA />
      <RecentlyViewedDrawer />
      <ComparisonBar />
    </>
  )
}
