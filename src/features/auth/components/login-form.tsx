"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "./social-auth-buttons";
import { AuthDivider } from "./auth-divider";

const ERROR_MESSAGES: Record<string, string> = {
  email_exists: "이미 다른 방법으로 가입된 이메일입니다. 기존 방법으로 로그인해 주세요.",
  oauth_failed: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  invalid_callback: "잘못된 접근입니다.",
};

interface LoginFormProps {
  redirectPath?: string;
}

export function LoginForm({ redirectPath = "/" }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const initialError = queryError ? (ERROR_MESSAGES[queryError] ?? null) : null;

  const signupHref =
    redirectPath === "/"
      ? "/signup"
      : `/signup?${redirectPath === "/sell/new" ? "role=SELLER&" : ""}redirect=${encodeURIComponent(
          redirectPath
        )}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push(redirectPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-[var(--chayong-text)]">로그인</h1>
        <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">차용 계정으로 로그인하세요.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@chayong.kr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-11 text-base"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--chayong-danger)] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl bg-[var(--chayong-primary)] text-white font-semibold text-base hover:bg-[var(--chayong-primary-hover)] transition-colors"
      >
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <AuthDivider />
      <SocialAuthButtons />

      <p className="text-center text-sm text-[var(--chayong-text-sub)]">
        아직 회원이 아니신가요?{" "}
        <Link href={signupHref} className="text-[var(--chayong-primary)] font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
