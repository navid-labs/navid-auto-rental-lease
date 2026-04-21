import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SidebarFilters } from "./sidebar-filters";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

describe("SidebarFilters", () => {
  it("renders brand checkboxes from props", () => {
    render(<SidebarFilters brands={["BMW", "현대", "기아"]} />);
    expect(screen.getByLabelText("BMW")).toBeInTheDocument();
    expect(screen.getByLabelText("현대")).toBeInTheDocument();
    expect(screen.getByLabelText("기아")).toBeInTheDocument();
  });

  it("checking a brand calls router.push with brand param", () => {
    render(<SidebarFilters brands={["BMW"]} />);
    fireEvent.click(screen.getByLabelText("BMW"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("brand=BMW")
    );
  });

  it("checking 가솔린 calls router.push with fuel=GASOLINE param", () => {
    render(<SidebarFilters brands={[]} />);
    // 연료 fieldset is collapsed by default — expand it first
    fireEvent.click(screen.getByRole("button", { name: /연료/ }));
    fireEvent.click(screen.getByLabelText("가솔린"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("fuel=GASOLINE")
    );
  });

  it("renders accident radio options", () => {
    render(<SidebarFilters brands={[]} />);
    // 사고 이력 fieldset is collapsed by default — expand it first
    fireEvent.click(screen.getByRole("button", { name: /사고 이력/ }));
    expect(screen.getByLabelText("무사고")).toBeInTheDocument();
    expect(screen.getByLabelText("1회 이하")).toBeInTheDocument();
    expect(screen.getByLabelText("2회 이하")).toBeInTheDocument();
  });
});
