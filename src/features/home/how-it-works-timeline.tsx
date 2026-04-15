export function HowItWorksTimeline() {
  const steps = [
    {
      n: 1,
      title: "매물 탐색",
      body: "원하는 승계/리스/렌트 매물을 검색하고 월납입금을 비교.",
    },
    {
      n: 2,
      title: "상담 신청",
      body: "관심 매물에 상담 신청 → 연락처 차단 채팅으로 안전 대화.",
    },
    {
      n: 3,
      title: "에스크로 결제",
      body: "토스페이먼츠 에스크로로 안전하게 대금 보호.",
    },
    {
      n: 4,
      title: "계약 완료",
      body: "명의 이전 완료 후 에스크로 자동 해제.",
    },
  ];
  return (
    <ol
      className="relative space-y-6 border-l-2 pl-6"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      {steps.map((s) => (
        <li key={s.n} className="relative">
          <span
            className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums text-white"
            style={{ background: "var(--chayong-primary)" }}
          >
            {s.n}
          </span>
          <h3 className="text-base font-bold">{s.title}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
