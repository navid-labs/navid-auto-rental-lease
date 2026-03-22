import Link from 'next/link'
import { Truck, Zap, Sparkles, Car, Gift, KeyRound, Banknote, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type QuickLink = { label: string; icon: LucideIcon; href: string; color: string }

const QUICK_LINKS: QuickLink[] = [
  { label: '무료배송', icon: Truck, href: '/vehicles?delivery=free', color: '#059669' },
  { label: '위클리특가', icon: Zap, href: '/vehicles?sort=price_asc', color: '#DC2626' },
  { label: '기획전', icon: Sparkles, href: '/vehicles?event=true', color: '#7C3AED' },
  { label: '렌트특가', icon: KeyRound, href: '/vehicles?type=rental', color: '#EA580C' },
  { label: '테마기획전', icon: Gift, href: '/vehicles?theme=true', color: '#0284C7' },
  { label: '내차사기', icon: Car, href: '/vehicles', color: '#1A6DFF' },
  { label: '내차팔기', icon: Banknote, href: '/inquiry?type=sell', color: '#16A34A' },
  { label: '안심보증', icon: ShieldCheck, href: '/vehicles?warranty=extended', color: '#9333EA' },
]

export function QuickLinks() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4">
        {/* Desktop: evenly spread, Mobile: horizontal scroll */}
        <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide md:justify-between md:overflow-visible">
          {QUICK_LINKS.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href}
              className="group flex shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105"
              style={{ minWidth: '72px' }}
            >
              <span
                className="flex size-14 items-center justify-center rounded-full transition-colors"
                style={{ backgroundColor: `${color}10` }}
              >
                <Icon style={{ width: 24, height: 24, color }} strokeWidth={1.75} />
              </span>
              <span className="text-[13px] font-medium text-[#333333] whitespace-nowrap">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
