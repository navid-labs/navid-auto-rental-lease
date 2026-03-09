'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Promotion = {
  id: number
  title: string
  subtitle: string
  badge: string
  bgGradient: string
  ctaText: string
  ctaLink: string
}

const PROMOTIONS: Promotion[] = [
  {
    id: 1,
    title: '3월 특별 프로모션',
    subtitle: '첫 3개월 렌탈료 30% 할인',
    badge: '한정 특가',
    bgGradient: 'from-blue-600 to-blue-800',
    ctaText: '자세히 보기',
    ctaLink: '/vehicles?sort=price_asc',
  },
  {
    id: 2,
    title: '신규 입고 차량',
    subtitle: '2025년식 프리미엄 세단 대량 입고',
    badge: 'NEW',
    bgGradient: 'from-emerald-600 to-teal-800',
    ctaText: '지금 확인',
    ctaLink: '/vehicles?sort=newest',
  },
  {
    id: 3,
    title: '리스 특별 금리',
    subtitle: '연 3.9% 파격 금리 적용',
    badge: '금리 혜택',
    bgGradient: 'from-violet-600 to-purple-800',
    ctaText: '견적 받기',
    ctaLink: '/calculator',
  },
  {
    id: 4,
    title: '무보증 장기렌트',
    subtitle: '보증금 0원, 월 납입금만으로 시작',
    badge: '인기',
    bgGradient: 'from-orange-500 to-red-700',
    ctaText: '상담 신청',
    ctaLink: '/inquiry',
  },
]

const INTERVAL_MS = 5000

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

const transition = {
  duration: 0.45,
  ease: [0.32, 0.72, 0, 1] as const,
}

export function PromotionBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir)
    setCurrentIndex(index)
  }, [])

  const goPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + PROMOTIONS.length) % PROMOTIONS.length
    goTo(prevIndex, -1)
  }, [currentIndex, goTo])

  const goNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % PROMOTIONS.length
    goTo(nextIndex, 1)
  }, [currentIndex, goTo])

  // Auto-rotate
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(goNext, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isPaused, goNext])

  // Touch swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  const current = PROMOTIONS[currentIndex]

  return (
    <section className="py-8 md:py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-2xl h-48 md:h-56 lg:h-64"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={current.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className={`absolute inset-0 bg-gradient-to-r ${current.bgGradient} flex items-center`}
            >
              {/* Text content */}
              <div className="relative z-10 flex flex-col justify-center gap-3 px-8 md:px-12 lg:px-16 max-w-lg">
                <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {current.badge}
                </span>
                <h3 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl leading-tight">
                  {current.title}
                </h3>
                <p className="text-sm text-white/80 md:text-base">
                  {current.subtitle}
                </p>
                <Link
                  href={current.ctaLink}
                  className="mt-1 inline-flex w-fit items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-white/90 active:scale-95"
                >
                  {current.ctaText}
                </Link>
              </div>

              {/* Decorative circles */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
                <div className="absolute -right-8 bottom-0 translate-y-1/3 h-56 w-56 rounded-full bg-white/[0.07]" />
                <div className="absolute right-28 top-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-white/[0.06]" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next buttons */}
          <button
            onClick={goPrev}
            aria-label="이전 슬라이드"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            aria-label="다음 슬라이드"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Indicator dots */}
        <div className="mt-4 flex justify-center gap-2">
          {PROMOTIONS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
              aria-label={`슬라이드 ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 bg-accent'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
