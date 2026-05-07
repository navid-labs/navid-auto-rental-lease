interface VehicleHistoryProps {
  ownerCount: number;
  accidentCount: number;
}

interface HistoryItem {
  label: string;
  value: string;
  tone: "neutral" | "success" | "accent" | "danger";
  note: string;
}

interface SummaryChip {
  label: string;
  tone: "neutral" | "success" | "accent" | "danger";
}

function buildSummaryChips(ownerCount: number, accidentCount: number): SummaryChip[] {
  const hasSingleOwner = ownerCount <= 1;
  const accidentFree = accidentCount === 0;

  return [
    {
      label: hasSingleOwner ? "소유 1인" : "소유 다인",
      tone: hasSingleOwner ? "success" : "accent",
    },
    {
      label: accidentFree ? "무사고" : `사고 ${accidentCount}회`,
      tone: accidentFree ? "success" : "danger",
    },
    {
      label: accidentFree ? "특이 이력 없음" : "사고 이력 확인 필요",
      tone: accidentFree ? "success" : "danger",
    },
  ];
}

function buildHistoryItems(ownerCount: number, accidentCount: number): HistoryItem[] {
  const hasSingleOwner = ownerCount <= 1;
  const accidentFree = accidentCount === 0;

  return [
    {
      label: "소유",
      value: hasSingleOwner ? "1인" : "다인",
      tone: hasSingleOwner ? "success" : "accent",
      note: hasSingleOwner ? "단일 소유 이력" : "소유자 변경 이력 확인",
    },
    {
      label: "사고",
      value: accidentFree ? "0회" : `${accidentCount}회`,
      tone: accidentFree ? "success" : "danger",
      note: accidentFree ? "사고 기록 없음" : "사고 이력 확인 필요",
    },
    {
      label: "침수 이력",
      value: "없음",
      tone: "success",
      note: "침수 기록 없음",
    },
    {
      label: "도난 이력",
      value: "없음",
      tone: "success",
      note: "도난 기록 없음",
    },
    {
      label: "전손 이력",
      value: "없음",
      tone: "success",
      note: "전손 기록 없음",
    },
    {
      label: "용도변경",
      value: "확인 완료",
      tone: "success",
      note: "용도 변경 이력 없음",
    },
  ];
}

const CHIP_TONE_CLASSES: Record<SummaryChip["tone"], string> = {
  neutral:
    "border-[color:var(--chayong-border)] bg-[color:var(--chayong-surface)] text-[color:var(--chayong-text-caption)]",
  success:
    "border-[color:color-mix(in_srgb,var(--chayong-success)_24%,white)] bg-[color:color-mix(in_srgb,var(--chayong-success)_10%,white)] text-[color:var(--chayong-success)]",
  accent:
    "border-[color:color-mix(in_srgb,var(--chayong-primary)_24%,white)] bg-[color:color-mix(in_srgb,var(--chayong-primary)_10%,white)] text-[color:var(--chayong-primary)]",
  danger:
    "border-red-200 bg-red-50 text-red-600",
};

const ITEM_TONE_CLASSES: Record<HistoryItem["tone"], string> = {
  neutral: "border-[color:var(--chayong-border)] bg-white",
  success:
    "border-[color:color-mix(in_srgb,var(--chayong-success)_24%,white)] bg-[color:color-mix(in_srgb,var(--chayong-success)_8%,white)]",
  accent:
    "border-[color:color-mix(in_srgb,var(--chayong-primary)_24%,white)] bg-[color:color-mix(in_srgb,var(--chayong-primary)_8%,white)]",
  danger: "border-red-200 bg-red-50",
};

const VALUE_TONE_CLASSES: Record<HistoryItem["tone"], string> = {
  neutral: "text-[color:var(--chayong-text)]",
  success: "text-[color:var(--chayong-success)]",
  accent: "text-[color:var(--chayong-primary)]",
  danger: "text-red-600",
};

export function VehicleHistory({ ownerCount, accidentCount }: VehicleHistoryProps) {
  const summaryChips = buildSummaryChips(ownerCount, accidentCount);
  const items = buildHistoryItems(ownerCount, accidentCount);

  return (
    <section aria-label="차량 이력" className="space-y-3">
      <div className="space-y-2">
        <h2 className="text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
          차량 이력
        </h2>
        <div className="flex flex-wrap gap-2">
          {summaryChips.map(({ label, tone }) => (
            <span
              key={label}
              className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[11px] font-semibold leading-none ${CHIP_TONE_CLASSES[tone]}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border bg-[color:var(--chayong-surface)]"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div className="grid gap-px bg-[color:var(--chayong-divider)] sm:grid-cols-2">
          {items.map(({ label, value, tone, note }) => (
            <div
              key={label}
              className={`flex min-w-0 flex-col gap-2 p-4 sm:p-5 ${ITEM_TONE_CLASSES[tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="shrink-0 text-xs font-medium leading-5"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {label}
                </span>
                <span
                  className={`min-w-0 text-right text-sm font-semibold leading-5 break-words ${VALUE_TONE_CLASSES[tone]}`}
                >
                  {value}
                </span>
              </div>
              <p
                className="min-w-0 text-sm leading-5 break-words"
                style={{ color: "var(--chayong-text-sub)" }}
              >
                {note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
