import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { MobileNav } from '@/components/layout/mobile-nav'

const navLinks = [
  { href: '/vehicles', label: '차량검색' },
  { href: '/calculator', label: '계산기' },
  { href: '/rental-lease', label: '렌탈/리스' },
  { href: '/inquiry', label: '문의하기' },
]

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            Navid <span className="text-accent">Auto</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {user.name || user.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav links={navLinks} user={user ? { name: user.name, email: user.email } : null} />
        </div>
      </div>
    </header>
  )
}
