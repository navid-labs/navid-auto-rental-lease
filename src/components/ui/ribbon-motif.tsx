interface RibbonMotifProps {
  /** `hero` = large flowing ribbon behind hero; `divider` = thin wave between sections; `corner` = subtle corner accent */
  variant?: "hero" | "divider" | "corner";
  className?: string;
}

/**
 * 로고의 곡선 모티프를 추출한 장식용 SVG. `chayong-ribbon-bg` 래퍼와 함께 사용.
 * Primary + primary-wash 두 톤, 기본 opacity 0.35.
 * prefers-reduced-motion 사용자에게도 정적으로 그대로 렌더.
 */
export function RibbonMotif({ variant = "hero", className }: RibbonMotifProps) {
  if (variant === "hero") {
    return (
      <svg
        viewBox="0 0 1200 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-100 250 Q 300 100, 600 220 T 1300 180 L 1300 400 L -100 400 Z"
          fill="var(--chayong-primary-wash)"
          opacity="0.7"
        />
        <path
          d="M-100 300 Q 400 180, 700 280 T 1300 240"
          stroke="var(--chayong-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.18"
          fill="none"
        />
      </svg>
    );
  }

  if (variant === "divider") {
    return (
      <svg
        viewBox="0 0 1200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          d="M0 30 Q 300 0, 600 30 T 1200 30"
          stroke="var(--chayong-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
          fill="none"
        />
      </svg>
    );
  }

  // corner
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 100 Q 50 0, 100 50 T 200 30"
        stroke="var(--chayong-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.2"
        fill="none"
      />
    </svg>
  );
}
