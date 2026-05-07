import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConsentModal } from "./consent-modal";

describe("ConsentModal", () => {
  it("disables submit until both required boxes are checked", () => {
    render(<ConsentModal onSubmit={vi.fn()} />);
    const submit = screen.getByRole("button", { name: /동의하고 시작하기/ });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/이용약관/));
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/개인정보/));
    expect(submit).toBeEnabled();
  });

  it("calls onSubmit with marketingOptIn flag", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConsentModal onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText(/이용약관/));
    fireEvent.click(screen.getByLabelText(/개인정보/));
    fireEvent.click(screen.getByLabelText(/마케팅/));
    fireEvent.click(screen.getByRole("button", { name: /동의하고 시작하기/ }));

    expect(onSubmit).toHaveBeenCalledWith({ marketingOptIn: true });
  });

  it("toggles all when 'select all' is clicked", () => {
    render(<ConsentModal onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/전체 동의/));
    expect(screen.getByLabelText(/이용약관/)).toBeChecked();
    expect(screen.getByLabelText(/개인정보/)).toBeChecked();
    expect(screen.getByLabelText(/마케팅/)).toBeChecked();
  });
});
