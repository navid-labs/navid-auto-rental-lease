import { ShieldCheck } from "lucide-react";

interface TrustBadgeProps {
  variant?: "default" | "compact";
}

export function TrustBadge({ variant = "default" }: TrustBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: "var(--chayong-success)" }}
    >
      <ShieldCheck size={isCompact ? 11 : 13} strokeWidth={2.5} />
      {isCompact ? "안심" : "안심매물"}
    </span>
  );
}
