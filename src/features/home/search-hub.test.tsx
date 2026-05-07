import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchHub } from "./search-hub";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SearchHub", () => {
  it("renders type chips", () => {
    render(<SearchHub brands={["BMW", "현대"]} />);
    expect(screen.getByText("승계")).toBeInTheDocument();
    expect(screen.getByText("중고리스")).toBeInTheDocument();
    expect(screen.getByText("중고렌트")).toBeInTheDocument();
  });

  it("builds correct link when type is selected", () => {
    render(<SearchHub brands={[]} />);
    const cta = screen.getByRole("link", { name: "선택 조건으로 매물 검색" });
    fireEvent.click(screen.getByText("승계"));
    expect(cta.getAttribute("href")).toContain("type=TRANSFER");
  });
});
