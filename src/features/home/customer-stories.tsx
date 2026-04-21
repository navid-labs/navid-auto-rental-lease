interface Story {
  initial: string;
  name: string;
  role: string;
  quote: string;
  vehicle: string;
  savings: string;
  bgColor: string;
}

const STORIES: Story[] = [
  {
    initial: "김",
    name: "김O진 님",
    role: "IT 개발자, 서울",
    quote: "신차 리스 대비 월 40만원 아끼고 BMW를 탔어요. 에스크로 덕분에 마음 놓였습니다.",
    vehicle: "BMW 320i · 잔여 18개월",
    savings: "월 42만원 절감",
    bgColor: "#FFB6A0",
  },
  {
    initial: "박",
    name: "박O수 님",
    role: "스타트업 대표, 성남",
    quote: "법인 중고 리스 세제 혜택 덕분에 현금 흐름이 훨씬 여유로워졌어요.",
    vehicle: "제네시스 G80 · 중고 리스 36개월",
    savings: "월 58만원 절감",
    bgColor: "#A5C8FF",
  },
  {
    initial: "이",
    name: "이O영 님",
    role: "프리랜서, 부산",
    quote: "단기 렌트로 비용 부담 없이 신형 전기차를 6개월 써봤습니다.",
    vehicle: "아이오닉 5 · 중고 렌트 6개월",
    savings: "초기비용 0원",
    bgColor: "#B5E3B5",
  },
];

export function CustomerStories() {
  return (
    <section aria-label="고객 이야기">
      <div className="mb-4 flex items-end justify-between md:mb-6">
        <h2
          className="text-xl font-bold md:text-2xl"
          style={{ color: "var(--chayong-text)" }}
        >
          실제로 이렇게 절약했어요
        </h2>
        <p className="text-xs md:text-sm" style={{ color: "var(--chayong-text-sub)" }}>
          차용 사용자 인터뷰
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {STORIES.map((s) => (
          <article
            key={s.name}
            className="flex flex-col rounded-2xl border p-5 chayong-hover-lift"
            style={{
              borderColor: "var(--chayong-border)",
              backgroundColor: "var(--chayong-bg)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: s.bgColor }}
                aria-hidden="true"
              >
                {s.initial}
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--chayong-text)" }}
                >
                  {s.name}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {s.role}
                </p>
              </div>
            </div>
            <blockquote
              className="mt-4 flex-1 text-sm leading-relaxed"
              style={{ color: "var(--chayong-text-sub)" }}
            >
              &ldquo;{s.quote}&rdquo;
            </blockquote>
            <div
              className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-[11px]"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <span style={{ color: "var(--chayong-text-caption)" }}>{s.vehicle}</span>
              <span
                className="font-semibold chayong-tabular-nums"
                style={{ color: "var(--chayong-success)" }}
              >
                {s.savings}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
