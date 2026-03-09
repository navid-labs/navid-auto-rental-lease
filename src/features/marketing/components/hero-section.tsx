'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Search, Car, Shield, Sparkles, ChevronRight } from 'lucide-react'
import { getBrands, getModelsByBrand } from '@/features/vehicles/actions/get-cascade-data'

type BrandOption = { id: string; name: string; nameKo: string | null }
type ModelOption = { id: string; name: string; nameKo: string | null }

const QUICK_FILTERS = ['세단', 'SUV', '수입차', '월 50만원 이하', '전기차'] as const

const STATS = [
  { icon: Car, label: '180+ 차량' },
  { icon: Sparkles, label: '8개 브랜드' },
  { icon: Shield, label: '비대면 계약' },
] as const

// Animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const floatVariants: Variants = {
  animate: {
    y: [0, -14, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

const floatVariantsSlow: Variants = {
  animate: {
    y: [0, 10, 0],
    x: [0, 6, 0],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

export function HeroSection() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getBrands().then(setBrands)
  }, [])

  function handleBrandChange(brandId: string) {
    setSelectedBrand(brandId)
    setSelectedModel('')
    setModels([])
    if (brandId) {
      startTransition(async () => {
        const result = await getModelsByBrand(brandId)
        setModels(result)
      })
    }
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)
    if (selectedModel) params.set('model', selectedModel)
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
      className="relative flex min-h-[60vh] items-center overflow-hidden md:min-h-[70vh]"
      style={{
        background:
          'linear-gradient(135deg, hsl(220 55% 8%) 0%, hsl(220 50% 12%) 45%, hsl(220 45% 16%) 100%)',
      }}
    >
      {/* CSS grid dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsla(217 91% 80% / 0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radial accent glow — left-biased */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 20% 50%, hsla(217 91% 60% / 0.10), transparent)',
        }}
      />

      {/* Right glow behind decorative shapes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 55% at 80% 50%, hsla(217 91% 60% / 0.07), transparent)',
        }}
      />

      {/* ── Decorative right-side shapes ── */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {/* Large blurred car silhouette (CSS shape) */}
        <motion.div
          variants={floatVariantsSlow}
          animate="animate"
          className="absolute right-[4%] top-1/2 -translate-y-1/2"
        >
          {/* Outer halo ring */}
          <div
            className="h-[380px] w-[520px] rounded-[50%] border border-white/5"
            style={{
              background:
                'radial-gradient(ellipse at center, hsla(217 91% 60% / 0.06) 0%, transparent 70%)',
              filter: 'blur(2px)',
            }}
          />
          {/* Inner shape suggesting car body */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: '320px',
              height: '140px',
              background:
                'linear-gradient(180deg, hsla(217 91% 70% / 0.12) 0%, hsla(217 91% 50% / 0.04) 100%)',
              borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
              filter: 'blur(18px)',
            }}
          />
        </motion.div>

        {/* Floating circle top-right */}
        <motion.div
          variants={floatVariants}
          animate="animate"
          className="absolute right-[18%] top-[15%] h-16 w-16 rounded-full border border-accent/20"
          style={{
            background: 'hsla(217 91% 60% / 0.05)',
            boxShadow: '0 0 32px 0 hsla(217 91% 60% / 0.15)',
          }}
        />

        {/* Small circle mid-right */}
        <motion.div
          variants={floatVariantsSlow}
          animate="animate"
          className="absolute right-[30%] top-[65%] h-8 w-8 rounded-full border border-white/10"
          style={{ background: 'hsla(217 91% 60% / 0.04)' }}
        />

        {/* Thin horizontal line accent */}
        <div
          className="absolute right-[5%] top-[42%] h-px w-48 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(217 91% 70%), transparent)',
          }}
        />

        {/* Diagonal accent line */}
        <div
          className="absolute right-[8%] top-[55%] h-px w-32 origin-left rotate-[-35deg] opacity-15"
          style={{
            background: 'linear-gradient(90deg, hsl(217 91% 70%), transparent)',
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUpVariants}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
              <Sparkles className="h-3 w-3" />
              No.1 중고차 렌탈·리스 플랫폼
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUpVariants}
            className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl"
          >
            중고차 렌탈·리스의
            <br />
            <span
              className="text-accent"
              style={{ textShadow: '0 0 40px hsla(217 91% 60% / 0.35)' }}
            >
              새로운 기준
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUpVariants}
            className="mt-5 max-w-lg text-base leading-relaxed text-white/65 md:text-lg"
          >
            비대면 계약부터 투명한 가격까지.
            <br className="hidden sm:block" />
            180개+ 차량, 8개 브랜드를 한 곳에서 비교하고
            <br className="hidden sm:block" />
            지금 바로 계약을 완료하세요.
          </motion.p>

          {/* Search widget */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-8 rounded-2xl border border-white/15 bg-white/8 p-4 shadow-2xl backdrop-blur-md md:mt-10 md:p-5"
            style={{ boxShadow: '0 8px 40px hsla(220 55% 5% / 0.5), 0 0 0 1px hsla(217 91% 60% / 0.08)' }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              {/* Brand select */}
              <div className="relative flex-1">
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/8 px-4 py-3 pr-8 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/50"
                >
                  <option value="" className="bg-[hsl(220_55%_10%)] text-white">
                    브랜드 선택
                  </option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[hsl(220_55%_10%)] text-white">
                      {b.nameKo || b.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-white/40" />
              </div>

              {/* Model select */}
              <div className="relative flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedBrand || isPending}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/8 px-4 py-3 pr-8 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="" className="bg-[hsl(220_55%_10%)] text-white">
                    {isPending ? '로딩 중…' : '모델 선택'}
                  </option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[hsl(220_55%_10%)] text-white">
                      {m.nameKo || m.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-white/40" />
              </div>

              {/* CTA button */}
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/35 active:scale-[0.98] sm:w-auto"
              >
                <Search className="h-4 w-4" />
                차량 검색
              </button>
            </div>

            {/* Quick filter chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_FILTERS.map((label) => (
                <button
                  key={label}
                  onClick={() => handleQuickFilter(label)}
                  className="rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/60 transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div variants={fadeUpVariants} className="mt-6 flex items-center gap-6">
            {STATS.map(({ icon: Icon, label }, i) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-white/55">
                <Icon className="h-4 w-4 text-accent/70" />
                {label}
                {i < STATS.length - 1 && (
                  <span className="ml-4 text-white/20">|</span>
                )}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
