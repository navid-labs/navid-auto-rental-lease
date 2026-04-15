"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "전체", value: "" },
  { label: "~50만원", value: "500000" },
  { label: "~100만원", value: "1000000" },
  { label: "100만원~", value: "1000000+" },
] as const;

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMax = searchParams.get("maxPayment") ?? "";

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "") {
      params.delete("maxPayment");
      params.delete("minPayment");
    } else if (value === "1000000+") {
      params.set("minPayment", "1000000");
      params.delete("maxPayment");
    } else {
      params.set("maxPayment", value);
      params.delete("minPayment");
    }

    router.push(`?${params.toString()}`);
  }

  // Derive active filter value from current params for highlight logic
  const minPayment = searchParams.get("minPayment") ?? "";
  function isActive(value: string): boolean {
    if (value === "") return activeMax === "" && minPayment === "";
    if (value === "1000000+") return minPayment === "1000000";
    return activeMax === value;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {FILTERS.map(({ label, value }) => {
        const active = isActive(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleFilter(value)}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[44px]"
            style={{
              backgroundColor: active
                ? "var(--chayong-primary)"
                : "var(--chayong-surface)",
              color: active
                ? "#ffffff"
                : "var(--chayong-text-sub)",
              border: `1px solid ${active ? "var(--chayong-primary)" : "var(--chayong-border)"}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
