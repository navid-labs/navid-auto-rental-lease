import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Profile } from "@prisma/client";

const findUnique = vi.fn();
const create = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: { profile: { findUnique: (...a: unknown[]) => findUnique(...a), create: (...a: unknown[]) => create(...a) } },
}));

import { resolveOAuthProfile } from "./oauth-profile";

describe("resolveOAuthProfile", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
  });

  it("creates a new BUYER profile when none exists", async () => {
    findUnique.mockResolvedValue(null);
    const created: Profile = {
      id: "u1", email: "a@b.co", name: "A", role: "BUYER",
      authProvider: "google", termsAcceptedAt: null, privacyAcceptedAt: null,
      marketingOptIn: false, marketingOptInAt: null,
    } as unknown as Profile;
    create.mockResolvedValue(created);

    const out = await resolveOAuthProfile({
      userId: "u1", email: "a@b.co", name: "A", provider: "google",
    });

    expect(create).toHaveBeenCalledOnce();
    expect(out).toEqual({ profile: created, status: "created", needsConsent: true });
  });

  it("returns existing profile when provider matches and consent is set", async () => {
    const existing: Profile = {
      id: "u1", email: "a@b.co", role: "BUYER",
      authProvider: "google", termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    } as unknown as Profile;
    findUnique.mockResolvedValue(existing);

    const out = await resolveOAuthProfile({
      userId: "u1", email: "a@b.co", name: "A", provider: "google",
    });

    expect(create).not.toHaveBeenCalled();
    expect(out).toEqual({ profile: existing, status: "ok", needsConsent: false });
  });

  it("flags needsConsent when terms not accepted", async () => {
    const existing: Profile = {
      id: "u1", email: "a@b.co", role: "BUYER",
      authProvider: "google", termsAcceptedAt: null, privacyAcceptedAt: null,
    } as unknown as Profile;
    findUnique.mockResolvedValue(existing);

    const out = await resolveOAuthProfile({
      userId: "u1", email: "a@b.co", name: "A", provider: "google",
    });

    expect(out.status).toBe("ok");
    expect(out.needsConsent).toBe(true);
  });

  it("returns conflict when provider mismatches", async () => {
    const existing: Profile = {
      id: "u1", email: "a@b.co", authProvider: "email",
    } as unknown as Profile;
    findUnique.mockResolvedValue(existing);

    const out = await resolveOAuthProfile({
      userId: "u1", email: "a@b.co", name: "A", provider: "google",
    });

    expect(out.status).toBe("conflict");
    expect(out.profile).toBeNull();
  });
});
