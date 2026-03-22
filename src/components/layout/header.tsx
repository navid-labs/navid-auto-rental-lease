import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { HeaderSearch } from '@/components/layout/header-search'
import { MegaMenu } from '@/components/layout/mega-menu'
import { MobileNav } from '@/components/layout/mobile-nav'

export async function Header() {
  const user = await getCurrentUser()

  return (
    <>
      {/* Top Bar -- desktop only */}
      <div className="hidden w-full border-b border-[#E8E8E8] bg-[#F8F8F8] md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-[120px] py-[10px]">
          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
                >
                  관리자
                </Link>
              )}
              {user.role === 'DEALER' && (
                <Link
                  href="/dealer"
                  className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
                >
                  딜러포털
                </Link>
              )}
              <Link
                href="/mypage"
                className="text-[12px] text-[#7A7A7A] transition-colors hover:text-[#0D0D0D]"
              >
                마이페이지
              </Link>
              <span className="text-[#E8E8E8]">|</span>
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

      {/* Main Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E8E8E8] bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-[120px]">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A6DFF]">
              <span className="text-[16px] font-extrabold leading-none text-white">
                N
              </span>
            </div>
            <span className="text-[22px] font-bold leading-none text-[#0D0D0D]">
              Navid Auto
            </span>
          </Link>

          {/* Center: Search bar (desktop only) */}
          <HeaderSearch />

          {/* Right: User actions (desktop) + Mobile nav */}
          <div className="flex items-center gap-4">
            {/* Desktop user actions -- hidden on mobile */}
            <div className="hidden items-center gap-3 md:flex">
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="text-[13px] font-medium text-[#555555] transition-colors hover:text-[#0D0D0D]"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-[#1A6DFF] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
            {/* Mobile hamburger */}
            <div className="md:hidden">
              <MobileNav
                user={user ? { name: user.name, email: user.email } : null}
              />
            </div>
          </div>
        </div>

        {/* Mega Menu Nav Bar (desktop only) */}
        <MegaMenu />
      </header>
    </>
  )
}
