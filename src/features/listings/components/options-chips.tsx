import { groupOptions, type OptionGroup } from "@/lib/catalog/vehicle-options";

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

  if (activeGroups.length === 0) return null;

  return (
    <section aria-label="옵션">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div
          className="px-4 py-3 text-sm font-semibold"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text)",
            borderBottom: `1px solid var(--chayong-divider)`,
          }}
        >
          옵션 ({options.length}개)
        </div>

        <div className="flex flex-col divide-y" style={{ borderColor: "var(--chayong-divider)" }}>
          {activeGroups.map((group) => (
            <div key={group} className="px-4 py-3">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--chayong-text-caption)" }}
              >
                {GROUP_LABEL[group]}
              </p>
              <div className="flex flex-wrap gap-2">
                {grouped[group].map((opt) => (
                  <span
                    key={opt.code}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--chayong-surface)",
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
