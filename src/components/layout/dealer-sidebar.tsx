'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  FileText,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LAST_VISIT_KEY = 'navid:lastDashboardVisit'

const navItems = [
  { href: '/dealer/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/dealer/vehicles', label: '내 차량', icon: Car },
  { href: '/dealer/contracts', label: '계약 요청', icon: FileText },
  { href: '/dealer/profile', label: '프로필', icon: User },
]

type DealerSidebarProps = {
  latestApprovalChange?: string | null
}

export function DealerSidebar({ latestApprovalChange }: DealerSidebarProps) {
  const pathname = usePathname()
  const [showDot, setShowDot] = useState(false)

  useEffect(() => {
    if (!latestApprovalChange) return

    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
    if (!lastVisit || new Date(latestApprovalChange) > new Date(lastVisit)) {
      setShowDot(true)
    }
  }, [latestApprovalChange])

  // When dashboard is active, update last visit timestamp and hide dot
  useEffect(() => {
    if (pathname.startsWith('/dealer/dashboard')) {
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
      setShowDot(false)
    }
  }, [pathname])

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
          const isDashboard = item.href === '/dealer/dashboard'
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
              {isDashboard && showDot && (
                <span className="size-2 rounded-full bg-red-500" aria-label="새 알림" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
