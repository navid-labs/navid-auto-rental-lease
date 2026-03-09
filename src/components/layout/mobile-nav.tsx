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
import { LogoutButton } from '@/features/auth/components/logout-button'

interface NavLink {
  href: string
  label: string
}

interface MobileNavProps {
  links: NavLink[]
  user?: { name: string | null; email: string } | null
}

export function MobileNav({ links, user }: MobileNavProps) {
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
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A6DFF]">
              <span className="text-[14px] font-extrabold leading-none text-white">N</span>
            </div>
            <span className="text-[18px] font-bold text-[#0D0D0D]">Navid Auto</span>
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

          {user ? (
            <div className="space-y-2 px-3">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.name || user.email}
              </p>
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="block rounded-lg py-2 text-sm text-sidebar-foreground transition-colors hover:text-sidebar-accent"
              >
                마이페이지
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#1A6DFF] transition-colors hover:bg-[#1A6DFF]/10"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10"
              >
                회원가입
              </Link>
              <Link
                href="/inquiry?type=support"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10"
              >
                고객센터
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
