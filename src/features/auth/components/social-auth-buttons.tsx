"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "kakao";

export function SocialAuthButtons({ next }: { next?: string }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    setPending(provider);
    try {
      const supabase = createClient();
      const redirectTo = new URL("/api/auth/callback", window.location.origin);
      if (next) redirectTo.searchParams.set("next", next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo.toString() },
      });
      if (error) {
        setError("소셜 로그인을 시작할 수 없습니다.");
        setPending(null);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={pending !== null}
        aria-label="Google로 로그인"
        className="h-12 w-full rounded-xl border border-[#747775] bg-white text-[15px] font-semibold text-[#1F1F1F] transition hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Image src="/icons/google-g.svg" alt="" width={18} height={18} aria-hidden />
        <span>Google로 로그인</span>
      </button>

      <button
        type="button"
        onClick={() => signIn("kakao")}
        disabled={pending !== null}
        aria-label="카카오 로그인"
        className="h-12 w-full rounded-xl bg-[#FEE500] text-[15px] font-semibold text-black/85 transition hover:brightness-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Image src="/icons/kakao-symbol.svg" alt="" width={18} height={18} aria-hidden />
        <span>카카오 로그인</span>
      </button>

      {error && (
        <p className="text-sm text-[var(--chayong-danger)] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
