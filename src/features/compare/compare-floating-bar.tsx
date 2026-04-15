"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useVehicleInteractionStore } from "@/lib/stores/vehicle-interaction-store";

export function CompareFloatingBar() {
  const comparison = useVehicleInteractionStore((s) => s.comparison);
  const removeFromComparison = useVehicleInteractionStore((s) => s.removeFromComparison);
  const clearComparison = useVehicleInteractionStore((s) => s.clearComparison);

  if (comparison.length === 0) return null;

  const ids = comparison.map((v) => v.id).join(",");

  return (
    <div
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl md:bottom-6"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      <div className="flex gap-2">
        {comparison.map((v) => (
          <div key={v.id} className="relative">
            <div className="h-12 w-16 overflow-hidden rounded-lg bg-[var(--chayong-surface)]">
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt={`${v.brandName} ${v.modelName}`}
                  width={64}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[10px]"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {v.brandName}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeFromComparison(v.id)}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-white"
              aria-label={`${v.brandName} ${v.modelName} 비교 제거`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - comparison.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-12 w-16 items-center justify-center rounded-lg border-2 border-dashed"
            style={{ borderColor: "var(--chayong-border)" }}
          >
            <span className="text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
              +
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/compare?ids=${ids}`}
          className="inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {comparison.length}대 비교
        </Link>
        <button
          type="button"
          onClick={clearComparison}
          className="text-xs underline"
          style={{ color: "var(--chayong-text-caption)" }}
        >
          초기화
        </button>
      </div>
    </div>
  );
}
