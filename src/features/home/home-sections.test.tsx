import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustStripe } from "./trust-stripe";
import { StoryCards } from "./story-cards";
import { HowItWorksTimeline } from "./how-it-works-timeline";

describe("home sections", () => {
  it("TrustStripe renders 4 items", () => {
    render(<TrustStripe />);
    expect(screen.getAllByText(/누적|에스크로|평균|응답/)).toHaveLength(4);
  });
  it("StoryCards renders 3 articles", () => {
    render(<StoryCards />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });
  it("HowItWorksTimeline renders 4 steps", () => {
    render(<HowItWorksTimeline />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
