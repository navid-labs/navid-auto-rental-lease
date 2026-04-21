# 차용 퍼블릭 페이지 디자인 증강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home / List / Detail / Sell 페이지에 motion, 사회적 증거, 인터랙티브 요소를 증분 추가해 "밋밋한" 느낌 제거.

**Architecture:** 기존 컴포넌트 구조 유지, 신규 기능만 추가. React 19 Server Components는 그대로, 애니메이션/인터랙션 필요 시점만 `"use client"` 경계 신설. 새 컴포넌트는 `src/features/home/`, `src/components/ui/`에 배치. 디자인 시스템 토큰은 Phase 1에서 이미 `src/app/globals.css`에 추가 완료.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind 4 + shadcn/ui, lucide-react, vitest, Playwright.

---

## 관련 Spec

`docs/superpowers/specs/2026-04-21-public-pages-design-enhancement-design.md`

## 범위

- Phase 1 — 디자인 시스템 토큰 확장 ✅ (완료)
- Phase 2 — Home (2.0 ~ 2.7)
- Phase 3 — List (3.1 ~ 3.4)
- Phase 4 — Detail (4.1 ~ 4.3)
- Phase 5 — Sell (5.1 ~ 5.3)

---

## File Structure

### Phase 2 — Home
- Modify: `src/app/globals.css` — 타이포 balance 추가
- Modify: `src/app/(public)/page.tsx` — Hero 보강, RibbonMotif 적용, 신규 섹션 2종 삽입
- Modify: `src/features/home/trust-stripe.tsx` — client 전환 + count-up
- Create: `src/features/home/count-up-number.tsx` — 재사용 count-up 컴포넌트
- Create: `src/features/home/count-up-number.test.tsx`
- Create: `src/features/home/live-activity-feed.tsx` — 티커
- Create: `src/features/home/live-activity-feed.test.tsx`
- Create: `src/features/home/cost-calculator-home.tsx` — Home용 계산기
- Create: `src/features/home/cost-calculator-home.test.tsx`
- Create: `src/features/home/customer-stories.tsx` — 사용자 인용 카드
- Create: `src/components/ui/ribbon-motif.tsx` — 재사용 SVG 리본
- Modify: `src/features/home/story-cards.tsx` — hover-lift 적용

### Phase 3 — List
- Modify: `src/features/listings/components/sidebar-filters.tsx` — sticky 확인/보강
- Modify: `src/features/listings/components/result-meta.tsx` — count 애니메이션
- Modify: `src/features/listings/components/sort-select.tsx` — 폴리시 (있으면)
- Modify: `src/app/(public)/list/page.tsx` — 브랜드 칩 스크롤

### Phase 4 — Detail
- Modify: `src/app/(public)/detail/[id]/page.tsx` — ESCROW_STEPS 5-step
- Modify: `src/features/listings/components/listing-cta-sidebar.tsx` — shadow-float 적용

### Phase 5 — Sell
- Create: `src/features/sell/components/live-preview-card.tsx`
- Modify: `src/features/sell/components/sell-wizard.tsx` — 프리뷰 카드 연동

---

## Phase 2 — Home

### Task 2.0.1: 전역 Heading text-wrap: balance

**Files:**
- Modify: `src/app/globals.css` (지금은 `@layer base`에 h1~h4 letter-spacing만 존재)

- [ ] **Step 1: 변경 전 상태 확인**

Run: `grep -n "letter-spacing: -0.02em" src/app/globals.css`
Expected: 1 match around line 110.

- [ ] **Step 2: Heading 규칙에 text-wrap balance 추가**

`src/app/globals.css`의 `h1, h2, h3, h4` 블록을 다음으로 교체:

```css
  h1, h2, h3, h4 {
    letter-spacing: -0.02em;
    line-height: 1.3;
    text-wrap: balance;
  }
```

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | tail -5`
Expected: exit 0, no CSS warnings.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "style(design): add text-wrap balance to headings for Korean wrap fix"
```

---

### Task 2.5.1: RibbonMotif SVG 컴포넌트 생성

우선 RibbonMotif부터 생성 (다른 Phase 2 작업이 의존).

**Files:**
- Create: `src/components/ui/ribbon-motif.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `src/components/ui/ribbon-motif.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ribbon-motif.tsx
git commit -m "feat(ui): add RibbonMotif SVG (hero/divider/corner variants)"
```

---

### Task 2.1.1: CountUpNumber 재사용 컴포넌트

**Files:**
- Create: `src/features/home/count-up-number.tsx`
- Create: `src/features/home/count-up-number.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/home/count-up-number.test.tsx`:

```tsx
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CountUpNumber } from "./count-up-number";

