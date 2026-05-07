import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/auth";
import { ConsentClient } from "./consent-client";

export const dynamic = "force-dynamic";

export default async function OnboardingConsentPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.termsAcceptedAt && profile.privacyAcceptedAt) redirect("/");

  return <ConsentClient />;
}
