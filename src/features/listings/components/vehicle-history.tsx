interface VehicleHistoryProps {
  ownerCount: number;
  accidentCount: number;
}

interface HistoryItem {
  label: string;
  value: string;
  isDanger?: boolean;
}

function buildHistoryItems(ownerCount: number, accidentCount: number): HistoryItem[] {
  return [
    {
      label: "소유주 변경",
      value: `${ownerCount}회`,
    },
    {
      label: "사고 이력",
      value: accidentCount === 0 ? "없음" : `${accidentCount}회`,
      isDanger: accidentCount > 0,
    },
    {
      label: "침수 이력",
      value: "없음",
    },
    {
      label: "도난 이력",
      value: "없음",
    },
    {
      label: "전손 이력",
      value: "없음",
    },
    {
      label: "용도 변경",
      value: "없음",
    },
  ];
}

export function VehicleHistory({ ownerCount, accidentCount }: VehicleHistoryProps) {
  const items = buildHistoryItems(ownerCount, accidentCount);

  return (
    <section aria-label="차량 이력">
      <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
        차량 이력
      </h2>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <div className="divide-y" style={{ borderColor: "var(--chayong-divider)" }}>
          {items.map(({ label, value, isDanger }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                {label}
              </span>
              <span
                className={isDanger ? "text-sm font-semibold text-red-600" : "text-sm font-medium"}
                style={isDanger ? undefined : { color: "var(--chayong-text)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
