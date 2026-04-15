import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ListingGallery } from "./listing-gallery";

afterEach(cleanup);

const IMAGES = [
  { id: "1", url: "/a.jpg", alt: "first image", order: 0 },
  { id: "2", url: "/b.jpg", alt: "second image", order: 1 },
  { id: "3", url: "/c.jpg", alt: "third image", order: 2 },
];

describe("ListingGallery", () => {
  it("shows first image", () => {
    render(<ListingGallery images={IMAGES} />);
    // main image + thumbnail both rendered — getAllByAltText
    const imgs = screen.getAllByAltText("first image");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders thumbnail buttons for each image", () => {
    render(<ListingGallery images={IMAGES} />);
    expect(screen.getAllByRole("button", { name: /thumbnail/i })).toHaveLength(3);
  });

  it("thumbnail click marks it active (aria-current=true)", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /thumbnail 2/i }));
    const btn = screen.getByRole("button", { name: /thumbnail 2/i });
    expect(btn).toHaveAttribute("aria-current", "true");
  });

  it("lightbox opens when expand button is clicked", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /이미지 확대/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("lightbox closes on Escape key", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /이미지 확대/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lightbox navigates forward with ArrowRight", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /이미지 확대/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    // counter should show 2/3
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("lightbox navigates back with ArrowLeft from second image", () => {
    render(<ListingGallery images={IMAGES} />);
    // go to second thumbnail first
    fireEvent.click(screen.getByRole("button", { name: /thumbnail 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /이미지 확대/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    // back to 1/3
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("shows empty state when no images", () => {
    render(<ListingGallery images={[]} />);
    expect(screen.getByText(/이미지 없음/)).toBeInTheDocument();
  });
});
