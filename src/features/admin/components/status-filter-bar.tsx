import Link from "next/link";
import { toURLSearchParams } from "@/lib/api/pagination";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  current?: string;
  basePath: string;
  /** 보존할 추가 파라미터 — page는 내부에서 자동 제외 */
  preserveParams?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  value: string | undefined,
  preserveParams: Record<string, string | undefined>
): string {
  // page는 항상 드롭 (필터 변경 시 1페이지 리셋)
  const { page: _page, ...rest } = preserveParams;
  void _page;
  const params = toURLSearchParams({
    ...rest,
    status: value,
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function StatusFilterBar({
  options,
  current,
  basePath,
  preserveParams = {},
}: Props) {
  const chips = [
    { value: undefined as string | undefined, label: "전체" },
    ...options.map((o) => ({
      value: o.value as string | undefined,
      label: o.label,
    })),
  ];

  return (
    <div className="flex gap-2 flex-wrap pb-4" role="group" aria-label="상태 필터">
      {chips.map((chip) => {
        const active = chip.value === current || (chip.value === undefined && !current);
        return (
          <Link
            key={chip.value ?? "__all__"}
            href={buildHref(basePath, chip.value, preserveParams)}
            aria-pressed={active}
            className="text-sm px-3 py-1.5 rounded-full border transition-colors"
            style={{
              borderColor: active ? "var(--chayong-primary)" : "var(--chayong-divider)",
              backgroundColor: active
                ? "var(--chayong-primary-light)"
                : "var(--chayong-bg)",
              color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
