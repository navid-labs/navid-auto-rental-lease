"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ListingSort } from "@/lib/listings/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: "newest", label: "최신순" },
  { value: "price_asc", label: "월납입금 낮은순" },
  { value: "price_desc", label: "월납입금 높은순" },
  { value: "year_desc", label: "연식 최신순" },
  { value: "mileage_asc", label: "주행거리 짧은순" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentSort} onValueChange={handleChange}>
      <SelectTrigger
        className="h-10 rounded-xl border chayong-focus-ring"
        style={{
          borderColor: "var(--chayong-border)",
          backgroundColor: "var(--chayong-bg)",
          color: "var(--chayong-text)",
        }}
        aria-label="정렬 기준"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
