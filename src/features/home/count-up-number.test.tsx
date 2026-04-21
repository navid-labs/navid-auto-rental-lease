import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CountUpNumber } from "./count-up-number";

describe("CountUpNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.IntersectionObserver = class MockIO {
      cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe() {
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
