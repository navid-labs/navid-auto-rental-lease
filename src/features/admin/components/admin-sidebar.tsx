"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "상담 리드", icon: Users, exact: false },
  { href: "/admin/listings", label: "매물 관리", icon: Car, exact: false },
  { href: "/admin/escrow", label: "에스크로 관리", icon: CreditCard, exact: false },
  { href: "/admin/settings", label: "설정", icon: Settings, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col border-r"
      style={{
        backgroundColor: "var(--chayong-bg)",
        borderColor: "var(--chayong-divider)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-5 border-b font-bold text-lg tracking-tight"
        style={{
          borderColor: "var(--chayong-divider)",
          color: "var(--chayong-primary)",
        }}
      >
        차용 ADMIN
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: active
                  ? "var(--chayong-primary)"
                  : "transparent",
                color: active ? "#fff" : "var(--chayong-text-sub)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
