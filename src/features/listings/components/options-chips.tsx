import {
  getOptionLabel,
  groupOptions,
  type OptionGroup,
} from "@/lib/catalog/vehicle-options";

interface OptionsChipsProps {
  options: string[];
}

const GROUP_LABEL: Record<OptionGroup, string> = {
  convenience: "편의",
  safety: "안전",
  performance: "퍼포먼스",
  multimedia: "멀티미디어",
  interior: "내장",
  exterior: "외장",
};

export function OptionsChips({ options }: OptionsChipsProps) {
  if (options.length === 0) return null;

  const grouped = groupOptions(options);
  const activeGroups = (Object.keys(grouped) as OptionGroup[]).filter(
    (g) => grouped[g].length > 0,
  );
  const summaryGroups = [...activeGroups]
    .map((group) => ({
      group,
      label: GROUP_LABEL[group],
      count: grouped[group].length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const previewOptions = options.slice(0, 4).map((code) => getOptionLabel(code));

  if (activeGroups.length === 0) return null;

  return (
    <section aria-label="옵션">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text)",
            borderBottom: `1px solid var(--chayong-divider)`,
          }}
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-semibold">옵션 요약</span>
              <span style={{ color: "var(--chayong-text-sub)" }}>
                총 {options.length}개
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-4 text-xs">
              <div className="min-w-0">
                <p
                  className="mb-1 font-semibold uppercase tracking-wide"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  주요 그룹
                </p>
                <div className="flex flex-wrap gap-2">
                  {summaryGroups.map((item) => (
                    <span
                      key={item.group}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none"
                      style={{
                        backgroundColor: "var(--chayong-background)",
                        borderColor: "var(--chayong-border)",
                        color: "var(--chayong-text-sub)",
                      }}
                    >
                      {item.label} {item.count}개
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0">
                <p
                  className="mb-1 font-semibold uppercase tracking-wide"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  핵심 옵션
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewOptions.map((label) => (
                    <span
                      key={label}
                      className="inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight break-keep whitespace-normal"
                      style={{
                        backgroundColor: "var(--chayong-background)",
                        borderColor: "var(--chayong-border)",
                        color: "var(--chayong-text-sub)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y" style={{ borderColor: "var(--chayong-divider)" }}>
          {activeGroups.map((group) => (
            <div key={group} className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span style={{ color: "var(--chayong-text-caption)" }}>
                  {GROUP_LABEL[group]}
                </span>
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal"
                  style={{
                    backgroundColor: "var(--chayong-background)",
                    borderColor: "var(--chayong-border)",
                    color: "var(--chayong-text-sub)",
                  }}
                >
                  {grouped[group].length}개
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grouped[group].map((opt) => (
                  <span
                    key={opt.code}
                    className="inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-tight break-keep whitespace-normal"
                    style={{
                      backgroundColor: "var(--chayong-background)",
                      color: "var(--chayong-text-sub)",
                      border: "1px solid var(--chayong-border)",
                    }}
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
