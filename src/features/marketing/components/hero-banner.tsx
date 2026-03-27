'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'

type Banner = {
  id: number
  title: string
  subtitle: string
  gradient: string
  cta: string
}

const BANNERS: Banner[] = [
  {
    id: 1,
    title: '신규 차량 입고',
    subtitle: '엄선된 인증 중고차를 만나보세요',
    gradient: 'from-brand-blue to-[#0D47A1]',
    cta: '/vehicles?sort=newest',
  },
  {
    id: 2,
    title: '렌트 특가',
    subtitle: '월 30만원대부터 시작하는 장기렌트',
    gradient: 'from-[#059669] to-[#065F46]',
    cta: '/vehicles?type=rental',
  },
  {
    id: 3,
    title: '보증 서비스',
    subtitle: '최대 2년 보증으로 안심 구매',
    gradient: 'from-[#1E293B] to-[#0F172A]',
    cta: '/vehicles?warranty=extended',
  },
]

export function HeroBanner() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const onSelect = useCallback(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
  }, [api])

  useEffect(() => {
    if (!api) return
    onSelect()
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, onSelect])

  return (
    <section className="w-full">
      <Carousel
        opts={{ loop: true }}
        plugins={[
          Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true }),
        ]}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {BANNERS.map((banner) => (
            <CarouselItem key={banner.id} className="pl-0 basis-full">
              <Link href={banner.cta}>
                <div
                  className={`relative flex h-[320px] md:h-[400px] w-full items-center bg-gradient-to-r ${banner.gradient}`}
                >
                  <div className="mx-auto max-w-7xl px-4 md:px-8">
                    <h2 className="text-[28px] md:text-[40px] font-bold text-white leading-tight">
                      {banner.title}
                    </h2>
                    <p className="mt-2 text-[16px] md:text-[18px] text-white/80">
                      {banner.subtitle}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                      자세히 보기 <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-white/20 text-white border-0 hover:bg-white/40" />
        <CarouselNext className="right-4 bg-white/20 text-white border-0 hover:bg-white/40" />
      </Carousel>
      {/* Dot indicators */}
      <div className="flex justify-center gap-2 py-3 bg-white">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              current === index ? 'w-6 bg-brand-blue' : 'w-2 bg-border'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
