'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface NavLink {
  href: string
  label: string
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="메뉴 열기" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] bg-sidebar-background text-sidebar-foreground p-0"
      >
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle className="text-lg font-bold text-sidebar-foreground">
            Navid <span className="text-sidebar-accent">Auto</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
            >
              {link.label}
            </Link>
          ))}

          <Separator className="my-2 bg-sidebar-border" />

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-accent transition-colors hover:bg-sidebar-accent/10"
          >
            로그인
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
