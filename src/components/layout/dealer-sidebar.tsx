'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  FileText,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dealer/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/dealer/vehicles', label: '내 차량', icon: Car },
  { href: '/dealer/contracts', label: '계약 요청', icon: FileText },
  { href: '/dealer/profile', label: '프로필', icon: User },
]

export function DealerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar-background text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="text-lg font-bold">
          Navid <span className="text-sidebar-accent">Dealer</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent/15 text-sidebar-accent'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
