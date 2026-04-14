import Link from "next/link";

const NAV_LINKS = [
  { href: "/list", label: "매물보기" },
  { href: "/list?type=USED_LEASE", label: "중고 리스·렌트" },
  { href: "/sell", label: "매물등록" },
  { href: "/guide", label: "이용가이드" },
];

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-[var(--chayong-bg)]"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            C
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--chayong-text)" }}
          >
            차용
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium transition-colors hover:text-[var(--chayong-primary)]"
              style={{ color: "var(--chayong-text-sub)" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium transition-colors hover:text-[var(--chayong-primary)]"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--chayong-primary-hover)]"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            회원가입
          </Link>
        </div>
      </div>
    </header>
  );
}
