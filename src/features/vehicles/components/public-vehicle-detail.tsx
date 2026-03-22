'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatDistance, formatYearModel } from '@/lib/utils/format'
import {
  ImageIcon,
  MessageCircle,
  FileText,
  ChevronDown,
  Heart,
  GitCompare,
  Calendar,
  Fuel,
  Palette,
  AlertCircle,
  Gauge,
  Settings,
  Sun,
  Navigation,
  Wind,
  Eye,
  ShieldAlert,
  Bluetooth,
  ShieldCheck,
  Shield,
  Zap,
  Plus,
  Truck,
  Building2,
  Banknote,
} from 'lucide-react'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import { InquiryForm } from './inquiry-form'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { pmt } from '@/lib/finance/pmt'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PublicVehicleDetailProps = {
  vehicle: VehicleWithDetails
  residualRate?: number | null
}

type TabId = 'info' | 'aqi' | 'options' | 'quote' | 'recommend' | 'review'

const TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: '차량 정보' },
  { id: 'aqi', label: 'AQI 검사' },
  { id: 'options', label: '옵션' },
  { id: 'quote', label: '견적' },
  { id: 'recommend', label: '추천차량' },
  { id: 'review', label: '리뷰' },
]

// ---------------------------------------------------------------------------
// PMT helper (inline so no extra import confusion)
// ---------------------------------------------------------------------------

