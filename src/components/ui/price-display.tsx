const SIZE_CLASSES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
} as const;

interface PriceDisplayProps {
  monthlyPayment: number;
  size?: keyof typeof SIZE_CLASSES;
}

export function PriceDisplay({ monthlyPayment, size = "md" }: PriceDisplayProps) {
  const formatted = monthlyPayment.toLocaleString("ko-KR");

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 font-bold ${SIZE_CLASSES[size]}`}
      style={{ color: "var(--chayong-primary)" }}
    >
      <span className="text-sm font-medium">월</span>
      {formatted}
      <span className="text-sm font-medium">원</span>
    </span>
  );
}
