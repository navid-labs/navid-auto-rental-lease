import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SignupForm } from "./signup-form";
import { LoginForm } from "./login-form";

const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe("auth redirect forms", () => {
  it("defaults signup role from role query state", () => {
    render(<SignupForm initialRole="SELLER" redirectPath="/sell/new" />);

    expect(screen.getByRole("button", { name: "매도자" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fsell%2Fnew"
    );
  });

  it("pushes a safe redirect after login succeeds", async () => {
    render(<LoginForm redirectPath="/sell/new" />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "seller@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/sell/new"));
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute(
      "href",
      "/signup?role=SELLER&redirect=%2Fsell%2Fnew"
    );
  });
});
