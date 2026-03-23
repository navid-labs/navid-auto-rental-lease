'use client'

import { useState, useEffect } from 'react'
import { SECTION_IDS } from './types'
import type { SectionId } from './types'
import type { VehicleDetailData, VehicleWithDetails } from '../../types'
import { inspectionDataSchema } from '../../schemas/inspection-data'
import { historyDataSchema } from '../../schemas/history-data'

import { SectionGallery } from './section-gallery'
import { SectionPrice } from './section-price'
import { SectionBasicInfo } from './section-basic-info'
import { SectionOptions } from './section-options'
import { SectionBodyDiagram } from './section-body-diagram'
import { SectionDiagnosis } from './section-diagnosis'
import { SectionHistory } from './section-history'
import { SectionWarranty } from './section-warranty'
import { SectionHomeService } from './section-home-service'
import { SectionReviewsFaq } from './section-reviews-faq'
import { SectionEvaluator } from './section-evaluator'
import { StickyTabNav } from './sticky-tab-nav'
import { StickySidebar } from './sticky-sidebar'
import { VehicleCard } from '../vehicle-card'

// ─── Scroll-spy hook ─────────────────────────────────────────────────────────

function useActiveSection(sectionIds: readonly string[]): string {
  const [activeId, setActiveId] = useState(sectionIds[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}

// ─── Demo options (no dedicated field in schema) ─────────────────────────────

const DEMO_OPTIONS = [
  '네비게이션',
  '후방카메라',
  '블랙박스',
  '열선시트',
  '통풍시트',
  '전동시트',
  '크루즈컨트롤',
  '스마트키',
  '선루프',
  'HUD',
  'ABS',
  '에어백',
  '하이패스',
  '블루투스',
  'USB',
  '무선충전',
  'LED헤드램프',
]

// ─── Component ───────────────────────────────────────────────────────────────

type VehicleDetailPageProps = {
  vehicle: VehicleDetailData
  residualRate: number | null
  vehicleName: string
  similarVehicles: VehicleWithDetails[]
}

export function VehicleDetailPage({
  vehicle,
  vehicleName,
  similarVehicles,
}: VehicleDetailPageProps) {
  const activeSectionId = useActiveSection(SECTION_IDS)

  // Defensive Zod parse on client (data already parsed on server)
  const inspection = vehicle.inspectionData
    ? inspectionDataSchema.safeParse(vehicle.inspectionData)
    : null
  const history = vehicle.historyData
    ? historyDataSchema.safeParse(vehicle.historyData)
    : null

  // Extract options from description or use demo list
  const options =
    vehicle.description
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? DEMO_OPTIONS

  return (
    <div className="mx-auto max-w-7xl">
      {/* Gallery: full width */}
      <SectionGallery images={vehicle.images} />

      {/* Sticky tab nav: full width */}
      <StickyTabNav activeSection={activeSectionId as SectionId} />

      {/* Content + Sidebar: 7:3 split */}
      <div className="flex gap-8 px-4 lg:gap-10 lg:px-0">
        {/* Main content: 70% */}
        <div className="min-w-0 flex-1 space-y-8 py-6">
          <section id="price">
            <SectionPrice
              price={vehicle.price}
              monthlyRental={vehicle.monthlyRental}
              monthlyLease={vehicle.monthlyLease}
              vehicleId={vehicle.id}
            />
          </section>

          <section id="basic-info">
            <SectionBasicInfo vehicle={vehicle} />
          </section>

          <section id="options">
            <SectionOptions options={options} />
          </section>

          <section id="body-diagram">
            <SectionBodyDiagram
              panels={
                inspection?.success ? inspection.data.panels : null
              }
              repaintCount={
                inspection?.success ? inspection.data.repaintCount : 0
              }
              replacedCount={
                inspection?.success ? inspection.data.replacedCount : 0
              }
            />
          </section>

          <section id="diagnosis">
            <SectionDiagnosis
              inspection={inspection?.success ? inspection.data : null}
            />
          </section>

          <section id="history">
            <SectionHistory
              history={history?.success ? history.data : null}
            />
          </section>

          <section id="warranty">
            <SectionWarranty
              warrantyEndDate={vehicle.warrantyEndDate}
              warrantyMileage={vehicle.warrantyMileage}
              year={vehicle.year}
            />
          </section>

          <section id="home-service">
            <SectionHomeService
              vehicleId={vehicle.id}
              vehicleName={vehicleName}
            />
          </section>

          <section id="reviews-faq">
            <SectionReviewsFaq reviews={[]} />
          </section>

          <section id="evaluator">
            <SectionEvaluator
              evaluator={
                inspection?.success ? inspection.data.evaluator : null
              }
            />
          </section>
        </div>

        {/* Sidebar: 30% desktop only */}
        <div className="hidden w-[340px] shrink-0 lg:block">
          <StickySidebar vehicle={vehicle} vehicleName={vehicleName} />
        </div>
      </div>

      {/* Similar vehicles: full width */}
      {similarVehicles.length >= 2 && (
        <section className="mt-12 px-4 pb-8 lg:px-0">
          <h2 className="mb-4 text-lg font-semibold">
            비슷한 차량 추천
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {similarVehicles.slice(0, 6).map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile bottom spacer for fixed CTA */}
      <div className="h-16 lg:hidden" />

      {/* Mobile bottom CTA rendered inside StickySidebar */}
    </div>
  )
}