describe("CountUpNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock IntersectionObserver to trigger immediately
    globalThis.IntersectionObserver = class MockIO {
      cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe() {
        // Trigger intersection immediately
        setTimeout(() => {
          this.cb(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }, 0);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds = [];
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at 0 before intersecting", () => {
    render(<CountUpNumber target={1280} duration={800} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("animates to target after intersection", async () => {
    render(<CountUpNumber target={100} duration={400} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("formats numbers with commas by default", async () => {
    render(<CountUpNumber target={1280} duration={200} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText("1,280")).toBeInTheDocument();
  });

  it("respects prefers-reduced-motion by rendering target immediately", () => {
    const mql = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
    render(<CountUpNumber target={999} duration={800} />);
    expect(screen.getByText("999")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test count-up-number -- --run 2>&1 | tail -20`
Expected: FAIL with "Cannot find module './count-up-number'" or similar.

- [ ] **Step 3: 컴포넌트 구현**

Create `src/features/home/count-up-number.tsx`:

```tsx
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
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test count-up-number -- --run 2>&1 | tail -20`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/count-up-number.tsx src/features/home/count-up-number.test.tsx
git commit -m "feat(home): add CountUpNumber component with IntersectionObserver"
```

---

### Task 2.1.2: TrustStripe에 CountUpNumber 적용

**Files:**
- Modify: `src/features/home/trust-stripe.tsx`

- [ ] **Step 1: 기존 내용 확인**

Run: `cat src/features/home/trust-stripe.tsx`
Expected: static server component with 4 items, no animation.

- [ ] **Step 2: TrustStripe 재작성**

Replace the entire file with:

```tsx
import { CountUpNumber } from "./count-up-number";

export function TrustStripe() {
  const items = [
    { target: 1280, unit: "건", label: "누적 승계" },
    { target: 100, unit: "%", label: "에스크로 보호" },
    { target: 320, unit: "만원", label: "평균 절약" },
    { target: 24, unit: "시간", label: "응답 속도" },
  ];
  return (
    <section aria-label="신뢰 지표" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border bg-white p-4 chayong-hover-lift"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          <p
            className="text-2xl font-bold chayong-tabular-nums"
            style={{ color: "var(--chayong-primary)" }}
          >
            <CountUpNumber target={it.target} />
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
```

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "(error|Error)" | head`
Expected: no error lines.

- [ ] **Step 4: Commit**

```bash
git add src/features/home/trust-stripe.tsx
git commit -m "style(home): add count-up animation and hover-lift to TrustStripe"
```

---

### Task 2.2.1: LiveActivityFeed 컴포넌트

**Files:**
- Create: `src/features/home/live-activity-feed.tsx`
- Create: `src/features/home/live-activity-feed.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/home/live-activity-feed.test.tsx`:

```tsx
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveActivityFeed } from "./live-activity-feed";

const mockEvents = [
  { id: "1", text: "방금 BMW X3 매물이 등록되었어요", type: "new-listing" as const },
  { id: "2", text: "에스크로 결제가 완료되었어요 (서울·K5)", type: "escrow" as const },
  { id: "3", text: "잔여 14개월 매물이 상담 완료되었어요", type: "consultation" as const },
];

describe("LiveActivityFeed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders first event on mount", () => {
    render(<LiveActivityFeed events={mockEvents} intervalMs={5000} />);
    expect(screen.getByText(mockEvents[0].text)).toBeInTheDocument();
  });

  it("rotates to next event after interval", async () => {
    render(<LiveActivityFeed events={mockEvents} intervalMs={5000} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5001);
    });
    expect(screen.getByText(mockEvents[1].text)).toBeInTheDocument();
  });

  it("wraps around to first event after last", async () => {
    render(<LiveActivityFeed events={mockEvents} intervalMs={1000} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });
    expect(screen.getByText(mockEvents[0].text)).toBeInTheDocument();
  });

  it("renders empty state when events are empty", () => {
    const { container } = render(<LiveActivityFeed events={[]} />);
    expect(container.textContent).not.toMatch(/방금/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test live-activity-feed -- --run 2>&1 | tail -15`
Expected: FAIL — module not found.

- [ ] **Step 3: 컴포넌트 구현**

Create `src/features/home/live-activity-feed.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, PlusCircle, MessageCircle } from "lucide-react";

export type LiveEvent = {
  id: string;
  text: string;
  type: "new-listing" | "escrow" | "consultation";
};

const ICONS = {
  "new-listing": PlusCircle,
  escrow: CheckCircle,
  consultation: MessageCircle,
} as const;

const DEFAULT_EVENTS: LiveEvent[] = [
  { id: "d1", text: "방금 BMW X3 매물이 등록되었어요", type: "new-listing" },
  { id: "d2", text: "에스크로 결제가 완료되었어요 (서울·K5)", type: "escrow" },
  { id: "d3", text: "잔여 14개월 매물이 상담 완료되었어요", type: "consultation" },
  { id: "d4", text: "제네시스 G80 승계 거래가 완료되었어요", type: "escrow" },
  { id: "d5", text: "신규 중고 렌트 3대가 큐레이션되었어요", type: "new-listing" },
];

interface Props {
  events?: LiveEvent[];
  intervalMs?: number;
}

export function LiveActivityFeed({ events = DEFAULT_EVENTS, intervalMs = 5000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [events.length, intervalMs]);

  if (events.length === 0) return null;
  const current = events[index];
  const Icon = ICONS[current.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-full border px-4 py-2.5 chayong-shadow-sm"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full chayong-icon-well"
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <p
        key={current.id}
        className="chayong-ticker-item truncate text-sm"
        style={{ color: "var(--chayong-text)" }}
      >
        {current.text}
      </p>
      <span
        className="ml-auto hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold md:inline-block"
        style={{
          backgroundColor: "var(--chayong-success)",
          color: "#FFFFFF",
        }}
      >
        LIVE
      </span>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test live-activity-feed -- --run 2>&1 | tail -15`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/live-activity-feed.tsx src/features/home/live-activity-feed.test.tsx
git commit -m "feat(home): add LiveActivityFeed ticker with auto-rotation"
```

---

### Task 2.3.1: CostCalculatorHome 컴포넌트

**Files:**
- Create: `src/features/home/cost-calculator-home.tsx`
- Create: `src/features/home/cost-calculator-home.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/home/cost-calculator-home.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { estimateMonthlyPayment, estimateNewLeaseSavings } from "./cost-calculator-home";

describe("cost-calculator-home math", () => {
  it("estimateMonthlyPayment returns ~1.2% of vehicle price", () => {
    expect(estimateMonthlyPayment(50_000_000)).toBe(600_000);
    expect(estimateMonthlyPayment(30_000_000)).toBe(360_000);
  });

  it("estimateNewLeaseSavings returns ~40% gap", () => {
    const v = 50_000_000;
    const chayong = estimateMonthlyPayment(v);
    const savings = estimateNewLeaseSavings(v);
    // new lease assumed ~1.67x our monthly payment (40% cheaper than new)
    expect(savings).toBeCloseTo(Math.round(chayong * 0.667), -3);
    expect(savings).toBeGreaterThan(0);
  });

  it("handles minimum and maximum vehicle prices", () => {
    expect(estimateMonthlyPayment(5_000_000)).toBe(60_000);
    expect(estimateMonthlyPayment(100_000_000)).toBe(1_200_000);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test cost-calculator-home -- --run 2>&1 | tail -15`
Expected: FAIL — module not found.

- [ ] **Step 3: 컴포넌트 구현**

Create `src/features/home/cost-calculator-home.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

/** 차량가 대비 월 납입금 추정 (단순 근사: 1.2%) */
export function estimateMonthlyPayment(vehiclePriceKRW: number): number {
  return Math.round(vehiclePriceKRW * 0.012);
}

/** 신차 리스 대비 월 절감액 추정 (신차 ≈ 차용 월납입금의 1.67배 가정 → 40% 저렴) */
export function estimateNewLeaseSavings(vehiclePriceKRW: number): number {
  const chayong = estimateMonthlyPayment(vehiclePriceKRW);
  const newLease = Math.round(chayong * 1.667);
  return newLease - chayong;
}

const MIN = 5_000_000;
const MAX = 100_000_000;
const STEP = 1_000_000;

function formatManwon(krw: number): string {
  const manwon = Math.round(krw / 10_000);
  return manwon.toLocaleString("ko-KR");
}

export function CostCalculatorHome() {
  const [price, setPrice] = useState(50_000_000);
  const monthly = estimateMonthlyPayment(price);
  const savings = estimateNewLeaseSavings(price);

  return (
    <section
      aria-label="비용 계산기"
      className="rounded-2xl border p-5 md:p-8"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
      }}
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "var(--chayong-text)" }}>
            내 예산으로 얼마짜리 차를 탈 수 있을까요?
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            차량가 슬라이더를 움직여보세요.
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold chayong-tabular-nums"
          style={{
            backgroundColor: "var(--chayong-primary-soft)",
            color: "var(--chayong-primary)",
          }}
        >
          차량가 {formatManwon(price)}만원
        </span>
      </div>

      <label className="block">
        <span className="sr-only">차량 가격</span>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full accent-[var(--chayong-primary)]"
          aria-label="차량 가격 (원)"
        />
        <div
          className="mt-1 flex justify-between text-[11px] chayong-tabular-nums"
          style={{ color: "var(--chayong-text-caption)" }}
        >
          <span>{formatManwon(MIN)}만</span>
          <span>{formatManwon(MAX)}만</span>
        </div>
      </label>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            차용 월 납입금 (예상)
          </p>
          <p
            className="mt-1 text-2xl font-bold chayong-tabular-nums"
            style={{ color: "var(--chayong-primary)" }}
          >
            월 {formatManwon(monthly)}만원
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
            신차 리스 대비 절감
          </p>
          <p
            className="mt-1 text-2xl font-bold chayong-tabular-nums"
            style={{ color: "var(--chayong-success)" }}
          >
            월 -{formatManwon(savings)}만원
          </p>
        </div>
      </div>

      <Link
        href="/list"
        className="mt-5 flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        이 예산에 맞는 매물 보기 →
      </Link>

      <p
        className="mt-3 text-[11px] leading-relaxed"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        * 월 납입금은 차량가의 약 1.2% 기준 단순 추정치입니다. 실제 납입금은 차종, 잔여 기간, 신용에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test cost-calculator-home -- --run 2>&1 | tail -15`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/cost-calculator-home.tsx src/features/home/cost-calculator-home.test.tsx
git commit -m "feat(home): add CostCalculatorHome with interactive vehicle price slider"
```

---

### Task 2.4.1: CustomerStories 컴포넌트

**Files:**
- Create: `src/features/home/customer-stories.tsx`

이 컴포넌트는 순수 UI(더미 데이터)라 별도 테스트 없이 시각 검증.

- [ ] **Step 1: 컴포넌트 작성**

Create `src/features/home/customer-stories.tsx`:

```tsx
interface Story {
  initial: string;
  name: string;
  role: string;
  quote: string;
  vehicle: string;
  savings: string;
  bgColor: string; // 이니셜 아바타 배경 (diverse palette — ui kit placeholder 정신)
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
```

- [ ] **Step 2: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "(error|Error)" | head`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/home/customer-stories.tsx
git commit -m "feat(home): add CustomerStories section with quote cards"
```

---

### Task 2.6.1 + 2.7.1: Hero 폴리시 & StoryCards hover

StoryCards와 홈페이지를 함께 수정하여 한 번에 커밋 (상호 의존).

**Files:**
- Modify: `src/features/home/story-cards.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: StoryCards에 hover-lift 추가**

Replace the `<article>` line in `src/features/home/story-cards.tsx`:

기존:
```tsx
        <article key={s.type} className="rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
```

변경:
```tsx
        <article
          key={s.type}
          className="rounded-2xl border bg-white p-5 chayong-shadow-sm chayong-hover-lift"
          style={{ borderColor: "var(--chayong-border)" }}
        >
```

- [ ] **Step 2: page.tsx Hero 섹션 수정**

`src/app/(public)/page.tsx` 상단 import에 추가:

```tsx
import { RibbonMotif } from "@/components/ui/ribbon-motif";
import { LiveActivityFeed } from "@/features/home/live-activity-feed";
import { CostCalculatorHome } from "@/features/home/cost-calculator-home";
import { CustomerStories } from "@/features/home/customer-stories";
```

Hero `<section>` 여는 태그 변경 — 배경에 RibbonMotif 추가:

기존:
```tsx
      <section className="relative overflow-hidden rounded-2xl px-6 py-12 md:px-10 md:py-20" style={{ background: "linear-gradient(135deg, #EBF3FE 0%, #F0F4FF 50%, #FFFFFF 100%)" }}>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
```

변경:
```tsx
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-12 md:px-10 md:py-20"
        style={{ background: "var(--chayong-gradient-hero)" }}
      >
        <div className="chayong-ribbon-bg">
          <RibbonMotif variant="hero" className="h-full w-full" />
        </div>
        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
```

Floating price widget의 absolute를 모바일에서 static으로 전환 (Car SVG 덮지 않도록):

기존:
```tsx
            {/* Floating price widget */}
            <div
              className="absolute -bottom-2 right-0 w-56 rounded-xl border p-4 shadow-lg lg:right-4"
              style={{ backgroundColor: "var(--chayong-bg)", borderColor: "var(--chayong-border)" }}
            >
```

변경:
```tsx
            {/* Floating price widget (mobile: inline, desktop: floating) */}
            <div
              className="relative mt-6 w-56 rounded-xl border p-4 lg:absolute lg:-bottom-2 lg:right-0 lg:mt-0 lg:right-4 chayong-shadow-lg"
              style={{ backgroundColor: "var(--chayong-bg)", borderColor: "var(--chayong-border)" }}
            >
```

- [ ] **Step 3: Home 본문에 신규 섹션 3개 삽입**

`page.tsx`의 `{/* ── Trust Stripe ── */}` 섹션을 찾아 그 직후에 삽입:

기존:
```tsx
      {/* ── Trust Stripe ── */}
      <section className="my-4 md:my-6">
        <TrustStripe />
      </section>

      {/* ── 지금, 이 매물 어때요? ── */}
```

변경:
```tsx
      {/* ── Trust Stripe ── */}
      <section className="my-4 md:my-6">
        <TrustStripe />
      </section>

      {/* ── Live Activity Feed ── */}
      <section className="my-4 md:my-6">
        <LiveActivityFeed />
      </section>

      {/* ── 지금, 이 매물 어때요? ── */}
```

그리고 `{/* ── Story Cards ── */}` 섹션 직전에 CostCalculator 삽입:

기존:
```tsx
      {/* ── Story Cards ── */}
      <section className="py-5 md:py-8">
```

변경:
```tsx
      {/* ── Cost Calculator ── */}
      <section className="py-5 md:py-8">
        <CostCalculatorHome />
      </section>

      {/* ── Story Cards ── */}
      <section className="py-5 md:py-8">
```

그리고 `{/* ── Sell CTA Banner ── */}` 직전에 CustomerStories 삽입:

기존:
```tsx
      {/* ── Sell CTA Banner ── */}
      <section className="mb-6 md:mb-8">
```

변경:
```tsx
      {/* ── Customer Stories ── */}
      <section className="py-6 md:py-10">
        <CustomerStories />
      </section>

      {/* ── Sell CTA Banner ── */}
      <section className="mb-6 md:mb-8">
```

- [ ] **Step 4: Hero 내부 `지금, 이 매물 어때요?` 헤더 스케일 업 (F-07)**

같은 파일에서:

기존:
```tsx
            <h2 className="text-lg font-bold md:text-xl" style={{ color: "var(--chayong-text)" }}>
              지금, 이 매물 어때요?
            </h2>
```

변경:
```tsx
            <h2 className="text-xl font-bold md:text-2xl" style={{ color: "var(--chayong-text)" }}>
              지금, 이 매물 어때요?
            </h2>
```

"차용으로 이런 거래가 가능해요", "이용 방법" h2도 동일 교체:
- `text-lg font-bold md:text-xl` → `text-xl font-bold md:text-2xl`

- [ ] **Step 5: 빌드 & 타입체크**

Run: `bun run build 2>&1 | tail -10`
Expected: exit 0, all routes compiled.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/story-cards.tsx src/app/(public)/page.tsx
git commit -m "feat(home): integrate LiveFeed, CostCalculator, CustomerStories, RibbonMotif"
```

---

## Phase 3 — List

### Task 3.1.1: Sticky sidebar 확인/보강

**Files:**
- Modify: `src/features/listings/components/sidebar-filters.tsx` (필요 시)

- [ ] **Step 1: 현재 sticky 상태 확인**

Run: `grep -n "sticky" src/features/listings/components/sidebar-filters.tsx`
Expected: 0개 또는 1개 일치.

- [ ] **Step 2: sticky 속성 누락 시 추가**

파일 최상위 `<aside>` 또는 `<div>` wrapper에 클래스 추가:
```tsx
className="hidden lg:block lg:sticky lg:top-20 lg:self-start lg:h-fit ... (기존 클래스)"
```

이미 sticky 적용되어 있으면 스킵.

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit (only if changed)**

```bash
git add src/features/listings/components/sidebar-filters.tsx
git commit -m "style(list): make sidebar filters sticky at lg breakpoint"
```

변경이 없으면 "NO-OP — already sticky"로 기록하고 다음 태스크로.

---

### Task 3.2.1: ResultMeta 카운트 애니메이션

**Files:**
- Modify: `src/features/listings/components/result-meta.tsx`

- [ ] **Step 1: 현재 count 렌더 위치 확인**

Run: `grep -n "count" src/features/listings/components/result-meta.tsx | head`
Expected: count prop 렌더링 위치 1~2개.

- [ ] **Step 2: CountUpNumber로 래핑**

기존 `{count.toLocaleString("ko-KR")}건` 또는 `{count}건` 같은 표기를 찾아서:
```tsx
<CountUpNumber target={count} duration={500} />건
```

로 교체. 파일 상단 import에 추가:
```tsx
import { CountUpNumber } from "@/features/home/count-up-number";
```

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/result-meta.tsx
git commit -m "style(list): animate result count with CountUpNumber"
```

---

### Task 3.3.1: 브랜드 칩 가로 스크롤

**Files:**
- Modify: `src/features/listings/components/sidebar-filters.tsx` 또는 리스트 페이지의 브랜드 칩 섹션

- [ ] **Step 1: 브랜드 칩 영역 확인**

Run: `grep -n "brand" src/features/listings/components/sidebar-filters.tsx | head -5`
Expected: 브랜드 칩 렌더링 위치.

- [ ] **Step 2: 모바일 가로 스크롤 컨테이너 적용 (해당되는 경우)**

브랜드 칩을 감싸는 `<div className="flex flex-wrap gap-2">` 같은 구조를 찾아 다음으로 교체:

모바일에서 wrap 대신 scroll:
```tsx
<div className="flex gap-2 chayong-scroll-x pb-1 md:flex-wrap">
  {/* 칩들 */}
</div>
```

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/sidebar-filters.tsx
git commit -m "style(list): add horizontal scroll for brand chips on mobile"
```

---

### Task 3.4.1: SortSelect 폴리시

**Files:**
- Modify: `src/features/listings/components/sort-select.tsx`

- [ ] **Step 1: 현재 sort-select 구조 확인**

Run: `cat src/features/listings/components/sort-select.tsx | head -60`
Expected: shadcn `<Select>` 또는 네이티브 `<select>` 렌더링.

- [ ] **Step 2: 일관된 높이/반경/포커스 링 적용**

최상위 트리거 엘리먼트에 다음 클래스가 없으면 추가:
- `h-10` (고정 높이)
- `rounded-xl` (반경 일관화)
- `chayong-focus-ring`
- `chayong-tabular-nums` (정렬 옵션 "가격 낮은순" 숫자는 없지만 추후 확장성)

네이티브 `<select>`인 경우 다음으로 교체 (shadcn `Select` 사용):

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "최신 등록순" },
  { value: "price_asc", label: "월납입금 낮은순" },
  { value: "price_desc", label: "월납입금 높은순" },
  { value: "year_desc", label: "연식 최신순" },
  { value: "mileage_asc", label: "주행거리 적은순" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "newest") {
      next.delete("sort");
    } else {
      next.set("sort", value);
    }
    next.delete("page");
    router.push(`/list?${next.toString()}`);
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-40 rounded-xl chayong-focus-ring">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

(현재 컴포넌트 API 시그니처가 다르면 최소 변경만 하고 SKIP 기록)

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/sort-select.tsx
git commit -m "style(list): polish SortSelect with consistent height, radius, focus ring"
```

---

## Phase 4 — Detail

### Task 4.1.1: 에스크로 5-step 확장

**Files:**
- Modify: `src/app/(public)/detail/[id]/page.tsx`

- [ ] **Step 1: ESCROW_STEPS 배열 확인**

Run: `grep -n "ESCROW_STEPS" src/app/(public)/detail/\[id\]/page.tsx`
Expected: 2 matches (선언 + 사용).

- [ ] **Step 2: 5-step으로 교체**

`src/app/(public)/detail/[id]/page.tsx` 상단 import에 추가:
```tsx
import { MessageCircle, ArrowRight, ShieldCheck, FileCheck, CheckCircle, PackageCheck } from "lucide-react";
```

(기존 ShieldCheck, CheckCircle, ArrowRight는 이미 있으므로 MessageCircle, FileCheck, PackageCheck만 추가)

`ESCROW_STEPS` 배열을 다음으로 교체:

```tsx
const ESCROW_STEPS = [
  {
    icon: MessageCircle,
    title: "매물 상담",
    description: "관심 매물에 문의 및 예약",
  },
  {
    icon: ShieldCheck,
    title: "가계약금 입금",
    description: "에스크로 계좌에 안전하게 보관",
  },
  {
    icon: FileCheck,
    title: "금융사 심사",
    description: "신용 및 명의 이전 심사",
  },
  {
    icon: ArrowRight,
    title: "명의 이전",
    description: "본계약 체결 및 차량 인도",
  },
  {
    icon: PackageCheck,
    title: "거래 완료",
    description: "에스크로 해제, 판매자 지급",
  },
] as const;
```

- [ ] **Step 3: 렌더링 grid 열수 조정**

기존 grid:
```tsx
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
```

변경:
```tsx
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
```

- [ ] **Step 4: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/detail/\[id\]/page.tsx
git commit -m "style(detail): expand escrow from 3 to 5 steps per design brief"
```

---

### Task 4.2.1: ListingCostCalculator에 3-Tab 뷰 추가

현재 사이드바 컴포넌트를 탭 UI로 확장 — `월납입금 / 총지출 / 신차리스 비교`.

**Files:**
- Modify: `src/features/listings/components/listing-cost-calculator.tsx`

- [ ] **Step 1: 현재 컴포넌트 구조 파악**

Run: `wc -l src/features/listings/components/listing-cost-calculator.tsx && head -30 src/features/listings/components/listing-cost-calculator.tsx`
Expected: 단일 뷰 렌더링.

- [ ] **Step 2: shadcn Tabs로 감싸기**

컴포넌트 return의 최상위를 Tabs로 교체. 파일 상단 import:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
```

기존 렌더 내용(월 납입금·초기비용·잔여기간 등)은 "월납입금" 탭에 유지. "총지출" 탭은 `monthlyPayment * remainingMonths + initialCost + transferFee` 계산 표시. "신차리스 비교" 탭은 현재 월납입금 vs `Math.round(monthlyPayment * 1.667)` 비교 + 절감액 표시.

```tsx
<Tabs defaultValue="monthly" className="w-full">
  <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl">
    <TabsTrigger value="monthly" className="rounded-lg text-xs">월 납입금</TabsTrigger>
    <TabsTrigger value="total" className="rounded-lg text-xs">총 지출</TabsTrigger>
    <TabsTrigger value="vs-new" className="rounded-lg text-xs">신차 비교</TabsTrigger>
  </TabsList>

  <TabsContent value="monthly" className="mt-4">
    {/* 기존 렌더 내용 그대로 */}
  </TabsContent>

  <TabsContent value="total" className="mt-4 space-y-2 text-sm">
    <Row label="월 납입금 × 잔여 개월" value={`${fmt(monthlyPayment * remainingMonths)}원`} />
    <Row label="초기 비용" value={`${fmt(initialCost)}원`} />
    {transferFee > 0 && <Row label="승계 수수료" value={`${fmt(transferFee)}원`} />}
    <div className="h-px my-2" style={{ backgroundColor: "var(--chayong-divider)" }} />
    <Row label="총 지출" value={`${fmt(monthlyPayment * remainingMonths + initialCost + (transferFee ?? 0))}원`} emphasize />
  </TabsContent>

  <TabsContent value="vs-new" className="mt-4 space-y-3">
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--chayong-text-sub)" }}>신차 리스 추정</span>
      <span className="chayong-tabular-nums font-semibold" style={{ color: "var(--chayong-text-caption)" }}>
        월 {fmt(Math.round(monthlyPayment * 1.667))}원
      </span>
    </div>
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--chayong-text-sub)" }}>차용 월 납입금</span>
      <span className="chayong-tabular-nums font-bold" style={{ color: "var(--chayong-primary)" }}>
        월 {fmt(monthlyPayment)}원
      </span>
    </div>
    <div
      className="rounded-xl p-3 text-center"
      style={{ backgroundColor: "var(--chayong-primary-soft)" }}
    >
      <p className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
        월 절감
      </p>
      <p
        className="mt-0.5 text-lg font-bold chayong-tabular-nums"
        style={{ color: "var(--chayong-success)" }}
      >
        -{fmt(Math.round(monthlyPayment * 0.667))}원
      </p>
    </div>
  </TabsContent>
</Tabs>
```

컴포넌트 내부에 Row 헬퍼 없으면 추가:

```tsx
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
    <div className="flex justify-between">
      <span style={{ color: "var(--chayong-text-sub)" }}>{label}</span>
      <span
        className={`chayong-tabular-nums ${emphasize ? "font-bold text-base" : "font-medium"}`}
        style={{ color: emphasize ? "var(--chayong-primary)" : "var(--chayong-text)" }}
      >
        {value}
      </span>
    </div>
  );
}
```

fmt 헬퍼 없으면 추가: `const fmt = (n: number) => n.toLocaleString("ko-KR");`

- [ ] **Step 3: 빌드 & 타입체크**

Run: `bun run build 2>&1 | tail -10`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/listing-cost-calculator.tsx
git commit -m "feat(detail): add 3-tab view to cost calculator (monthly / total / vs-new-lease)"
```

---

### Task 4.3.1: CTA Sidebar shadow-float 적용

**Files:**
- Modify: `src/features/listings/components/listing-cta-sidebar.tsx`

- [ ] **Step 1: 파일 최상위 wrapper 찾기**

Run: `head -40 src/features/listings/components/listing-cta-sidebar.tsx`
Expected: 최상위 div/section에 border/shadow 클래스 존재.

- [ ] **Step 2: shadow를 chayong-shadow-float로 교체 (혹은 추가)**

최상위 wrapper의 `shadow-sm` / `shadow-md` / `shadow-lg` 중 존재하는 것을 `chayong-shadow-float`로 교체. 없으면 className에 `chayong-shadow-float` 추가.

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/listing-cta-sidebar.tsx
git commit -m "style(detail): use shadow-float on sticky CTA sidebar"
```

---

## Phase 5 — Sell

### Task 5.1.1: LivePreviewCard 컴포넌트

**Files:**
- Create: `src/features/sell/components/live-preview-card.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `src/features/sell/components/live-preview-card.tsx`:

```tsx
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

      {/* Image placeholder */}
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
```

- [ ] **Step 2: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/sell/components/live-preview-card.tsx
git commit -m "feat(sell): add LivePreviewCard showing listing card form values"
```

---

### Task 5.2.1: StepIndicator 진행 애니메이션 (선택적)

**Files:**
- Modify: `src/components/ui/step-indicator.tsx`

- [ ] **Step 1: 현재 step-indicator 확인**

Run: `cat src/components/ui/step-indicator.tsx`
Expected: 현재 애니메이션 보유 여부 확인.

- [ ] **Step 2: 전환 애니메이션이 없으면 추가**

활성 스텝 원(circle)에 `transition` 추가, 프로그레스 바(있다면)에 width transition:

active step 원에 다음 클래스:
```tsx
className="... transition-all duration-300 ease-out"
```

프로그레스 라인이 있으면:
```tsx
style={{
  width: `${(currentStep / totalSteps) * 100}%`,
  transition: "width 300ms cubic-bezier(0.2, 0, 0.2, 1)",
}}
```

이미 애니메이션이 있으면 NO-OP로 기록하고 다음 태스크로.

- [ ] **Step 3: 빌드 확인**

Run: `bun run build 2>&1 | grep -E "error" | head`
Expected: no errors.

- [ ] **Step 4: Commit (only if changed)**

```bash
git add src/components/ui/step-indicator.tsx
git commit -m "style(sell): add transition to StepIndicator active step"
```

---

### Task 5.3.1: 각 Wizard 스텝에 Trust Reinforcement 배너

**Files:**
- Modify: `src/features/sell/components/sell-wizard.tsx`

- [ ] **Step 1: SellWizard 스텝 렌더 위치 파악**

Run: `grep -n "Step\|step" src/features/sell/components/sell-wizard.tsx | head -20`
Expected: 각 스텝 렌더 경계 확인.

- [ ] **Step 2: 재사용 TrustReinforcement 컴포넌트 작성**

파일 하단 또는 같은 파일 내 함수로 추가:

```tsx
import { ShieldCheck } from "lucide-react";

function TrustReinforcement({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-3 text-xs"
      style={{
        backgroundColor: "var(--chayong-primary-soft)",
        color: "var(--chayong-primary)",
      }}
    >
      <ShieldCheck size={16} aria-hidden="true" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
```

- [ ] **Step 3: 각 스텝 상단에 배치**

각 wizard step 컨테이너 상단에 스텝별 메시지:

```tsx
// Step 1 (차량 정보)
<TrustReinforcement message="입력 정보는 에스크로 시스템으로 보호되며, 검수 후 게재됩니다." />

// Step 2 (가격·조건)
<TrustReinforcement message="연락처는 채팅에서 자동 차단됩니다. 오직 차용 플랫폼을 통한 안전 거래만 보호됩니다." />

// Step 3 (사진·설명)
<TrustReinforcement message="최소 5장 이상의 실차 사진이 승인 및 안심매물 뱃지에 도움됩니다." />

// Step 4 (검토·제출)
<TrustReinforcement message="등록 후 24시간 내 관리자 검수를 통해 게재됩니다." />
```

스텝 개수가 다르면 맞춰 조정.

- [ ] **Step 4: 빌드 확인**

Run: `bun run build 2>&1 | tail -5`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/sell/components/sell-wizard.tsx
git commit -m "feat(sell): add trust reinforcement banner to each wizard step"
```

---

### Task 5.4.1: SellWizard와 LivePreviewCard 연동

**Files:**
- Modify: `src/features/sell/components/sell-wizard.tsx`

- [ ] **Step 1: SellWizard 구조 파악**

Run: `head -80 src/features/sell/components/sell-wizard.tsx`
Expected: form state 관리 코드.

- [ ] **Step 2: LivePreviewCard 통합**

SellWizard에서 현재 입력값(브랜드, 모델, 연식, 주행거리, 월납입금, 초기비용, 잔여기간)을 props로 LivePreviewCard에 전달.

SellWizard의 메인 레이아웃이 single column이면 desktop에서 grid로 전환:

```tsx
<div className="grid gap-6 lg:grid-cols-[1fr_340px]">
  <div>{/* 기존 wizard steps */}</div>
  <div className="lg:sticky lg:top-20 lg:self-start">
    <LivePreviewCard
      brand={formState.brand}
      model={formState.model}
      year={formState.year}
      mileage={formState.mileage}
      monthlyPayment={formState.monthlyPayment}
      initialCost={formState.initialCost}
      remainingMonths={formState.remainingMonths}
    />
  </div>
</div>
```

(실제 field 이름은 파일 내용에 맞게 조정)

파일 상단 import:
```tsx
import { LivePreviewCard } from "./live-preview-card";
```

- [ ] **Step 3: 빌드 & 타입체크**

Run: `bun run build 2>&1 | tail -10`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/sell/components/sell-wizard.tsx
git commit -m "feat(sell): integrate LivePreviewCard as sticky sidebar in wizard"
```

---

## Verification

각 Phase 완료 후:

```bash
bun run build && echo "✓ Build ok"
bun run test -- --run 2>&1 | tail -5
bun run lint 2>&1 | tail -5
```

전체 완료 후 visual 확인:

```bash
bun dev
# 다른 터미널에서
open http://localhost:3000
open http://localhost:3000/list
open http://localhost:3000/detail/<any-id>
open http://localhost:3000/sell
```

특히 확인:
- TrustStripe 숫자 count-up 애니메이션 (스크롤 시 발동)
- LiveActivityFeed 5초마다 다음 이벤트로 전환
- CostCalculatorHome 슬라이더 움직일 때 숫자 즉시 반영
- CustomerStories 카드 hover시 shadow + translateY
- Hero 배경에 RibbonMotif 리본 (primary-wash 톤으로 은은)
- Detail 에스크로 5-step
- Sell wizard 오른쪽에 LivePreview 카드 (모바일은 위/아래)

그리고 `prefers-reduced-motion: reduce` 환경에서 애니메이션 비활성 확인:
```bash
# Chrome DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce
```

---

## 롤백

각 커밋 독립. 문제 시:
```bash
git log --oneline | head -20
git revert <sha>
```

---

## Out of Scope

- 다크 모드 (토큰 reserved, 구현 보류)
- Guide 페이지 증강
- Admin/Auth 페이지
- Pretendard self-host
- 로고 마크 교체
