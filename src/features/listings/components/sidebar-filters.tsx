"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  buildListingUrl,
  parseListingFilters,
  type ListingFilters,
} from "@/lib/listings/filters";

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

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-[80px] space-y-6 rounded-xl border bg-white p-4">
        <FieldSet legend="브랜드">
          {brands.slice(0, 10).map((b) => (
            <label key={b} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                aria-label={b}
                checked={current.brand === b}
                onChange={(e) =>
                  update({ brand: e.target.checked ? b : undefined })
                }
              />
              {b}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="월납입금 (만원)">
          <RangeInput
            min={current.minPayment}
            max={current.maxPayment}
            onChange={(mn, mx) => update({ minPayment: mn, maxPayment: mx })}
          />
        </FieldSet>

        <FieldSet legend="연료">
          {(["GASOLINE", "DIESEL", "HYBRID", "EV"] as const).map((f) => (
            <label key={f} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                aria-label={f}
                checked={current.fuel === f}
                onChange={(e) =>
                  update({ fuel: e.target.checked ? f : undefined })
                }
              />
              {f}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="변속기">
          {(["AUTO", "MANUAL"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                aria-label={t === "AUTO" ? "자동" : "수동"}
                checked={current.trans === t}
                onChange={(e) =>
                  update({ trans: e.target.checked ? t : undefined })
                }
              />
              {t === "AUTO" ? "자동" : "수동"}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="사고 이력">
          {(
            [
              { n: 0, label: "무사고" },
              { n: 1, label: "1회 이하" },
              { n: 2, label: "2회 이하" },
            ] as const
          ).map(({ n, label }) => (
            <label key={n} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="radio"
                name="accident"
                aria-label={label}
                checked={current.accidentMax === n}
                onChange={() => update({ accidentMax: n })}
              />
              {label}
            </label>
          ))}
        </FieldSet>
      </div>
    </aside>
  );
}

function FieldSet({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div>{children}</div>
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
    <div className="flex items-center gap-2">
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
        className="h-10 w-full rounded-lg border px-2 text-sm"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
        }}
      />
      <span className="text-sm text-[var(--chayong-text-sub)]">-</span>
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
        className="h-10 w-full rounded-lg border px-2 text-sm"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
        }}
      />
    </div>
  );
}
