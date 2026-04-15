"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  buildListingUrl,
  parseListingFilters,
  type ListingFilters,
} from "@/lib/listings/filters";

const FUEL_LABEL: Record<string, string> = {
  GASOLINE: "가솔린",
  DIESEL: "디젤",
  HYBRID: "하이브리드",
  EV: "전기",
};

interface Props {
  brands: string[];
}

export function SidebarFilters({ brands }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = parseListingFilters(Object.fromEntries(sp.entries()));

  function update(patch: Partial<ListingFilters>) {
    router.push(buildListingUrl({ ...current, ...patch, page: 1 }));
  }

  const hasActiveFilters = current.brand || current.fuel || current.trans || current.accidentMax !== undefined || current.minPayment || current.maxPayment;

  return (
    <aside className="hidden w-[240px] shrink-0 lg:block">
      <div className="sticky top-[80px] space-y-1 rounded-xl border bg-white p-3">
        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push("/list")}
            className="mb-2 w-full rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ color: "var(--chayong-primary)" }}
          >
            필터 초기화
          </button>
        )}

        <CollapsibleFieldSet legend="브랜드" defaultOpen>
          {brands.slice(0, 8).map((b) => (
            <label key={b} className="flex items-center gap-2 py-0.5 text-[13px]">
              <input
                type="checkbox"
                aria-label={b}
                checked={current.brand === b}
                onChange={(e) =>
                  update({ brand: e.target.checked ? b : undefined })
                }
                className="h-3.5 w-3.5 rounded"
              />
              {b}
            </label>
          ))}
        </CollapsibleFieldSet>

        <CollapsibleFieldSet legend="월납입금" defaultOpen>
          <RangeInput
            min={current.minPayment}
            max={current.maxPayment}
            onChange={(mn, mx) => update({ minPayment: mn, maxPayment: mx })}
          />
        </CollapsibleFieldSet>

        <CollapsibleFieldSet legend="연료">
          {(["GASOLINE", "DIESEL", "HYBRID", "EV"] as const).map((f) => (
            <label key={f} className="flex items-center gap-2 py-0.5 text-[13px]">
              <input
                type="checkbox"
                aria-label={FUEL_LABEL[f]}
                checked={current.fuel === f}
                onChange={(e) =>
                  update({ fuel: e.target.checked ? f : undefined })
                }
                className="h-3.5 w-3.5 rounded"
              />
              {FUEL_LABEL[f]}
            </label>
          ))}
        </CollapsibleFieldSet>

        <CollapsibleFieldSet legend="변속기">
          {(["AUTO", "MANUAL"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 py-0.5 text-[13px]">
              <input
                type="checkbox"
                aria-label={t === "AUTO" ? "자동" : "수동"}
                checked={current.trans === t}
                onChange={(e) =>
                  update({ trans: e.target.checked ? t : undefined })
                }
                className="h-3.5 w-3.5 rounded"
              />
              {t === "AUTO" ? "자동" : "수동"}
            </label>
          ))}
        </CollapsibleFieldSet>

        <CollapsibleFieldSet legend="사고 이력">
          {(
            [
              { n: 0, label: "무사고" },
              { n: 1, label: "1회 이하" },
              { n: 2, label: "2회 이하" },
            ] as const
          ).map(({ n, label }) => (
            <label key={n} className="flex items-center gap-2 py-0.5 text-[13px]">
              <input
                type="radio"
                name="accident"
                aria-label={label}
                checked={current.accidentMax === n}
                onChange={() => update({ accidentMax: n })}
                className="h-3.5 w-3.5"
              />
              {label}
            </label>
          ))}
        </CollapsibleFieldSet>
      </div>
    </aside>
  );
}

function CollapsibleFieldSet({
  legend,
  defaultOpen = false,
  children,
}: {
  legend: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <fieldset className="border-t py-2" style={{ borderColor: "var(--chayong-divider)" }}>
      <legend className="sr-only">{legend}</legend>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-[13px] font-semibold"
        style={{ color: "var(--chayong-text)" }}
      >
        {legend}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--chayong-text-caption)" }}
        />
      </button>
      {open && <div className="mt-1.5">{children}</div>}
    </fieldset>
  );
}

function RangeInput({
  min,
  max,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange: (mn?: number, mx?: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        placeholder="최소"
        value={min ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value ? Number(e.target.value) : undefined,
            max
          )
        }
        className="h-8 w-full rounded-lg border px-2 text-xs"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
        }}
      />
      <span className="text-xs text-[var(--chayong-text-sub)]">~</span>
      <input
        type="number"
        placeholder="최대"
        value={max ?? ""}
        onChange={(e) =>
          onChange(
            min,
            e.target.value ? Number(e.target.value) : undefined
          )
        }
        className="h-8 w-full rounded-lg border px-2 text-xs"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
        }}
      />
      <span className="whitespace-nowrap text-xs" style={{ color: "var(--chayong-text-caption)" }}>만원</span>
    </div>
  );
}
