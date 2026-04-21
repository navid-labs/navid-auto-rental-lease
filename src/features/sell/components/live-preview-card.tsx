"use client";

interface LivePreviewProps {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  monthlyPayment?: number;
  initialCost?: number;
  remainingMonths?: number;
}

const fmt = (n?: number) =>
  n === undefined ? "—" : n.toLocaleString("ko-KR");

const fmtManwon = (krw?: number) => {
  if (krw === undefined) return "—";
  return `${Math.round(krw / 10_000).toLocaleString("ko-KR")}만원`;
};

export function LivePreviewCard({
  brand,
  model,
  year,
  mileage,
  monthlyPayment,
  initialCost,
  remainingMonths,
}: LivePreviewProps) {
  const vehicleName = [brand, model].filter(Boolean).join(" ") || "차량 정보를 입력해주세요";
  const hasPayment = monthlyPayment !== undefined && monthlyPayment > 0;

  return (
    <aside
      aria-label="매물 미리보기"
      className="rounded-2xl border p-5 chayong-shadow-md"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--chayong-primary)" }}
        >
          실시간 미리보기
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: "var(--chayong-primary-soft)",
            color: "var(--chayong-primary)",
          }}
        >
          LIVE
        </span>
      </div>

      <div
        className="mb-3 aspect-[4/3] w-full rounded-xl"
        style={{ backgroundColor: "var(--chayong-surface)" }}
        aria-hidden="true"
      />

      <h3 className="text-base font-bold" style={{ color: "var(--chayong-text)" }}>
        {vehicleName}
      </h3>

      <p
        className="mt-0.5 text-xs chayong-tabular-nums"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        {year ? `${year}년식` : "—"} · {mileage ? `${fmt(mileage)}km` : "주행거리 미입력"}
      </p>

      <div
        className="my-3 h-px"
        style={{ backgroundColor: "var(--chayong-divider)" }}
      />

      <div className="space-y-1.5">
        <Row
          label="월 납입금"
          value={hasPayment ? `월 ${fmtManwon(monthlyPayment)}` : "—"}
          emphasize
        />
        <Row label="초기 비용" value={fmtManwon(initialCost)} />
        <Row
          label="잔여 기간"
          value={remainingMonths !== undefined ? `${remainingMonths}개월` : "—"}
        />
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--chayong-text-caption)" }}>{label}</span>
      <span
        className={`font-semibold chayong-tabular-nums ${emphasize ? "text-base" : ""}`}
        style={{
          color: emphasize
            ? "var(--chayong-primary)"
            : "var(--chayong-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