function calcInstallmentMonthly(
  price: number,
  downPayment: number,
  months: number,
  annualRate: number
): number {
  const principal = price - downPayment
  if (principal <= 0 || months <= 0) return 0
  const r = annualRate / 12
  return Math.round(Math.abs(pmt(r, months, principal, 0)))
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PublicVehicleDetail({ vehicle, residualRate }: PublicVehicleDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [optionsExpanded, setOptionsExpanded] = useState(false)

  const images = vehicle.images.sort((a, b) => a.order - b.order)
  const selectedImage = images[selectedImageIndex]

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const generation = vehicle.trim.generation
  const trim = vehicle.trim

  const title = `${brand.name} ${model.name} ${generation.name} ${trim.name}`

  // Section refs for scroll-spy
  const infoRef = useRef<HTMLDivElement>(null)
  const aqiRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const recommendRef = useRef<HTMLDivElement>(null)
  const reviewRef = useRef<HTMLDivElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const sectionRefMap: Record<TabId, React.RefObject<HTMLDivElement | null>> = {
    info: infoRef,
    aqi: aqiRef,
    options: optionsRef,
    quote: quoteRef,
    recommend: recommendRef,
    review: reviewRef,
  }

  // Track recently viewed
  const addRecentlyViewed = useVehicleInteractionStore((s) => s.addRecentlyViewed)
  useEffect(() => {
    const primaryImage = images[0]
    addRecentlyViewed({
      id: vehicle.id,
      brandName: brand.nameKo || brand.name,
      modelName: model.nameKo || model.name,
      year: vehicle.year,
      mileage: vehicle.mileage,
      price: vehicle.price,
      monthlyRental: vehicle.monthlyRental,
      monthlyLease: vehicle.monthlyLease,
      thumbnailUrl: primaryImage?.url ?? null,
    })
  }, [vehicle.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection observer for active tab
  useEffect(() => {
    const tabIds = TABS.map((t) => t.id)
    const observers: IntersectionObserver[] = []

    tabIds.forEach((id) => {
      const el = sectionRefMap[id].current
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(id)
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToSection = useCallback((id: TabId) => {
    const el = sectionRefMap[id].current
    if (!el) return
    const tabBarHeight = tabBarRef.current?.offsetHeight ?? 0
    const headerOffset = 64 + tabBarHeight + 8
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveTab(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isAvailable =
    vehicle.status === 'AVAILABLE' && vehicle.approvalStatus === 'APPROVED'

  // Simulated discount (33% off from msrp placeholder)
  const msrpMultiplier = 1.49
  const msrpPrice = Math.round(vehicle.price * msrpMultiplier)
  const discountPct = Math.round((1 - vehicle.price / msrpPrice) * 100)

  // Monthly installment (48mo default)
  const defaultMonthlyInstallment = calcInstallmentMonthly(vehicle.price, 0, 72, 0.054)

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <BreadcrumbNav
        items={[
          { label: '내차사기', href: '/vehicles' },
          { label: `${brand.nameKo || brand.name} ${model.nameKo || model.name}` },
        ]}
      />

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-0">

          {/* Image Gallery */}
          <div className="space-y-3 mb-6">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#F9FAFB]">
              {selectedImage ? (
                <Image
                  src={selectedImage.url}
                  alt={`${title} photo ${selectedImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-[#B0B0B0]">
                    <ImageIcon className="mx-auto mb-2 size-12" />
                    <p className="text-sm">등록된 사진이 없습니다</p>
                  </div>
                </div>
              )}
              {images.length > 0 && (
                <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  {selectedImageIndex + 1}/{images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={[
                      'relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                      idx === selectedImageIndex
                        ? 'border-[#2563EB]'
                        : 'border-transparent hover:border-[#2563EB]/30',
                    ].join(' ')}
                  >
                    <Image src={img.url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile-only sidebar card */}
          <div className="lg:hidden mb-4">
            <SidebarCard
              vehicle={vehicle}
              brand={brand}
              model={model}
              generation={generation}
              trim={trim}
              msrpPrice={msrpPrice}
              discountPct={discountPct}
              defaultMonthlyInstallment={defaultMonthlyInstallment}
              isAvailable={isAvailable}
              inquiryOpen={inquiryOpen}
              setInquiryOpen={setInquiryOpen}
              title={title}
            />
          </div>

          {/* Sticky Tab Navigation */}
          <div
            ref={tabBarRef}
            className="sticky top-16 z-20 -mx-4 bg-white border-b border-[#EEEEEE] px-4 sm:-mx-6 sm:px-6 mb-0"
          >
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToSection(tab.id)}
                  className={[
                    'shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-[#7A7A7A] hover:text-[#0D0D0D]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: 차량 정보 */}
          <div ref={infoRef} className="pt-6">
            <VehicleInfoSection trim={trim} vehicle={vehicle} />
          </div>

          {/* Section: AQI 검사 */}
          <div ref={aqiRef} className="pt-6">
            <AqiSection year={vehicle.year} mileage={vehicle.mileage} />
          </div>

          {/* Section: 옵션 */}
          <div ref={optionsRef} className="pt-6">
            <OptionsSection
              expanded={optionsExpanded}
              onToggle={() => setOptionsExpanded((v) => !v)}
            />
          </div>

          {/* Section: 견적 (Finance Calculator) */}
          <div ref={quoteRef} className="pt-6">
            <FinanceCalculatorSection price={vehicle.price} residualRate={residualRate} />
          </div>

          {/* Section: 보증 정보 (warranty - shown within recommend section visually) */}
          <div ref={recommendRef} className="pt-6">
            <WarrantySection vehicle={vehicle} />
          </div>

          {/* Section: 리뷰 placeholder */}
          <div ref={reviewRef} className="pt-6 pb-10">
            <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EEEEEE]">
                <h2 className="text-2xl font-bold text-[#0D0D0D]">리뷰</h2>
              </div>
              <div className="px-6 py-12 text-center text-[#B0B0B0] text-sm">
                아직 등록된 리뷰가 없습니다.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: sticky sidebar */}
        <div className="hidden lg:block lg:sticky lg:top-24 space-y-4">
          <SidebarCard
            vehicle={vehicle}
            brand={brand}
            model={model}
            generation={generation}
            trim={trim}
            msrpPrice={msrpPrice}
            discountPct={discountPct}
            defaultMonthlyInstallment={defaultMonthlyInstallment}
            isAvailable={isAvailable}
            inquiryOpen={inquiryOpen}
            setInquiryOpen={setInquiryOpen}
            title={title}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar Card (Right Column)
// ---------------------------------------------------------------------------

type SidebarCardProps = {
  vehicle: VehicleWithDetails
  brand: VehicleWithDetails['trim']['generation']['carModel']['brand']
  model: VehicleWithDetails['trim']['generation']['carModel']
  generation: VehicleWithDetails['trim']['generation']
  trim: VehicleWithDetails['trim']
  msrpPrice: number
  discountPct: number
  defaultMonthlyInstallment: number
  isAvailable: boolean
  inquiryOpen: boolean
  setInquiryOpen: (v: boolean) => void
  title: string
}

function SidebarCard({
  vehicle,
  brand,
  model,
  generation,
  trim,
  msrpPrice,
  discountPct,
  defaultMonthlyInstallment,
  isAvailable,
  inquiryOpen,
  setInquiryOpen,
  title,
}: SidebarCardProps) {
  const [liked, setLiked] = useState(false)

  const priceInMan = Math.round(vehicle.price / 10_000)

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6 space-y-5">
      {/* Badge row */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-[#DC2626]">
          <Zap className="size-3" />
          타임딜
        </span>
        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#2563EB]">
          <ShieldCheck className="size-3" />
          신차급
        </span>
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-[#16A34A]">
          <Truck className="size-3" />
          무료배송
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold leading-tight text-[#0D0D0D]">
          {brand.nameKo || brand.name} {model.nameKo || model.name}
        </h1>
        <p className="mt-1 text-[15px] text-[#71717A]">
          {generation.name} {trim.name}
        </p>
      </div>

      {/* Price area */}
      <div className="space-y-1.5">
        <div className="text-[32px] font-bold leading-none text-[#0D0D0D]">
          {priceInMan.toLocaleString('ko-KR')}만원
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#71717A]">신차가</span>
          <span className="text-[#B0B0B0] line-through">
            {Math.round(msrpPrice / 10_000).toLocaleString('ko-KR')}만원
          </span>
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-[#DC2626]">
            -{discountPct}%
          </span>
        </div>
        {defaultMonthlyInstallment > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-[#2563EB]">
            <Calendar className="size-3.5 shrink-0" />
            <span>
              월 {Math.round(defaultMonthlyInstallment / 10_000).toLocaleString('ko-KR')}만원 / 72개월 할부 시
            </span>
          </div>
        )}
      </div>

      <div className="h-px bg-[#EEEEEE]" />

      {/* Spec mini-grid */}
      <div className="grid grid-cols-2 gap-2">
        <SpecMiniItem icon={Calendar} label="연식" value={formatYearModel(vehicle.year)} />
        <SpecMiniItem icon={Gauge} label="주행거리" value={formatDistance(vehicle.mileage, { compact: true })} />
        <SpecMiniItem icon={Fuel} label="연료" value={fuelTypeLabel(trim.fuelType)} />
        <SpecMiniItem icon={Palette} label="색상" value={vehicle.color} />
        <SpecMiniItem icon={AlertCircle} label="사고유무" value="무사고" />
        <SpecMiniItem icon={Settings} label="변속기" value={transmissionLabel(trim.transmission)} />
      </div>

      <div className="h-px bg-[#EEEEEE]" />

      {/* CTA row */}
      <div className="flex gap-2">
        {isAvailable ? (
          <Link href={`/vehicles/${vehicle.id}/contract`} className="flex-1">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <FileText className="size-4" />
              구매하기
            </button>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#EEEEEE] text-sm font-semibold text-[#B0B0B0] cursor-not-allowed"
          >
            현재 구매 불가
          </button>
        )}

        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
            liked
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-[#EEEEEE] text-[#7A7A7A] hover:border-red-200 hover:text-red-400',
          ].join(' ')}
        >
          <Heart className={['size-4', liked ? 'fill-current' : ''].join(' ')} />
        </button>

        <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
          <DialogTrigger
            render={
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#EEEEEE] text-[#7A7A7A] transition-colors hover:border-[#2563EB]/40 hover:text-[#2563EB]"
              />
            }
          >
            <MessageCircle className="size-4" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>상담 신청</DialogTitle>
            </DialogHeader>
            <InquiryForm
              vehicleId={vehicle.id}
              vehicleTitle={title}
              onSuccess={() => setInquiryOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#EEEEEE] text-[#7A7A7A] transition-colors hover:border-[#2563EB]/40 hover:text-[#2563EB]"
          title="비교하기"
        >
          <GitCompare className="size-4" />
        </button>
      </div>
    </div>
  )
}

function SpecMiniItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EEEEEE]">
        <Icon className="size-3.5 text-[#71717A]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#71717A]">{label}</p>
        <p className="truncate text-xs font-semibold text-[#0D0D0D]">{value}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vehicle Info Section
// ---------------------------------------------------------------------------

type VehicleInfoSectionProps = {
  trim: VehicleWithDetails['trim']
  vehicle: VehicleWithDetails
}

function VehicleInfoSection({ trim, vehicle }: VehicleInfoSectionProps) {
  const leftRows = [
    { icon: Calendar, label: '출고일자', value: `${vehicle.year}.01` },
    { icon: Gauge, label: '주행거리', value: formatDistance(vehicle.mileage) },
    {
      icon: Banknote,
      label: '신차대비 가격',
      value: '67%',
      badge: { text: '저렴', color: 'text-[#16A34A] bg-green-50' },
    },
    { icon: Wind, label: '차량 냄새', value: '쾌적' },
    { icon: AlertCircle, label: '특이사항', value: '없음' },
  ]

  const rightRows = [
    { icon: Settings, label: '변속기', value: transmissionLabel(trim.transmission) },
    { icon: Gauge, label: '배기량', value: trim.engineCC ? `${trim.engineCC.toLocaleString()}cc` : '-' },
    { icon: Zap, label: '최고출력', value: '-' },
    { icon: Navigation, label: '구동방식', value: '-' },
    { icon: Eye, label: '인승', value: '-' },
  ]

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EEEEEE]">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">차량 정보</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* Left column */}
        <div className="border-r border-[#EEEEEE]">
          {leftRows.map((row, idx) => (
            <div
              key={row.label}
              className={[
                'flex items-center gap-3 px-5 py-3.5',
                idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]',
              ].join(' ')}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F5]">
                <row.icon className="size-4 text-[#71717A]" />
              </div>
              <span className="flex-1 text-sm text-[#71717A]">{row.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#0D0D0D]">{row.value}</span>
                {row.badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.badge.color}`}>
                    {row.badge.text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {rightRows.map((row, idx) => (
            <div
              key={row.label}
              className={[
                'flex items-center gap-3 px-5 py-3.5',
                idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]',
              ].join(' ')}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F5]">
                <row.icon className="size-4 text-[#71717A]" />
              </div>
              <span className="flex-1 text-sm text-[#71717A]">{row.label}</span>
              <span className="text-sm font-semibold text-[#0D0D0D]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Options Section
// ---------------------------------------------------------------------------

const FEATURED_OPTIONS = [
  { icon: Sun, label: '파노라마\n선루프' },
  { icon: Navigation, label: '내비게이션\n시스템' },
  { icon: Wind, label: '통풍시트' },
  { icon: Eye, label: '360도\n어라운드뷰' },
  { icon: ShieldAlert, label: '차선이탈\n방지' },
  { icon: Bluetooth, label: '블루투스\n오디오' },
]

const ALL_OPTIONS = [
  { icon: ShieldCheck, label: '전방 충돌방지' },
  { icon: Navigation, label: '차선 이탈방지' },
  { icon: Eye, label: '후측방 충돌방지' },
  { icon: Wind, label: '풀 오토 에어컨' },
  { icon: Sun, label: '열선 시트' },
  { icon: Settings, label: '스마트 크루즈' },
  { icon: Gauge, label: '디지털 계기판' },
  { icon: Bluetooth, label: 'USB 충전포트' },
]

function OptionsSection({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EEEEEE]">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">주요 옵션</h2>
      </div>
      <div className="px-6 py-5 space-y-5">
        {/* Featured 6 icons */}
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {FEATURED_OPTIONS.map((opt) => (
            <div key={opt.label} className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                <opt.icon className="size-6 text-[#0D0D0D]" />
              </div>
              <span className="whitespace-pre-line text-[11px] leading-tight text-[#0D0D0D]">
                {opt.label}
              </span>
            </div>
          ))}
        </div>

        {/* Expanded: additional options */}
        {expanded && (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 border-t border-[#EEEEEE] pt-4">
            {ALL_OPTIONS.map((opt) => (
              <div key={opt.label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                  <opt.icon className="size-6 text-[#71717A]" />
                </div>
                <span className="whitespace-pre-line text-[11px] leading-tight text-[#71717A]">
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EEEEEE] py-3 text-sm font-medium text-[#71717A] transition-colors hover:border-[#2563EB]/40 hover:text-[#2563EB]"
        >
          {expanded ? '접기' : '전체 옵션 보기'}
          <ChevronDown className={['size-4 transition-transform', expanded ? 'rotate-180' : ''].join(' ')} />
        </button>

        <p className="text-xs text-[#B0B0B0]">* 옵션 정보는 트림 기준이며, 실제 차량과 다를 수 있습니다.</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AQI Inspection Section
// ---------------------------------------------------------------------------

function AqiSection({ year, mileage }: { year: number; mileage: number }) {
  const age = new Date().getFullYear() - year
  const grade = age <= 2 && mileage < 30_000 ? 'A+' : age <= 4 ? 'A' : 'B+'
  const pangeumCount = Math.max(0, age - 3)
  const gyohwanCount = 0
  const batteryPct = Math.max(72, Math.min(97, 97 - age * 3 - Math.floor(mileage / 30_000) * 2))
  const tireDepths = [
    { label: '좌전', mm: (8.0 - age * 0.2 - mileage / 150_000).toFixed(1) },
    { label: '우전', mm: (7.8 - age * 0.2 - mileage / 150_000).toFixed(1) },
    { label: '좌후', mm: (7.5 - age * 0.2 - mileage / 180_000).toFixed(1) },
    { label: '우후', mm: (7.6 - age * 0.2 - mileage / 180_000).toFixed(1) },
  ].map((t) => ({ ...t, mm: Math.max(2.0, parseFloat(t.mm)).toFixed(1) }))

  const batteryLabel = batteryPct >= 80 ? '잔량 양호' : batteryPct >= 60 ? '보통' : '교체 권장'

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#EEEEEE] flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">AQI 정밀검사</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#16A34A]">
          <ShieldCheck className="size-3.5" />
          TÜV SÜD 인증
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        <p className="text-sm text-[#71717A] leading-relaxed">
          국제 인증기관 TÜV SÜD의 기준에 따라 차량 외관, 기관, 전자장치를 포함한 300개 항목을 정밀 검사합니다.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={grade} label="AQI 등급" valueColor="text-[#2563EB]" />
          <StatCard value={`${pangeumCount}건`} label="판금" valueColor={pangeumCount === 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} />
          <StatCard value={`${gyohwanCount}건`} label="교환" valueColor={gyohwanCount === 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} />
          <StatCard value="쾌적" label="냄새 등급" valueColor="text-[#16A34A]" />
        </div>

        {/* Detail area */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Left: Car body diagram */}
          <div className="rounded-xl border border-[#EEEEEE] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#0D0D0D]">차체 상태도</h3>
            <div className="flex items-center justify-center h-[200px] w-full rounded-lg bg-[#F9FAFB] border border-dashed border-[#DDDDDD]">
              <div className="text-center">
                <Shield className="mx-auto size-10 text-[#D0D0D0] mb-2" />
                <p className="text-xs text-[#B0B0B0]">차체 상태 도식</p>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-[#71717A]">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-[#22C55E] inline-block" /> 정상
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-orange-400 inline-block" /> 판금
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-red-500 inline-block" /> 교환
              </span>
            </div>
          </div>

          {/* Right: Tire + Battery */}
          <div className="space-y-3">
            {/* Tire card */}
            <div className="rounded-xl border border-[#EEEEEE] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-[#71717A]" />
                <h3 className="text-sm font-semibold text-[#0D0D0D]">타이어 상태</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tireDepths.map((t) => (
                  <div key={t.label} className="rounded-lg bg-[#F9FAFB] px-3 py-2.5 text-center">
                    <p className="text-[10px] text-[#71717A]">{t.label}</p>
                    <p className="text-base font-bold text-[#0D0D0D]">{t.mm}mm</p>
                    <p className="text-[10px] text-[#B0B0B0]">{year}.02</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Battery card */}
            <div className="rounded-xl border border-[#EEEEEE] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-[#71717A]" />
                <h3 className="text-sm font-semibold text-[#0D0D0D]">배터리 잔량</h3>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-[#F4F4F5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#22C55E] transition-all"
                    style={{ width: `${batteryPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#0D0D0D]">{batteryPct}%</span>
                  <span className="text-[#16A34A] font-medium">{batteryLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#B0B0B0]">* AQI 검사 결과는 시뮬레이션 데이터입니다. 실제 차량 상태와 다를 수 있습니다.</p>
      </div>
    </div>
  )
}

function StatCard({
  value,
  label,
  valueColor,
}: {
  value: string
  label: string
  valueColor: string
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#EEEEEE] py-4 px-3">
      <span className={`text-2xl font-bold leading-none ${valueColor}`}>{value}</span>
      <span className="mt-1.5 text-xs text-[#71717A]">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Warranty Section
// ---------------------------------------------------------------------------

function WarrantySection({ vehicle }: { vehicle: VehicleWithDetails }) {
  const warrantyEnd = vehicle.year + 5
  const currentYear = new Date().getFullYear()
  const warrantyRemaining = Math.max(0, warrantyEnd - currentYear)
  const warrantyPct = Math.min(100, Math.round((warrantyRemaining / 5) * 100))

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EEEEEE]">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">보증 정보</h2>
      </div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 제조사 보증 */}
          <div className="rounded-xl border border-[#EEEEEE] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
                <Shield className="size-5 text-[#2563EB]" />
              </div>
              <h3 className="text-base font-semibold text-[#0D0D0D]">제조사 보증</h3>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">기간</span>
                <span className="font-medium text-[#0D0D0D]">{warrantyEnd}.02 까지</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">거리</span>
                <span className="font-medium text-[#0D0D0D]">100,000km 까지</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-[#F4F4F5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2563EB]"
                  style={{ width: `${warrantyPct}%` }}
                />
              </div>
              <p className="text-xs text-[#16A34A] font-medium">
                잔여 {warrantyPct}% · {warrantyRemaining > 0 ? '유효' : '만료'}
              </p>
            </div>
          </div>

          {/* Navid Auto 연장보증 */}
          <div className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100">
                <ShieldCheck className="size-5 text-[#7C3AED]" />
              </div>
              <h3 className="text-base font-semibold text-[#0D0D0D]">Navid Auto 연장보증</h3>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">기간</span>
                <span className="font-medium text-[#0D0D0D]">+2년 연장 가능</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">거리</span>
                <span className="font-medium text-[#0D0D0D]">+30,000km 연장</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">비용</span>
                <span className="font-bold text-[#7C3AED]">월 35,000원</span>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              연장보증 추가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Finance Calculator Section
// ---------------------------------------------------------------------------

type FinanceTab = 'installment' | 'lease' | 'rent'

const FINANCE_BANKS = [
  { id: 'hana', name: '하나캐피탈', rate: 0.054 },
  { id: 'hyundai', name: '현대캐피탈', rate: 0.059 },
  { id: 'woori', name: '우리캐피탈', rate: 0.062 },
] as const

type BankId = (typeof FINANCE_BANKS)[number]['id']

const INSTALLMENT_PERIODS = [24, 36, 48, 60, 72]

function FinanceCalculatorSection({
  price,
  residualRate,
}: {
  price: number
  residualRate?: number | null
}) {
  const [financeTab, setFinanceTab] = useState<FinanceTab>('installment')
  const [selectedPeriod, setSelectedPeriod] = useState(48)
  const [downPaymentMan, setDownPaymentMan] = useState('')
  const [selectedBank, setSelectedBank] = useState<BankId>('hana')

  const bank = FINANCE_BANKS.find((b) => b.id === selectedBank) ?? FINANCE_BANKS[0]
  const downPayment = (parseFloat(downPaymentMan) || 0) * 10_000

  const monthlyPayment = useMemo(() => {
    if (financeTab === 'installment') {
      return calcInstallmentMonthly(price, downPayment, selectedPeriod, bank.rate)
    }
    if (financeTab === 'lease') {
      const rr = residualRate ?? 0.4
      const residualValue = Math.round(price * rr)
      const principal = price - downPayment
      const r = bank.rate / 12
      if (r === 0) return Math.round(Math.abs(principal - residualValue) / selectedPeriod)
      return Math.round(Math.abs(pmt(r, selectedPeriod, principal, -residualValue)))
    }
    // rent: simple division
    return Math.round((price - downPayment) / selectedPeriod)
  }, [financeTab, price, downPayment, selectedPeriod, bank.rate, residualRate])

  const totalInterest = useMemo(() => {
    if (financeTab === 'installment') {
      return monthlyPayment * selectedPeriod - (price - downPayment)
    }
    return 0
  }, [financeTab, monthlyPayment, selectedPeriod, price, downPayment])

  const totalRepayment = downPayment + monthlyPayment * selectedPeriod

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EEEEEE]">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">할부/리스 계산기</h2>
      </div>

      {/* Finance type tabs */}
      <div className="flex border-b border-[#EEEEEE] px-6">
        {(
          [
            { id: 'installment' as FinanceTab, label: '할부' },
            { id: 'lease' as FinanceTab, label: '리스' },
            { id: 'rent' as FinanceTab, label: '렌트' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFinanceTab(tab.id)}
            className={[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              financeTab === tab.id
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#71717A] hover:text-[#0D0D0D]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {/* Left panel */}
        <div className="px-6 py-5 space-y-5 border-r border-[#EEEEEE]">
          {/* Period pills */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0D0D0D]">
              {financeTab === 'installment' ? '할부 기간' : financeTab === 'lease' ? '리스 기간' : '렌트 기간'}
            </p>
            <div className="flex flex-wrap gap-2">
              {INSTALLMENT_PERIODS.map((mo) => (
                <button
                  key={mo}
                  type="button"
                  onClick={() => setSelectedPeriod(mo)}
                  className={[
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border',
                    selectedPeriod === mo
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'border-[#EEEEEE] text-[#71717A] hover:border-[#2563EB]/40',
                  ].join(' ')}
                >
                  {mo}개월
                </button>
              ))}
            </div>
          </div>

          {/* Down payment */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0D0D0D]">선수금</p>
            <div className="flex items-center gap-2 rounded-lg border border-[#EEEEEE] px-3 py-2.5 focus-within:border-[#2563EB]">
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={downPaymentMan}
                onChange={(e) => setDownPaymentMan(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-[#0D0D0D] placeholder:text-[#B0B0B0]"
              />
              <span className="text-sm text-[#71717A] shrink-0">만원</span>
            </div>
          </div>

          {/* Bank selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0D0D0D]">금융사</p>
            <div className="space-y-2">
              {FINANCE_BANKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id)}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                    selectedBank === b.id
                      ? 'border-[#2563EB] bg-blue-50/50'
                      : 'border-[#EEEEEE] hover:border-[#2563EB]/30',
                  ].join(' ')}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F5]">
                    <Building2 className="size-4 text-[#71717A]" />
                  </div>
                  <span className={selectedBank === b.id ? 'font-semibold text-[#2563EB]' : 'text-[#0D0D0D]'}>
                    {b.name}
                  </span>
                  <span className="ml-auto text-xs text-[#71717A]">
                    연 {(b.rate * 100).toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel (dark) */}
        <div className="flex flex-col justify-center bg-[#1A1A2E] px-6 py-6 space-y-4 rounded-br-2xl sm:rounded-bl-none rounded-bl-2xl sm:rounded-br-2xl">
          <p className="text-sm text-[#8888CC]">예상 월 납입금</p>
          <p className="text-[36px] font-bold leading-none text-white">
            월 {Math.round(monthlyPayment / 10_000).toLocaleString('ko-KR')}만원
          </p>
          <div className="h-px bg-[#333355]" />
          <div className="space-y-2.5">
            <FinanceDetailRow label="차량 가격" value={`${Math.round(price / 10_000).toLocaleString('ko-KR')}만원`} />
            <FinanceDetailRow label="할부 기간" value={`${selectedPeriod}개월`} />
            <FinanceDetailRow label="금리" value={`연 ${(bank.rate * 100).toFixed(1)}%`} />
            {financeTab === 'installment' && totalInterest > 0 && (
              <FinanceDetailRow label="총 이자" value={`${Math.round(totalInterest / 10_000).toLocaleString('ko-KR')}만원`} />
            )}
            <FinanceDetailRow label="총 상환금" value={`${Math.round(totalRepayment / 10_000).toLocaleString('ko-KR')}만원`} />
          </div>
          <p className="text-[10px] text-[#555580] leading-relaxed">
            * 실제 금리 및 납입금은 개인 신용도, 금융사 심사에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function FinanceDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#8888CC]">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function fuelTypeLabel(type: string): string {
  const map: Record<string, string> = {
    GASOLINE: '가솔린',
    DIESEL: '디젤',
    LPG: 'LPG',
    HYBRID: '하이브리드',
    ELECTRIC: '전기',
    HYDROGEN: '수소',
  }
  return map[type] ?? type
}

function transmissionLabel(type: string): string {
  const map: Record<string, string> = {
    AUTOMATIC: '자동',
    MANUAL: '수동',
    CVT: 'CVT',
    DCT: 'DCT',
  }
  return map[type] ?? type
}
