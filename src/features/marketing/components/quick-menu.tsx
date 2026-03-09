import Link from 'next/link'
import { Car, Banknote, KeyRound, ShieldCheck, Shield, Truck, CreditCard, Headphones } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MenuItem = {
  label: string
  icon: LucideIcon
  href: string
}

const MENU_ITEMS: MenuItem[] = [
  { label: '내차사기',   icon: Car,         href: '/vehicles' },
  { label: '내차팔기',   icon: Banknote,    href: '/inquiry?type=sell' },
  { label: '렌트/구독',  icon: KeyRound,    href: '/rental-lease' },
  { label: '안심환불',   icon: ShieldCheck, href: '/vehicles?guarantee=true' },
  { label: '연장보증',   icon: Shield,      href: '/vehicles?warranty=extended' },
  { label: '탁송서비스', icon: Truck,       href: '/inquiry?type=delivery' },
  { label: '할부금융',   icon: CreditCard,  href: '/calculator' },
  { label: '라이브상담', icon: Headphones,  href: '/inquiry?type=live' },
]

export function QuickMenu() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* 4 columns on mobile, 8 evenly spread on md+ */}
        <ul className="grid grid-cols-4 gap-y-6 md:flex md:items-start md:justify-between">
          {MENU_ITEMS.map(({ label, icon: Icon, href }) => (
            <li key={label} className="flex justify-center">
              <Link
                href={href}
                className="group flex flex-col items-center gap-2.5 transition-transform duration-200 hover:scale-105"
              >
                {/* Icon circle */}
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-200 group-hover:bg-[#D6E8FF]"
                  style={{ backgroundColor: '#EBF3FF' }}
                >
                  <Icon
                    style={{ width: 24, height: 24, color: '#1A6DFF' }}
                    strokeWidth={1.75}
                  />
                </span>

                {/* Label */}
                <span
                  className="text-[13px] font-medium leading-tight"
                  style={{ color: '#333333' }}
                >
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
