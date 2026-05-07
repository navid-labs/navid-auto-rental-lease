import { Zap } from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type QuickTransferBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

export function QuickTransferBadge({
  size = "md",
  className,
}: QuickTransferBadgeProps): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-[var(--chayong-primary)] font-semibold leading-none text-white shadow-sm",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Zap
        aria-hidden="true"
        className={cn(size === "sm" ? "mr-0.5 h-2.5 w-2.5" : "mr-1 h-3 w-3")}
      />
      빠른승계
    </span>
  );
}
