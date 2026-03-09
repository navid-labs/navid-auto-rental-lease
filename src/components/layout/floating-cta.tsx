'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, MessageCircle, Phone, X } from 'lucide-react'

const SUB_BUTTONS = [
  {
    id: 'inquiry',
    label: '온라인 문의',
    icon: FileText,
    href: '/inquiry',
    type: 'link' as const,
  },
  {
    id: 'kakao',
    label: '카카오톡 상담',
    icon: MessageCircle,
    href: '#',
    type: 'link' as const,
  },
  {
    id: 'phone',
    label: '전화 상담',
    icon: Phone,
    href: 'tel:1588-0000',
    type: 'tel' as const,
  },
]

export function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current + 10) {
        setIsVisible(false)
        setIsOpen(false)
      } else if (currentY < lastScrollY.current - 10) {
        setIsVisible(true)
      }
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Sub buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col items-end gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {SUB_BUTTONS.map((btn, index) => {
              const Icon = btn.icon
              const buttonContent = (
                <div className="flex items-center gap-2">
                  {/* Label tooltip */}
                  <motion.span
                    className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-md"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.05 }}
                  >
                    {btn.label}
                  </motion.span>
                  {/* Icon button */}
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white shadow-xl md:h-12 md:w-12"
                    initial={{ opacity: 0, y: 12, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-5 w-5 text-slate-700" />
                  </motion.div>
                </div>
              )

              if (btn.type === 'tel') {
                return (
                  <a key={btn.id} href={btn.href} aria-label={btn.label}>
                    {buttonContent}
                  </a>
                )
              }

              return (
                <Link key={btn.id} href={btn.href} aria-label={btn.label}>
                  {buttonContent}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-xl transition-shadow hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 md:h-14 md:w-14"
        aria-label={isOpen ? '상담 메뉴 닫기' : '상담 메뉴 열기'}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="phone"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Phone className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}
