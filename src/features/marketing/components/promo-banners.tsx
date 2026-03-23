import Link from 'next/link'
import { Truck, Zap, Car } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type PromoBanner = {
  tag: string
  title: string
  subtitle: string
  icon: LucideIcon
  gradient: string
  href: string
}

const PROMOS: PromoBanner[] = [
  {
    tag: '홈서비스',
    title: '내차사기 홈서비스',
    subtitle: '집에서 편하게 차량 배송',
    icon: Truck,
    gradient: 'from-[#1A6DFF] to-[#0D47A1]',
    href: '/vehicles?delivery=free',
  },
  {
    tag: '특가',
    title: '위클리 특가',
    subtitle: '매주 엄선된 특별 가격',
    icon: Zap,
    gradient: 'from-[#DC2626] to-[#991B1B]',
    href: '/vehicles?sort=price_asc',
  },
  {
    tag: '렌트',
    title: 'Navid 렌트',
    subtitle: '월 30만원대부터 장기렌트',
    icon: Car,
    gradient: 'from-[#059669] to-[#065F46]',
    href: '/vehicles?type=rental',
  },
]

export function PromoBanners() {
  return (
    <section className="bg-white py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-5 text-[24px] font-bold text-[#0D0D0D]">서비스</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROMOS.map((promo) => (
            <Link
              key={promo.tag}
              href={promo.href}
              className={`group relative flex h-[160px] items-center overflow-hidden rounded-2xl bg-gradient-to-r ${promo.gradient} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="relative z-10 flex items-center gap-4 px-6">
                <promo.icon className="size-10 shrink-0 text-white/80" strokeWidth={1.5} />
                <div>
                  <span className="mb-1.5 inline-block rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                    {promo.tag}
                  </span>
                  <p className="text-[18px] font-bold leading-tight text-white">{promo.title}</p>
                  <p className="mt-0.5 text-[13px] text-white/70">{promo.subtitle}</p>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -right-4 bottom-0 size-20 translate-y-1/3 rounded-full bg-white/[0.07]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
