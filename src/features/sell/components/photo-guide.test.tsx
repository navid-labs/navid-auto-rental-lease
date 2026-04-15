// src/features/sell/components/photo-guide.test.tsx
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoGuide } from "./photo-guide";

describe("PhotoGuide", () => {
  it("renders 12 slot labels", () => {
    render(<PhotoGuide value={[]} onChange={() => {}} />);
    expect(screen.getAllByTestId(/photo-slot-/)).toHaveLength(12);
  });
});
