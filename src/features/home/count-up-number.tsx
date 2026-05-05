"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpNumberProps {
  target: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => n.toLocaleString("ko-KR");

export function CountUpNumber({
  target,
  duration = 800,
  format = defaultFormat,
  className,
}: CountUpNumberProps) {
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  });
  const [value, setValue] = useState(() =>
    prefersReducedMotion ? target : 0,
  );
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    started.current = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {format(prefersReducedMotion ? target : value)}
    </span>
  );
}
