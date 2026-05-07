// src/features/sell/components/plate-lookup.test.tsx
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PlateLookup } from "./plate-lookup";

afterEach(() => cleanup());

describe("PlateLookup", () => {
  it("calls onResult on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ plate: "12가3456", brand: "BMW", model: "X3", year: 2022, fuel: "GASOLINE", displacement: 1998 }),
    }) as unknown as typeof fetch;

    const onResult = vi.fn();
    render(<PlateLookup onResult={onResult} onSkip={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/차량번호/i), { target: { value: "12가3456" } });
    fireEvent.click(screen.getByRole("button", { name: /조회/i }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ brand: "BMW" })));
  });

  it("shows error on invalid plate (client-side)", () => {
    const onError = vi.fn();
    render(<PlateLookup onResult={() => {}} onSkip={() => {}} onError={onError} />);
    fireEvent.change(screen.getByPlaceholderText(/차량번호/i), { target: { value: "BADPLATE" } });
    fireEvent.click(screen.getByRole("button", { name: /조회/i }));
    expect(screen.getByText(/번호판 형식/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it("shows manual continuation after lookup failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const onError = vi.fn();
    render(<PlateLookup onResult={() => {}} onSkip={() => {}} onError={onError} />);
    fireEvent.change(screen.getByPlaceholderText(/차량번호/i), { target: { value: "12가3456" } });
    fireEvent.click(screen.getByRole("button", { name: /조회/i }));
    await waitFor(() => expect(screen.getByText(/조회에 실패했습니다/i)).toBeInTheDocument());
    expect(onError).toHaveBeenCalled();
  });
});
