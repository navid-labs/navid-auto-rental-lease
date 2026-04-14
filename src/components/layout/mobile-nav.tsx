"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";

const TABS = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/list", label: "매물", Icon: Search },
  { href: "/sell", label: "등록", Icon: PlusCircle },
  { href: "/chat", label: "채팅", Icon: MessageCircle },
  { href: "/my", label: "MY", Icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-[var(--chayong-bg)] md:hidden"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        // Exact match for home, prefix match for others
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors"
            style={{
              color: isActive
                ? "var(--chayong-primary)"
                : "var(--chayong-text-caption)",
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
