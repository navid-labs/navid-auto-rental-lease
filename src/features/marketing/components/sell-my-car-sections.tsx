'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Search, Zap, Camera, RefreshCw, ChevronDown } from 'lucide-react'

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SellHeroSection
// ---------------------------------------------------------------------------

export function SellHeroSection() {
  const [plate, setPlate] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!plate.trim()) return
    setSubmitted(true)
    // Simulated — no backend integration required
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '480px' }}
    >
      {/* Background dark gradient */}
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

      {/* Radial light bloom */}
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

      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0" style={{ background: '#000000AA' }} />

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6 text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeUpVariants}>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-[13px] font-semibold text-white"
              style={{ background: '#1A6DFF' }}
            >
              빠르고 간편한 비대면 내차팔기
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUpVariants}
            className="whitespace-pre-line font-bold leading-tight tracking-tight text-white"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
          >
            {'내 차, 최고가에\n팔아보세요'}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUpVariants}
            className="whitespace-pre-line text-[16px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            {'차량 번호만 입력하면 실시간 AI 시세 분석으로\n최적의 매각 견적을 받아보실 수 있습니다'}
          </motion.p>

          {/* License plate input row */}
          <motion.form
            variants={fadeUpVariants}
            onSubmit={handleSubmit}
            className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                style={{ color: '#9999AA' }}
              />
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="차량 번호를 입력하세요 (예: 12가3456)"
                className="w-full rounded-lg bg-white pl-11 pr-4 text-[15px] text-[#0D0D0D] outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 placeholder:text-[#AAAAAA]"
                style={{ height: '52px', borderRadius: '10px' }}
              />
            </div>
            <button
              type="submit"
              className="flex shrink-0 items-center justify-center rounded-lg font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                background: '#1A6DFF',
                height: '52px',
                paddingLeft: '28px',
                paddingRight: '28px',
                borderRadius: '10px',
                fontSize: '15px',
              }}
            >
              {submitted ? '접수 완료!' : '견적 받기'}
            </button>
          </motion.form>

          {/* Trust row */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {['무료 시세 조회', '48시간 내 방문 매입', '즉시 입금'].map((item) => (
              <span
                key={item}
                className="text-[13px]"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                ✓ {item}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// BonusSection
// ---------------------------------------------------------------------------

const BONUS_CARDS = [
  {
    icon: Zap,
    title: '빠른 견적 보너스',
    description: '온라인으로 즉시 견적 신청 시\n10만원 추가 지급',
    amount: '+ 100,000원',
  },
  {
    icon: Camera,
    title: '사진 등록 보너스',
    description: '차량 사진 6장 이상 등록 시\n10만원 추가 지급',
    amount: '+ 100,000원',
  },
  {
    icon: RefreshCw,
    title: 'Navid Auto 재구매 보너스',
    description: 'Navid Auto에서 다른 차량 구매 시\n10만원 추가 지급',
    amount: '+ 100,000원',
  },
]

export function BonusSection() {
  return (
    <section className="bg-white" style={{ padding: '48px 0' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-[120px]">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-[13px] font-semibold"
            style={{
              background: 'rgba(249,115,22,0.15)',
              color: '#F97316',
            }}
          >
            최대 30만원 추가 지급
          </span>
          <h2 className="text-[28px] font-bold text-[#0D0D0D]">
            Navid Auto에서 팔면 더 받습니다
          </h2>
          <p className="text-[15px] text-[#7A7A7A]">
            경쟁사 대비 최대 30만원까지 추가 보너스를 드립니다
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {BONUS_CARDS.map(({ icon: Icon, title, description, amount }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-xl border bg-white p-8"
              style={{ borderColor: '#E4E4E7' }}
            >
              {/* Icon circle */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(249,115,22,0.12)' }}
              >
                <Icon className="h-6 w-6" style={{ color: '#F97316' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[17px] font-semibold text-[#0D0D0D]">{title}</p>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#7A7A7A]">
                  {description}
                </p>
              </div>

              <p className="text-[20px] font-bold" style={{ color: '#F97316' }}>
                {amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ProcessSection
// ---------------------------------------------------------------------------

const STEPS = [
  {
    number: '1',
    title: '번호판 입력',
    description: '차량 번호만 입력하면\nAI가 자동 시세 분석',
  },
  {
    number: '2',
    title: '견적 확인',
    description: '실시간 시세 기반\n최적 매각 견적 확인',
  },
  {
    number: '3',
    title: '방문 매입',
    description: '전문 평가사가\n원하는 장소로 방문',
  },
  {
    number: '4',
    title: '즉시 입금',
    description: '계약 즉시 대금\n입금 완료',
  },
]

export function ProcessSection() {
  return (
    <section style={{ background: '#F9FAFB', padding: '60px 0' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-[120px]">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-bold text-[#0D0D0D]">간단 4단계로 완료</h2>
          <p className="text-[15px] text-[#7A7A7A]">
            복잡한 절차 없이, 온라인에서 시작하고 방문 없이 끝냅니다
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="flex flex-col items-center gap-4 text-center">
              {/* Number circle */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold text-white"
                style={{ background: '#1A6DFF' }}
              >
                {number}
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[16px] font-semibold text-[#0D0D0D]">{title}</p>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#7A7A7A]">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FaqSection
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    question: '견적 조회는 무료인가요?',
    answer:
      '네, 견적 조회는 완전 무료입니다. 차량 번호만 입력하시면 AI 시세 분석을 통해 즉시 예상 매각 가격을 확인하실 수 있으며, 어떠한 비용도 발생하지 않습니다.',
  },
  {
    question: '차량 상태가 좋지 않아도 매각이 가능한가요?',
    answer:
      '네, 가능합니다. 사고 이력 차량, 고주행 차량, 일부 파손 차량 등 다양한 상태의 차량을 매입합니다. 차량 상태에 따라 견적 금액이 조정될 수 있으나, 전문 평가사가 직접 방문하여 공정한 가격을 산정해 드립니다.',
  },
  {
    question: '방문 매입 시 필요한 서류는 무엇인가요?',
    answer:
      '자동차 등록증, 신분증(주민등록증 또는 운전면허증), 차량 키(스페어 키 포함), 인감증명서(법인 차량의 경우 법인 인감증명서)가 필요합니다. 사전에 담당자가 안내드립니다.',
  },
  {
    question: '견적 금액과 실제 매입가가 다를 수 있나요?',
    answer:
      'AI 시세 분석은 공개된 시장 데이터를 기반으로 산출된 예상 금액입니다. 전문 평가사가 실제 차량 상태(주행거리, 사고 이력, 옵션 등)를 확인한 후 최종 매입가가 결정됩니다. 견적 범위 내에서 결정되도록 최선을 다하고 있습니다.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: '#E4E4E7' }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#F9FAFB]"
        aria-expanded={open}
      >
        <span className="text-[15px] font-semibold text-[#0D0D0D]">{question}</span>
        <ChevronDown
          className="h-5 w-5 shrink-0 transition-transform duration-200"
          style={{
            color: '#7A7A7A',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="border-t px-6 py-5"
          style={{ borderColor: '#E4E4E7', background: '#FAFAFA' }}
        >
          <p className="text-[14px] leading-relaxed text-[#555555]">{answer}</p>
        </div>
      )}
    </div>
  )
}

export function FaqSection() {
  return (
    <section className="bg-white" style={{ padding: '48px 0' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-[120px]">
        {/* Header */}
        <h2 className="mb-8 text-center text-[24px] font-bold text-[#0D0D0D]">
          자주 묻는 질문
        </h2>

        {/* FAQ list */}
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}
