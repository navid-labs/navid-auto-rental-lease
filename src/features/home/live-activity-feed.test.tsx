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
