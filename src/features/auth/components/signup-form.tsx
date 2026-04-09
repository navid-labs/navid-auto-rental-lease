"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Role = "BUYER" | "SELLER";

export function SignupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, role },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--chayong-primary-light)] flex items-center justify-center">
          <span className="text-2xl">✉️</span>
        </div>
        <h2 className="text-lg font-bold text-[var(--chayong-text)]">
          이메일 인증 메일을 확인해주세요
        </h2>
        <p className="text-sm text-[var(--chayong-text-sub)]">
          <strong>{email}</strong>로 인증 링크를 보냈습니다.
          <br />
          메일함을 확인해 인증을 완료해주세요.
        </p>
        <Link
          href="/login"
          className="mt-2 text-sm text-[var(--chayong-primary)] font-medium hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-[var(--chayong-text)]">회원가입</h1>
        <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">
          차용에 오신 것을 환영합니다.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <Label>회원 유형</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["BUYER", "SELLER"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={[
                "h-11 rounded-xl border text-sm font-medium transition-colors",
                role === r
                  ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary-light)] text-[var(--chayong-primary)]"
                  : "border-[var(--chayong-divider)] bg-white text-[var(--chayong-text-sub)] hover:bg-[var(--chayong-surface-hover)]",
              ].join(" ")}
            >
              {r === "BUYER" ? "매수자" : "매도자"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          type="text"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">연락처</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          className="h-11 text-base"
        />
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
          placeholder="6자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
        <Input
          id="passwordConfirm"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          autoComplete="new-password"
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
        {loading ? "처리 중..." : "회원가입"}
      </Button>

      <p className="text-center text-sm text-[var(--chayong-text-sub)]">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="text-[var(--chayong-primary)] font-medium hover:underline"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
