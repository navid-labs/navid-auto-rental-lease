import Image from "next/image";
import Link from "next/link";
import { HeaderAuth } from "./header-auth";
import { NotificationBell } from "./notification-bell";

const NAV_LINKS = [
  { href: "/list", label: "매물보기" },
  { href: "/sell", label: "내 차 등록" },
  { href: "/guide", label: "이용가이드" },
];

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-[var(--chayong-bg)]"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="차용"
            width={120}
            height={40}
            priority
            className="h-9 w-auto"
          />
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
        <div className="hidden items-center gap-1 md:flex">
          <NotificationBell />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
