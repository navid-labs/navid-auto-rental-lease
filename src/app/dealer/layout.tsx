'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DealerSidebar } from '@/components/layout/dealer-sidebar'

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">
        <DealerSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="사이드바 열기" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0"
              showCloseButton={false}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>딜러 네비게이션</SheetTitle>
              </SheetHeader>
              <DealerSidebar />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold text-primary">
            Navid <span className="text-accent">Dealer</span>
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
