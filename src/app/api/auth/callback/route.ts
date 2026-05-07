import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOAuthProfile, type OAuthProvider } from "@/lib/supabase/oauth-profile";
import { sanitizeNextPath } from "@/lib/auth/redirect";

const PROVIDERS = new Set(["google", "kakao"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const next = sanitizeNextPath(url.searchParams.get("next"));

  if (errorParam) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_callback", url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const user = data.session.user;
  const provider = user.app_metadata?.provider as string | undefined;
  if (!provider || !PROVIDERS.has(provider)) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const result = await resolveOAuthProfile({
    userId: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string | undefined) ?? null,
    provider: provider as OAuthProvider,
  });

  if (result.status === "conflict") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=email_exists", url.origin));
  }

  if (result.needsConsent) {
    return NextResponse.redirect(new URL("/onboarding/consent", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
