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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { MENU_DATA } from './mega-menu-data'

interface MobileNavProps {
  user?: { name: string | null; email: string } | null
}

export function MobileNav({ user }: MobileNavProps) {
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
        className="w-[300px] overflow-y-auto bg-white p-0"
      >
        <SheetHeader className="border-b border-[#E8E8E8] p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A6DFF]">
              <span className="text-[14px] font-extrabold leading-none text-white">
                N
              </span>
            </div>
            <span className="text-[18px] font-bold text-[#0D0D0D]">
              Navid Auto
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-0 p-2">
          {/* Menu items with optional accordion */}
          {MENU_DATA.map((category) =>
            category.hasMegaMenu && category.sections ? (
              <Accordion key={category.label} defaultValue={[]}>
                <AccordionItem value={category.label} className="border-0">
                  <AccordionTrigger className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#0D0D0D] hover:bg-[#F5F5F5] hover:no-underline">
                    {category.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    {category.sections.map((section) => (
                      <div key={section.title} className="px-3 py-1">
                        <p className="mb-1 px-3 text-[11px] font-bold uppercase text-[#999999]">
                          {section.title}
                        </p>
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-1.5 text-[13px] text-[#555555] transition-colors hover:bg-[#F5F5F5] hover:text-[#1A6DFF]"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                    {/* "All" link */}
                    <Link
                      href={category.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-6 py-2 text-[13px] font-medium text-[#1A6DFF] transition-colors hover:bg-[#EBF3FF]"
                    >
                      전체보기 &rarr;
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <Link
                key={category.label}
                href={category.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#0D0D0D] transition-colors hover:bg-[#F5F5F5]"
              >
                {category.label}
              </Link>
            ),
          )}

          <Separator className="my-2 bg-[#E8E8E8]" />

          {/* User section */}
          {user ? (
            <div className="space-y-1 px-3 py-2">
              <p className="text-sm font-medium text-[#0D0D0D]">
                {user.name || user.email}
              </p>
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="block rounded-md py-1.5 text-sm text-[#555555] transition-colors hover:text-[#1A6DFF]"
              >
                마이페이지
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex flex-col gap-1 px-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#1A6DFF] transition-colors hover:bg-[#EBF3FF]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#555555] transition-colors hover:bg-[#F5F5F5]"
              >
                회원가입
              </Link>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
