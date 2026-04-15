"use client";

import Link from "next/link";
import type { ActionCardData } from "@/types/admin";

interface ActionCardProps {
  data: ActionCardData;
}

export function ActionCard({ data }: ActionCardProps) {
  const { label, value, icon: Icon, color, bg, href, urgent } = data;
  const showBadge = urgent && value > 0;
  const badgeCount = value > 9 ? "9+" : String(value);

  return (
    <Link
      href={href}
      className="relative block rounded-xl p-5 border transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: "var(--chayong-bg)",
        borderColor: "var(--chayong-divider)",
      }}
    >
      {/* Urgent badge */}
      {showBadge && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white px-1"
          style={{ backgroundColor: "var(--chayong-danger, #F04452)" }}
        >
          {badgeCount}
        </span>
      )}

      {/* Icon */}
      <div className="mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bg, color }}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Value */}
      <p
        className="text-3xl font-bold mb-1"
        style={{ color: "var(--chayong-text)" }}
      >
        {value.toLocaleString()}
      </p>

      {/* Label */}
      <p className="text-sm" style={{ color: "var(--chayong-text-caption, #8B95A1)" }}>
        {label}
      </p>
    </Link>
  );
}
