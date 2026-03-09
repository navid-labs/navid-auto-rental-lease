'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselScrollButtonsProps {
  carouselId: string
}

export function CarouselScrollButtons({ carouselId }: CarouselScrollButtonsProps) {
  const scroll = (direction: 'left' | 'right') => {
    const el = document.getElementById(carouselId)
    if (!el) return
    const scrollAmount = 320
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <button
        onClick={() => scroll('left')}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:border-accent hover:text-accent"
        aria-label="이전 차량"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:border-accent hover:text-accent"
        aria-label="다음 차량"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
