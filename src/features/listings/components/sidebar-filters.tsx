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

const PAYMENT_PRESETS = [
  { label: "30만 이하", minPayment: 0, maxPayment: 30 },
  { label: "30~50만", minPayment: 30, maxPayment: 50 },
  { label: "50~70만", minPayment: 50, maxPayment: 70 },
  { label: "70만 이상", minPayment: 70, maxPayment: undefined },
] as const;

export function SidebarFilters({ brands }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = parseListingFilters(Object.fromEntries(sp.entries()));

  function update(patch: Partial<ListingFilters>) {
      router.push(buildListingUrl({ ...current, ...patch, page: 1 }));
  }

  const activeCount = countActiveFilters(current);
  const activeSummary = buildActiveSummary(current);
  const hasActiveFilters = activeCount > 0;

  return (
    <aside className="hidden w-[252px] shrink-0 lg:block">
      <div
        className="sticky top-[80px] overflow-hidden rounded-2xl border bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)]"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <div className="border-b px-3 py-3" style={{ borderColor: "var(--chayong-divider)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: "var(--chayong-text)" }}
              >
                상세 조건
              </p>
              <p
                className="mt-1 text-[11px] leading-tight"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                브랜드, 월납입, 연료, 변속기, 사고 이력을 빠르게 좁혀보세요.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums"
                style={{
                  backgroundColor: "var(--chayong-surface)",
                  color: "var(--chayong-text-sub)",
                }}
              >
                {activeCount}개 활성
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => router.push("/list")}
                  className="rounded-full px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-90"
                  style={{
                    color: "var(--chayong-primary)",
                    backgroundColor: "var(--chayong-surface)",
                  }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeSummary.length > 0 ? (
              activeSummary.map((item) => (
                <span
                  key={item}
                  className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight"
                  style={{
                    borderColor: "rgba(0, 0, 0, 0.06)",
                    backgroundColor: "var(--chayong-bg)",
                    color: "var(--chayong-text-sub)",
                  }}
                >
                  <span className="truncate">{item}</span>
                </span>
              ))
            ) : (
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]"
                style={{
                  borderColor: "rgba(0, 0, 0, 0.06)",
                  backgroundColor: "var(--chayong-bg)",
                  color: "var(--chayong-text-caption)",
                }}
              >
                조건을 선택하면 여기에서 한눈에 확인됩니다.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 p-3">
          <CollapsibleFieldSet legend="브랜드" defaultOpen>
            {brands.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {brands.slice(0, 8).map((b) => {
                  const checked = current.brand === b;
                  return (
                    <label
                      key={b}
                      className="flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-[12px] leading-tight transition-colors"
                      style={{
                        borderColor: checked
                          ? "var(--chayong-primary)"
                          : "var(--chayong-divider)",
                        backgroundColor: checked
                          ? "rgba(255, 255, 255, 0.96)"
                          : "var(--chayong-bg)",
                        color: checked
                          ? "var(--chayong-primary)"
                          : "var(--chayong-text)",
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={b}
                        checked={checked}
                        onChange={(e) =>
                          update({ brand: e.target.checked ? b : undefined })
                        }
                        className="h-3.5 w-3.5 shrink-0 rounded"
                      />
                      <span className="min-w-0 truncate">{b}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-lg border px-3 py-2 text-[12px] leading-tight"
                style={{
                  borderColor: "var(--chayong-divider)",
                  backgroundColor: "var(--chayong-bg)",
                  color: "var(--chayong-text-caption)",
                }}
              >
                아직 브랜드 목록이 없습니다.
              </div>
            )}
          </CollapsibleFieldSet>

          <CollapsibleFieldSet legend="월납입금" defaultOpen>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PAYMENT_PRESETS.map((preset) => {
                const isActive =
                  current.minPayment === preset.minPayment &&
                  current.maxPayment === preset.maxPayment;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      update(
                        isActive
                          ? { minPayment: undefined, maxPayment: undefined }
                          : {
                              minPayment: preset.minPayment,
                              maxPayment: preset.maxPayment,
                            }
                      )
                    }
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight transition-colors"
                    style={{
                      borderColor: isActive
                        ? "var(--chayong-primary)"
                        : "var(--chayong-divider)",
                      backgroundColor: isActive
                        ? "var(--chayong-primary)"
                        : "var(--chayong-bg)",
                      color: isActive ? "#ffffff" : "var(--chayong-text-sub)",
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <RangeInput
              min={current.minPayment}
              max={current.maxPayment}
              onChange={(mn, mx) => update({ minPayment: mn, maxPayment: mx })}
            />
          </CollapsibleFieldSet>

          <CollapsibleFieldSet legend="연료">
            <div className="space-y-1">
              {(["GASOLINE", "DIESEL", "HYBRID", "EV"] as const).map((f) => {
                const checked = current.fuel === f;
                return (
                  <label
                    key={f}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] leading-tight transition-colors"
                    style={{
                      backgroundColor: checked ? "var(--chayong-bg)" : "transparent",
                      color: checked ? "var(--chayong-primary)" : "var(--chayong-text)",
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={FUEL_LABEL[f]}
                      checked={checked}
                      onChange={(e) =>
                        update({ fuel: e.target.checked ? f : undefined })
                      }
                      className="h-3.5 w-3.5 shrink-0 rounded"
                    />
                    <span className="min-w-0 truncate">{FUEL_LABEL[f]}</span>
                  </label>
                );
              })}
            </div>
          </CollapsibleFieldSet>

          <CollapsibleFieldSet legend="변속기">
            <div className="space-y-1">
              {(["AUTO", "MANUAL"] as const).map((t) => {
                const checked = current.trans === t;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] leading-tight transition-colors"
                    style={{
                      backgroundColor: checked ? "var(--chayong-bg)" : "transparent",
                      color: checked ? "var(--chayong-primary)" : "var(--chayong-text)",
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={t === "AUTO" ? "자동" : "수동"}
                      checked={checked}
                      onChange={(e) =>
                        update({ trans: e.target.checked ? t : undefined })
                      }
                      className="h-3.5 w-3.5 shrink-0 rounded"
                    />
                    <span className="min-w-0 truncate">{t === "AUTO" ? "자동" : "수동"}</span>
                  </label>
                );
              })}
            </div>
          </CollapsibleFieldSet>

          <CollapsibleFieldSet legend="사고 이력">
            <div className="space-y-1">
              {(
                [
                  { n: 0, label: "무사고" },
                  { n: 1, label: "1회 이하" },
                  { n: 2, label: "2회 이하" },
                ] as const
              ).map(({ n, label }) => {
                const checked = current.accidentMax === n;
                return (
                  <label
                    key={n}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] leading-tight transition-colors"
                    style={{
                      backgroundColor: checked ? "var(--chayong-bg)" : "transparent",
                      color: checked ? "var(--chayong-primary)" : "var(--chayong-text)",
                    }}
                  >
                    <input
                      type="radio"
                      name="accident"
                      aria-label={label}
                      checked={checked}
                      onChange={() => update({ accidentMax: n })}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <span className="min-w-0 truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </CollapsibleFieldSet>
        </div>
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

function countActiveFilters(current: ListingFilters) {
  let count = 0;
  if (current.brand) count += 1;
  if (current.minPayment !== undefined || current.maxPayment !== undefined) count += 1;
  if (current.fuel) count += 1;
  if (current.trans) count += 1;
  if (current.accidentMax !== undefined) count += 1;
  return count;
}

function buildActiveSummary(current: ListingFilters) {
  const summary: string[] = [];
  if (current.brand) summary.push(`브랜드 · ${current.brand}`);
  if (current.minPayment !== undefined || current.maxPayment !== undefined) {
    summary.push(`월납입 · ${formatPaymentRange(current.minPayment, current.maxPayment)}`);
  }
  if (current.fuel) summary.push(`연료 · ${FUEL_LABEL[current.fuel]}`);
  if (current.trans) summary.push(`변속기 · ${current.trans === "AUTO" ? "자동" : "수동"}`);
  if (current.accidentMax !== undefined) {
    summary.push(
      `사고 · ${current.accidentMax === 0 ? "무사고" : `${current.accidentMax}회 이하`}`
    );
  }
  return summary;
}

function formatPaymentRange(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `${min}~${max}만`;
  if (min !== undefined) return `${min}만+`;
  if (max !== undefined) return `~${max}만`;
  return "전체";
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
      <span
        className="whitespace-nowrap text-xs"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        만원
      </span>
    </div>
  );
}
