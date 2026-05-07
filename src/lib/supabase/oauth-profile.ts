import { prisma } from "@/lib/db/prisma";
import type { Profile } from "@prisma/client";

export type OAuthProvider = "google" | "kakao";

export type OAuthProfileInput = {
  userId: string;
  email: string;
  name: string | null;
  provider: OAuthProvider;
};

export type OAuthProfileResult =
  | { status: "created"; profile: Profile; needsConsent: true }
  | { status: "ok"; profile: Profile; needsConsent: boolean }
  | { status: "conflict"; profile: null; needsConsent: false };

export async function resolveOAuthProfile(
  input: OAuthProfileInput,
): Promise<OAuthProfileResult> {
  const existing = await prisma.profile.findUnique({ where: { id: input.userId } });

  if (!existing) {
    const profile = await prisma.profile.create({
      data: {
        id: input.userId,
        email: input.email,
        name: input.name,
        role: "BUYER",
        authProvider: input.provider,
      },
    });
    return { status: "created", profile, needsConsent: true };
  }

  if (existing.authProvider !== input.provider) {
    return { status: "conflict", profile: null, needsConsent: false };
  }

  const needsConsent =
    existing.termsAcceptedAt == null || existing.privacyAcceptedAt == null;

  return { status: "ok", profile: existing, needsConsent };
}
