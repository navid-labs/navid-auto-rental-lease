export function TrustStripe() {
  const items = [
    { value: "1,280", unit: "건", label: "누적 승계" },
    { value: "100", unit: "%", label: "에스크로 보호" },
    { value: "320", unit: "만원", label: "평균 절약" },
    { value: "24", unit: "시간", label: "응답 속도" },
  ];
  return (
    <section aria-label="신뢰 지표" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border bg-white p-4">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--chayong-primary)" }}
          >
            {it.value}
            <span className="ml-1 text-base">{it.unit}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
            {it.label}
          </p>
        </div>
      ))}
    </section>
  );
}
