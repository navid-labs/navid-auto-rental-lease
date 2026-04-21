"use client";

import { useEffect, useState } from "react";
import { CheckCircle, PlusCircle, MessageCircle } from "lucide-react";

export type LiveEvent = {
  id: string;
  text: string;
  type: "new-listing" | "escrow" | "consultation";
};

const ICONS = {
  "new-listing": PlusCircle,
  escrow: CheckCircle,
  consultation: MessageCircle,
} as const;

const DEFAULT_EVENTS: LiveEvent[] = [
  { id: "d1", text: "방금 BMW X3 매물이 등록되었어요", type: "new-listing" },
  { id: "d2", text: "에스크로 결제가 완료되었어요 (서울·K5)", type: "escrow" },
  { id: "d3", text: "잔여 14개월 매물이 상담 완료되었어요", type: "consultation" },
  { id: "d4", text: "제네시스 G80 승계 거래가 완료되었어요", type: "escrow" },
  { id: "d5", text: "신규 중고 렌트 3대가 큐레이션되었어요", type: "new-listing" },
];

interface Props {
  events?: LiveEvent[];
  intervalMs?: number;
}

export function LiveActivityFeed({ events = DEFAULT_EVENTS, intervalMs = 5000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [events.length, intervalMs]);

  if (events.length === 0) return null;
  const current = events[index];
  const Icon = ICONS[current.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-full border px-4 py-2.5 chayong-shadow-sm"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full chayong-icon-well"
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <p
        key={current.id}
        className="chayong-ticker-item truncate text-sm"
        style={{ color: "var(--chayong-text)" }}
      >
        {current.text}
      </p>
      <span
        className="ml-auto hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold md:inline-block"
        style={{
          backgroundColor: "var(--chayong-success)",
          color: "#FFFFFF",
        }}
      >
        LIVE
      </span>
    </div>
  );
}
