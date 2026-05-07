import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ReportModal } from "./report-modal";

describe("ReportModal", () => {
  it("keeps long report content within the viewport with a scrollable body", () => {
    render(
      <ReportModal
        isOpen
        targetType="LISTING"
        targetId="listing-1"
        targetSummary="긴 신고 대상 요약"
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog");
    const form = within(dialog).getByRole("button", {
      name: "신고하기",
    }).closest("form");
    const scrollBody = within(dialog)
      .getByText("신고 대상")
      .closest("section")?.parentElement;

    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]", "overflow-hidden");
    expect(form).toHaveClass("min-h-0", "grid-rows-[minmax(0,1fr)_auto]");
    expect(scrollBody).toHaveClass("overflow-y-auto");
  });
});
