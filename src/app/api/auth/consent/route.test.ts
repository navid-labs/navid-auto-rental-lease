import { describe, it, expect, vi, beforeEach } from "vitest";

const update = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: { profile: { update: (...a: unknown[]) => update(...a) } },
}));
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuth: vi.fn(async () => ({ userId: "u1", role: "BUYER" })),
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://test/api/auth/consent", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/consent", () => {
  beforeEach(() => update.mockReset());

  it("rejects non-boolean marketingOptIn", async () => {
    const res = await POST(req({ marketingOptIn: "yes" }));
    expect(res.status).toBe(400);
  });

  it("accepts valid payload and writes timestamps", async () => {
    update.mockResolvedValue({});
    const res = await POST(req({ marketingOptIn: true }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledOnce();
    const arg = update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(arg.data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(arg.data.marketingOptIn).toBe(true);
    expect(arg.data.marketingOptInAt).toBeInstanceOf(Date);
  });

  it("does not set marketingOptInAt when marketingOptIn is false", async () => {
    update.mockResolvedValue({});
    const res = await POST(req({ marketingOptIn: false }));
    expect(res.status).toBe(200);
    const arg = update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.marketingOptIn).toBe(false);
    expect(arg.data.marketingOptInAt).toBeNull();
  });
});
