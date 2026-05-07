"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  Kanban,
  Shield,
  ClipboardCheck,
  Wallet,
  Flag,
  ChevronDown,
} from "lucide-react";
import { useAdminRoleStore } from "@/lib/admin/role-store";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/types/admin";

const ROLE_ICONS: Record<AdminRole, React.ComponentType<{ size?: number }>> = {
  admin: Shield,
  inspector: ClipboardCheck,
  finance: Wallet,
};

const ALL_ROLES: AdminRole[] = ["admin", "inspector", "finance"];

const navItems = [
  {
    href: "/admin",
    label: "대시보드",
    icon: LayoutDashboard,
    exact: true,
    roles: ["admin", "inspector", "finance"] as AdminRole[],
  },
  {
    href: "/admin/leads",
    label: "상담 리드",
    icon: Users,
    exact: false,
    roles: ["admin", "finance"] as AdminRole[],
  },
  {
    href: "/admin/pipeline",
    label: "매물 파이프라인",
    icon: Kanban,
    exact: false,
    roles: ["admin", "inspector"] as AdminRole[],
  },
  {
    href: "/admin/listings",
    label: "매물 관리",
    icon: Car,
    exact: false,
    roles: ["admin", "inspector"] as AdminRole[],
  },
  {
    href: "/admin/escrow",
    label: "에스크로 관리",
    icon: CreditCard,
    exact: false,
    roles: ["admin"] as AdminRole[],
  },
  {
    href: "/admin/reports",
    label: "신고 관리",
    icon: Flag,
    exact: false,
    roles: ["admin"] as AdminRole[],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useAdminRoleStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const RoleIcon = ROLE_ICONS[role];
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

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

      {/* Role Switcher */}
      <div className="px-3 pt-3 pb-1" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
          style={{
            borderColor: "var(--chayong-divider)",
            color: "var(--chayong-text)",
            backgroundColor: "var(--chayong-surface)",
          }}
        >
          <span className="flex items-center gap-2">
            <RoleIcon size={14} />
            {ADMIN_ROLE_LABELS[role]}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: "var(--chayong-text-sub)",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            className="mt-1 rounded-lg border shadow-lg overflow-hidden"
            style={{
              borderColor: "var(--chayong-divider)",
              backgroundColor: "var(--chayong-bg)",
            }}
          >
            {ALL_ROLES.map((r) => {
              const Icon = ROLE_ICONS[r];
              const selected = r === role;
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors text-left"
                  style={{
                    backgroundColor: selected
                      ? "var(--chayong-primary-light, #EFF6FF)"
                      : "transparent",
                    color: selected
                      ? "var(--chayong-primary)"
                      : "var(--chayong-text-sub)",
                  }}
                >
                  <Icon size={14} />
                  {ADMIN_ROLE_LABELS[r]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 flex flex-col gap-0.5">
        {visibleNavItems.map(({ href, label, icon: Icon, exact }) => {
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
