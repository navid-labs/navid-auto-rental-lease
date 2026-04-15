export function StoryCards() {
  const stories = [
    {
      type: "승계",
      tag: "TRANSFER",
      headline: "잔여 8개월 BMW X3, 1,200만원 절약",
      body: "판매자 위약금 회피 + 구매자 초기비용 zero.",
    },
    {
      type: "중고리스",
      tag: "USED_LEASE",
      headline: "3년 된 제네시스, 월 45만원으로 시승",
      body: "신차 리스 대비 40% 저렴, 법인 세제 혜택.",
    },
    {
      type: "중고렌트",
      tag: "USED_RENTAL",
      headline: "짧은 계약 기간, 빠른 회전",
      body: "1년 이하 단기 계약 매물 전문 큐레이션.",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stories.map((s) => (
        <article key={s.type} className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold" style={{ color: "var(--chayong-primary)" }}>
            {s.type}
          </p>
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
