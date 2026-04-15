"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.role === "ADMIN");
      }
      setLoading(false);
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        className="h-8 w-20 animate-pulse rounded-lg"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      />
    );
  }

  if (user) {
    const displayName =
      user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
    return (
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            관리자
          </Link>
        )}
        <Link
          href="/my"
          className="text-sm font-medium transition-colors hover:text-[var(--chayong-primary)]"
          style={{ color: "var(--chayong-text)" }}
        >
          {displayName}님
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:border-[var(--chayong-primary)] hover:text-[var(--chayong-primary)]"
          style={{
            borderColor: "var(--chayong-border)",
            color: "var(--chayong-text-sub)",
          }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors hover:text-[var(--chayong-primary)]"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="flex min-h-[44px] items-center rounded-lg px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--chayong-primary-hover)]"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        회원가입
      </Link>
    </div>
  );
}
