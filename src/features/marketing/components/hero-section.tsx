'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { listBrands, listModelsByBrand } from '@/lib/api/generated/vehicles/vehicles'
import type { Brand, CarModel } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'

type BrandOption = Brand
type ModelOption = CarModel

type SearchTab = '제조사/모델' | '예산' | '차종'
const TABS: SearchTab[] = ['제조사/모델', '예산', '차종']

const BODY_TYPES = ['세단', 'SUV', '해치백', 'MPV', '쿠페', '컨버터블'] as const
const BUDGET_RANGES = [
  { label: '30만원 이하', value: '300000' },
  { label: '40만원 이하', value: '400000' },
  { label: '50만원 이하', value: '500000' },
  { label: '70만원 이하', value: '700000' },
  { label: '100만원 이하', value: '1000000' },
] as const

// Animation variants
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export function HeroSection() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('제조사/모델')
  const [selectedBudget, setSelectedBudget] = useState('')
  const [selectedBodyType, setSelectedBodyType] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    listBrands().then((response) => setBrands(response.data.data ?? []))
  }, [])

  function handleBrandChange(brandId: string) {
    setSelectedBrand(brandId)
    setSelectedModel('')
    setModels([])
    if (brandId) {
      startTransition(async () => {
        const response = await listModelsByBrand(brandId)
        setModels(response.data.data ?? [])
      })
    }
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (activeTab === '제조사/모델') {
      if (selectedBrand) params.set('brand', selectedBrand)
      if (selectedModel) params.set('model', selectedModel)
    } else if (activeTab === '예산') {
      if (selectedBudget) params.set('maxMonthly', selectedBudget)
    } else if (activeTab === '차종') {
      if (selectedBodyType) {
        const bodyTypeMap: Record<string, string> = {
          세단: 'SEDAN',
          SUV: 'SUV',
          해치백: 'HATCHBACK',
          MPV: 'MPV',
          쿠페: 'COUPE',
          컨버터블: 'CONVERTIBLE',
        }
        params.set('bodyType', bodyTypeMap[selectedBodyType] ?? selectedBodyType)
      }
    }
    router.push(`/vehicles?${params.toString()}`)
  }

  function handleQuickFilter(label: string) {
    const params = new URLSearchParams()
    if (label === '세단') params.set('bodyType', 'SEDAN')
    else if (label === 'SUV') params.set('bodyType', 'SUV')
    else if (label === '수입차') params.set('origin', 'import')
    else if (label === '월 50만원 이하') params.set('maxMonthly', '500000')
    else if (label === '전기차') params.set('fuelType', 'ELECTRIC')
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '480px' }}
    >
      {/* Background: dramatic dark gradient simulating a night car photo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, #0a0f1e 0%, #0d1428 30%, #111827 60%, #0a0d18 100%)',
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(hsla(220 100% 70% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsla(220 100% 70% / 0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial light bloom — center-bottom, simulating car headlights */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 110%, hsla(220 100% 60% / 0.18) 0%, transparent 70%)',
        }}
      />

      {/* Left ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 60% at 0% 50%, hsla(220 100% 50% / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Dark overlay matching spec #000000AA */}
      <div className="pointer-events-none absolute inset-0" style={{ background: '#000000AA' }} />

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-16 md:px-8 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6 text-center"
        >
          {/* Title */}
          <motion.h1
            variants={fadeUpVariants}
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-white"
          >
            당신의 새로운 차, Navid Auto에서 시작하세요
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUpVariants}
            className="text-[18px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            검증된 중고차, 투명한 가격, 안심 거래
          </motion.p>

          {/* Tabbed Search Box */}
          <motion.div
            variants={fadeUpVariants}
            className="w-full rounded-2xl bg-white shadow-2xl"
            style={{ maxWidth: '900px' }}
          >
            {/* Tabs */}
            <div className="flex border-b border-[#E0E0E0]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 px-4 py-3 text-sm font-semibold transition-colors first:rounded-tl-2xl last:rounded-tr-2xl"
                    style={
                      isActive
                        ? { background: '#1A6DFF', color: '#ffffff' }
                        : { background: '#F4F4F4', color: '#555555' }
                    }
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            {/* Filter area */}
            <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center">
              {/* Tab content */}
              {activeTab === '제조사/모델' && (
                <>
                  {/* Brand select */}
                  <div className="relative flex-1">
                    <select
                      value={selectedBrand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition focus:border-[#1A6DFF]"
                      style={{
                        background: '#F8F8F8',
                        borderColor: '#E0E0E0',
                        color: selectedBrand ? '#0D0D0D' : '#999999',
                        height: '44px',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="" style={{ color: '#999999' }}>
                        브랜드 선택
                      </option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id} style={{ color: '#0D0D0D' }}>
                          {b.nameKo || b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: '#999999' }}
                    />
                  </div>

                  {/* Model select */}
                  <div className="relative flex-1">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={!selectedBrand || isPending}
                      className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition focus:border-[#1A6DFF] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: '#F8F8F8',
                        borderColor: '#E0E0E0',
                        color: selectedModel ? '#0D0D0D' : '#999999',
                        height: '44px',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="" style={{ color: '#999999' }}>
                        {isPending ? '로딩 중…' : '모델 선택'}
                      </option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id} style={{ color: '#0D0D0D' }}>
                          {m.nameKo || m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: '#999999' }}
                    />
                  </div>
                </>
              )}

              {activeTab === '예산' && (
                <div className="relative flex-1">
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition focus:border-[#1A6DFF]"
                    style={{
                      background: '#F8F8F8',
                      borderColor: '#E0E0E0',
                      color: selectedBudget ? '#0D0D0D' : '#999999',
                      height: '44px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="" style={{ color: '#999999' }}>
                      월 예산 선택
                    </option>
                    {BUDGET_RANGES.map((r) => (
                      <option key={r.value} value={r.value} style={{ color: '#0D0D0D' }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: '#999999' }}
                  />
                </div>
              )}

              {activeTab === '차종' && (
                <div className="relative flex-1">
                  <select
                    value={selectedBodyType}
                    onChange={(e) => setSelectedBodyType(e.target.value)}
                    className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition focus:border-[#1A6DFF]"
                    style={{
                      background: '#F8F8F8',
                      borderColor: '#E0E0E0',
                      color: selectedBodyType ? '#0D0D0D' : '#999999',
                      height: '44px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="" style={{ color: '#999999' }}>
                      차종 선택
                    </option>
                    {BODY_TYPES.map((bt) => (
                      <option key={bt} value={bt} style={{ color: '#0D0D0D' }}>
                        {bt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: '#999999' }}
                  />
                </div>
              )}

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: '#1A6DFF',
                  width: '140px',
                  height: '44px',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                <Search className="h-4 w-4" />
                검색
              </button>
            </div>
          </motion.div>

          {/* Quick filter chips */}
          <motion.div variants={fadeUpVariants} className="flex flex-wrap justify-center gap-2">
            {(['세단', 'SUV', '수입차', '월 50만원 이하', '전기차'] as const).map((label) => (
              <button
                key={label}
                onClick={() => handleQuickFilter(label)}
                className="rounded-full border px-4 py-1.5 text-xs font-medium transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.70)',
                  background: 'rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26,109,255,0.7)'
                  e.currentTarget.style.color = '#1A6DFF'
                  e.currentTarget.style.background = 'rgba(26,109,255,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.70)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
