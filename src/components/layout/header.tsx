import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { MobileNav } from '@/components/layout/mobile-nav'

const navLinks = [
  { href: '/vehicles', label: '내차사기' },
  { href: '/sell', label: '내차팔기' },
  { href: '/rental-lease', label: '렌트/구독' },
  { href: '#', label: '금융사전용관' },
  { href: '#', label: '라이브상담' },
]

export async function Header() {
  const user = await getCurrentUser()

  return (
    <>
      {/* Top Bar — desktop only */}
      <div className="hidden w-full border-b border-[#E8E8E8] bg-[#F8F8F8] md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-[120px] py-[10px]">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[#7A7A7A]">
                {user.name || user.email}
              </span>
              <span className="text-[#E8E8E8]">|</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
              >
                로그인
              </Link>
              <span className="text-[#E8E8E8]">|</span>
              <Link
                href="/signup"
                className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
              >
                회원가입
              </Link>
              <span className="text-[#E8E8E8]">|</span>
              <Link
                href="/inquiry?type=support"
                className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
              >
                고객센터
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E8E8E8] bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-[120px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A6DFF]">
              <span className="text-[16px] font-extrabold leading-none text-white">N</span>
            </div>
            <span className="text-[22px] font-bold leading-none text-[#0D0D0D]">
              Navid Auto
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[15px] font-medium text-[#555555] transition-colors hover:text-[#0D0D0D]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNav
              links={navLinks}
              user={user ? { name: user.name, email: user.email } : null}
            />
          </div>
        </div>
      </header>
    </>
  )
}
