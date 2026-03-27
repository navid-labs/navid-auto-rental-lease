'use client'

import { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type CarInfo = {
  name: string
  price: string
}

type Partner = {
  name: string
  desc: string
  gradient: string
  cars: [CarInfo, CarInfo]
}

const PARTNERS: Partner[] = [
  {
    name: '하나캐피탈',
    desc: '하나캐피탈과 함께하는\n특별한 중고차 금융 혜택',
    gradient: 'from-blue-700 to-indigo-900',
    cars: [
      { name: '그랜저 IG', price: '월 35만원~' },
      { name: '쏘렌토 MQ4', price: '월 42만원~' },
    ],
  },
  {
    name: '우리캐피탈',
    desc: '우리캐피탈 제휴 특별금리\n연 3.9% 파격 혜택',
    gradient: 'from-emerald-700 to-teal-900',
    cars: [
      { name: 'K5 DL3', price: '월 38만원~' },
      { name: '투싼 NX4', price: '월 45만원~' },
    ],
  },
  {
    name: 'MG손해보험',
    desc: 'MG손해보험 차량 보증\n안심 중고차 보증 프로그램',
    gradient: 'from-violet-700 to-purple-900',
    cars: [
      { name: '아반떼 CN7', price: '월 30만원~' },
      { name: '모델3', price: '월 55만원~' },
    ],
  },
  {
    name: '현대캐피탈',
    desc: '현대캐피탈 전용 할부\n최저 금리로 내 차 마련',
    gradient: 'from-orange-600 to-red-800',
    cars: [
      { name: '팰리세이드', price: '월 65만원~' },
      { name: 'G80', price: '월 75만원~' },
    ],
  },
]

const contentVariants: Variants = {
  enter: { opacity: 0, y: 12 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
}

function MiniCarCard({ car }: { car: CarInfo }) {
  return (
    <div
      style={{
        width: 180,
        height: 200,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.067)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Car image placeholder */}
      <div
        style={{
          height: 120,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Minimal car silhouette icon */}
        <svg
          width="56"
          height="32"
          viewBox="0 0 56 32"
          fill="none"
          style={{ opacity: 0.55 }}
        >
          <path
            d="M4 22h48M8 22l5-10h22l5 10M16 12l2-5h18l2 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="15" cy="24" r="4" fill="white" fillOpacity="0.7" />
          <circle cx="41" cy="24" r="4" fill="white" fillOpacity="0.7" />
        </svg>
      </div>

      {/* Car info */}
      <div
        style={{
          flex: 1,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {car.name}
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#FFD700',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {car.price}
        </p>
      </div>
    </div>
  )
}

export function FinancePartners() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activePartner = PARTNERS[activeIndex]

  return (
    <section style={{ background: '#FFFFFF', paddingTop: 48, paddingBottom: 48 }}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          금융사 전용관
        </h2>

        {/* Tab row -- full width, 4 equal tabs */}
        <div className="flex w-full" style={{ marginBottom: 16 }}>
          {PARTNERS.map((partner, index) => {
            const isActive = activeIndex === index
            const isFirst = index === 0
            const isLast = index === PARTNERS.length - 1

            return (
              <button
                key={partner.name}
                onClick={() => setActiveIndex(index)}
                style={{
                  flex: 1,
                  height: 44,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'var(--brand-blue)' : 'var(--surface-hover)',
                  color: isActive ? '#FFFFFF' : 'var(--muted-foreground)',
                  border: isActive ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: isFirst
                    ? '8px 0 0 8px'
                    : isLast
                      ? '0 8px 8px 0'
                      : 0,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {partner.name}
              </button>
            )
          })}
        </div>

        {/* Content area */}
        <div
          className={`relative overflow-hidden bg-gradient-to-br ${activePartner.gradient}`}
          style={{
            height: 280,
            borderRadius: 16,
            transition: 'background 0.4s',
          }}
        >
          {/* Dark overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16 }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative z-10 flex h-full items-center"
              style={{ padding: '0 40px', gap: 40 }}
            >
              {/* Left side -- partner info + CTA */}
              <div
                style={{
                  width: 360,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {activePartner.name}
                </p>
                <p
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.80)',
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {activePartner.desc}
                </p>
                <button
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFFFFF',
                    color: 'var(--brand-blue)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.85'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  자세히 보기
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Right side -- mini vehicle cards (hidden on mobile) */}
              <div
                className="hidden md:flex"
                style={{ gap: 16, alignItems: 'center' }}
              >
                {activePartner.cars.map((car) => (
                  <MiniCarCard key={car.name} car={car} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
