function TransferIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--chayong-primary)" opacity="0.1" />
      <path d="M12 18h12m0 0-4-4m4 4-4 4" stroke="var(--chayong-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 24H16m0 0 4 4m-4-4 4-4" stroke="var(--chayong-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

function LeaseIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--chayong-primary)" opacity="0.1" />
      <rect x="12" y="10" width="16" height="20" rx="2" stroke="var(--chayong-primary)" strokeWidth="2" />
      <path d="M16 16h8M16 20h8M16 24h4" stroke="var(--chayong-primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function RentalIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--chayong-primary)" opacity="0.1" />
      <circle cx="20" cy="20" r="9" stroke="var(--chayong-primary)" strokeWidth="2" />
      <path d="M20 14v6l4 3" stroke="var(--chayong-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => React.ReactNode> = {
  TRANSFER: TransferIcon,
  USED_LEASE: LeaseIcon,
  USED_RENTAL: RentalIcon,
};

export function StoryCards() {
  const stories = [
    {
      type: "승계",
      tag: "TRANSFER",
      icon: "🔄",
      headline: "잔여 8개월 BMW X3, 1,200만원 절약",
      body: "판매자 위약금 회피 + 구매자 초기비용 zero.",
    },
    {
      type: "중고리스",
      tag: "USED_LEASE",
      icon: "📋",
      headline: "3년 된 제네시스, 월 45만원으로 시승",
      body: "신차 리스 대비 40% 저렴, 법인 세제 혜택.",
    },
    {
      type: "중고렌트",
      tag: "USED_RENTAL",
      icon: "🚗",
      headline: "짧은 계약 기간, 빠른 회전",
      body: "1년 이하 단기 계약 매물 전문 큐레이션.",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stories.map((s) => (
        <article
          key={s.type}
          className="rounded-2xl border bg-white p-5 chayong-shadow-sm chayong-hover-lift"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xs font-semibold" style={{ color: "var(--chayong-primary)" }}>
              {s.type}
            </p>
          </div>
          <h3
            className="mt-2 text-lg font-bold"
            style={{ textWrap: "balance" as const }}
          >
            {s.headline}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
            {s.body}
          </p>
        </article>
      ))}
    </div>
  );
}
