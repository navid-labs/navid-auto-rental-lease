# Social Login (Google + Kakao) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차용 로그인/회원가입에 Google + Kakao 소셜 로그인 + 약관 동의 모달을 추가한다.

**Architecture:** Supabase 네이티브 OAuth(`signInWithOAuth`) + 서버 콜백 라우트에서 Profile 분기(신규/기존/이메일중복) → 신규 또는 약관 미동의 유저는 `/onboarding/consent` 강제 진입.

**Tech Stack:** Next.js 16 App Router, Supabase Auth (`@supabase/ssr`), Prisma, Tailwind CSS 4, shadcn/ui, Vitest + happy-dom, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-08-social-login-google-kakao-design.md`

**Branch:** `worktree-feat+social-login-google-kakao` (worktree)

---

## Pre-flight

- [ ] **현재 브랜치/워크트리 확인**

```bash
git branch --show-current
# 예상: worktree-feat+social-login-google-kakao
git status
# 예상: nothing to commit, working tree clean (spec 커밋 후)
```

- [ ] **테스트 베이스라인 통과 확인**

```bash
bun run test --run 2>&1 | tail -10
```
Expected: 기존 테스트 모두 PASS.

---

## Phase 0 — Schema (Human-only)

> Hybrid 룰: `prisma/migrations/**`는 사람이 작성. 본 단계는 사람이 직접 처리하고 다음 Phase로 진행.

### Task 0.1: Profile 모델 필드 추가

**Files:**
- Modify: `prisma/schema.prisma` (Profile 모델)

- [ ] **Step 1: Profile 모델에 필드 추가**

`prisma/schema.prisma`의 Profile 모델에 다음 5개 필드를 `bannedAt` 다음 줄에 추가:

```prisma
  // Auth provider tracking
  authProvider      String?   @map("auth_provider")
  termsAcceptedAt   DateTime? @map("terms_accepted_at")
  privacyAcceptedAt DateTime? @map("privacy_accepted_at")
  marketingOptIn    Boolean   @default(false) @map("marketing_opt_in")
  marketingOptInAt  DateTime? @map("marketing_opt_in_at")
```

- [ ] **Step 2: Prisma client 재생성**

```bash
bun run db:generate
```
Expected: `Generated Prisma Client (...)` 출력.

- [ ] **Step 3: 마이그레이션 SQL 작성 (사람)**

새 마이그레이션 파일 생성:
```bash
mkdir -p prisma/migrations/20260508_social_login_profile_fields
```

`prisma/migrations/20260508_social_login_profile_fields/migration.sql`:

```sql
ALTER TABLE "profiles"
  ADD COLUMN "auth_provider" TEXT,
  ADD COLUMN "terms_accepted_at" TIMESTAMP(3),
  ADD COLUMN "privacy_accepted_at" TIMESTAMP(3),
  ADD COLUMN "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "marketing_opt_in_at" TIMESTAMP(3);

-- 기존 이메일 가입자 백필
UPDATE "profiles" SET "auth_provider" = 'email' WHERE "auth_provider" IS NULL;
```

- [ ] **Step 4: dev DB에 적용**

```bash
bun run db:push
```
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
bun run type-check
```
Expected: 0 errors. (Profile 타입에 새 필드가 반영됨)

- [ ] **Step 6: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/20260508_social_login_profile_fields/
git commit -m "feat(auth): add social login fields to Profile schema

- authProvider, termsAcceptedAt, privacyAcceptedAt
- marketingOptIn + marketingOptInAt
- backfill 'email' for existing users

Refs: docs/superpowers/specs/2026-05-08-social-login-google-kakao-design.md"
```

---

## Phase 1 — Library Helpers (TDD)

### Task 1.1: `getOrCreateProfileFromOAuth` 헬퍼

**Files:**
- Create: `src/lib/supabase/oauth-profile.ts`
- Test: `src/lib/supabase/oauth-profile.test.ts`

분기 로직을 lib에 격리해 콜백 라우트는 얇게 유지한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/supabase/oauth-profile.test.ts`:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test src/lib/supabase/oauth-profile.test.ts --run
```
Expected: FAIL — `Cannot find module './oauth-profile'`.

- [ ] **Step 3: 최소 구현 작성**

`src/lib/supabase/oauth-profile.ts`:

```typescript
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test src/lib/supabase/oauth-profile.test.ts --run
```
Expected: PASS — 4/4.

- [ ] **Step 5: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/supabase/oauth-profile.ts src/lib/supabase/oauth-profile.test.ts
git commit -m "feat(auth): add resolveOAuthProfile helper for OAuth callback

분기 4가지 (created / ok / needsConsent / conflict) 케이스 단위 테스트 포함."
```

---

### Task 1.2: redirect 화이트리스트 헬퍼

**Files:**
- Create: `src/lib/auth/redirect.ts`
- Test: `src/lib/auth/redirect.test.ts`

OAuth 콜백 `next` 파라미터 open redirect 방어용.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/auth/redirect.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sanitizeNextPath } from "./redirect";

describe("sanitizeNextPath", () => {
  it("returns the path when it is a same-origin internal path", () => {
    expect(sanitizeNextPath("/listings/abc")).toBe("/listings/abc");
    expect(sanitizeNextPath("/my")).toBe("/my");
  });

  it("falls back to '/' when missing or invalid", () => {
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("")).toBe("/");
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/");
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("http://chayong.kr/x")).toBe("/");
  });

  it("rejects protocol-relative or non-slash starts", () => {
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/");
    expect(sanitizeNextPath("about")).toBe("/");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test src/lib/auth/redirect.test.ts --run
```
Expected: FAIL.

- [ ] **Step 3: 구현 작성**

`src/lib/auth/redirect.ts`:

```typescript
const SAFE_PATH = /^\/[A-Za-z0-9_\-/]*$/;

export function sanitizeNextPath(input: string | null | undefined): string {
  if (!input) return "/";
  if (input.startsWith("//")) return "/";
  if (!SAFE_PATH.test(input)) return "/";
  return input;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test src/lib/auth/redirect.test.ts --run
```
Expected: PASS — 4/4.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/auth/redirect.ts src/lib/auth/redirect.test.ts
git commit -m "feat(auth): add sanitizeNextPath for OAuth open-redirect defense"
```

---

## Phase 2 — API Routes

### Task 2.1: OAuth 콜백 라우트

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

> Route Handler 단위 테스트는 Supabase 클라이언트 모킹 비용이 크다. 분기 로직은 Phase 1 헬퍼로 격리되어 있으므로, 본 라우트는 헬퍼 호출과 redirect만 담당한다. 통합 검증은 Phase 5 e2e + Manual QA로 수행.

- [ ] **Step 1: 콜백 라우트 작성**

`src/app/api/auth/callback/route.ts`:

```typescript
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
```

- [ ] **Step 2: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat(auth): add /api/auth/callback OAuth handler

분기: needsConsent → /onboarding/consent, conflict → /login?error=email_exists,
정상 → next (sanitized)."
```

---

### Task 2.2: Consent API (TDD on input validation)

**Files:**
- Create: `src/app/api/auth/consent/route.ts`
- Test: `src/app/api/auth/consent/route.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/api/auth/consent/route.test.ts`:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test src/app/api/auth/consent/route.test.ts --run
```
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: 라우트 구현**

`src/app/api/auth/consent/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const optIn =
    payload && typeof payload === "object" && "marketingOptIn" in payload
      ? (payload as { marketingOptIn: unknown }).marketingOptIn
      : undefined;
  if (typeof optIn !== "boolean") {
    return NextResponse.json({ error: "marketingOptIn must be boolean" }, { status: 400 });
  }

  const now = new Date();
  await prisma.profile.update({
    where: { id: auth.userId },
    data: {
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      marketingOptIn: optIn,
      marketingOptInAt: optIn ? now : null,
    },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test src/app/api/auth/consent/route.test.ts --run
```
Expected: PASS — 3/3.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/auth/consent/route.ts src/app/api/auth/consent/route.test.ts
git commit -m "feat(auth): add POST /api/auth/consent for terms/privacy/marketing

- marketingOptIn boolean 입력 검증
- 필수 약관/개인정보 시각 자동 기록
- marketingOptInAt은 true일 때만 기록"
```

---

## Phase 3 — UI Components

### Task 3.1: 공식 브랜드 자산 (Human-only)

**Files:**
- Create: `public/icons/google-g.svg`
- Create: `public/icons/kakao-symbol.svg`
- Create: `public/icons/README.md`

> Hybrid 룰: 외부 라이선스 자산은 사람이 다운로드해 검증.

- [ ] **Step 1: Google G 로고 SVG 다운로드**

```
출처: https://developers.google.com/static/identity/images/signin-assets.zip
파일: web/png+svg/{light,dark,neutral}/web_neutral_sq_SI.svg 등
사용: web/svg/light/google_signin_button_logo.svg → public/icons/google-g.svg
```

- [ ] **Step 2: Kakao 말풍선 심볼 SVG**

```
출처: https://developers.kakao.com/tool/resource/login (button.zip)
PSD에서 말풍선만 추출 → public/icons/kakao-symbol.svg (24×24 viewBox 권장)
```

- [ ] **Step 3: 라이선스 메모 작성**

`public/icons/README.md`:

```markdown
# Brand Icons

| 파일 | 출처 | 라이선스 / 사용 조건 |
|------|------|---------------------|
| google-g.svg | https://developers.google.com/identity/branding-guidelines (signin-assets.zip) | Google Brand Guidelines — 비율 유지, 단색 변환 금지 |
| kakao-symbol.svg | https://developers.kakao.com/tool/resource/login | Kakao Login Design Guide — #FEE500 배경 + 말풍선 심볼 + "카카오 로그인" 텍스트 변경 금지 |

본 자산은 차용 서비스의 소셜 로그인 버튼 용도로만 사용합니다. 다른 곳에 재사용하지 마세요.
```

- [ ] **Step 4: 커밋**

```bash
git add public/icons/
git commit -m "chore(assets): add official Google + Kakao login icons

라이선스 출처는 public/icons/README.md 참고."
```

---

### Task 3.2: AuthDivider 컴포넌트

**Files:**
- Create: `src/features/auth/components/auth-divider.tsx`

- [ ] **Step 1: 구현 작성**

`src/features/auth/components/auth-divider.tsx`:

```tsx
export function AuthDivider({ label = "또는" }: { label?: string }) {
  return (
    <div className="my-2 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[var(--chayong-divider)]" />
      <span className="text-xs text-[var(--chayong-text-sub)]">{label}</span>
      <span className="h-px flex-1 bg-[var(--chayong-divider)]" />
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 3: 커밋**

```bash
git add src/features/auth/components/auth-divider.tsx
git commit -m "feat(auth): add AuthDivider component"
```

---

### Task 3.3: SocialAuthButtons 컴포넌트

**Files:**
- Create: `src/features/auth/components/social-auth-buttons.tsx`

- [ ] **Step 1: 구현 작성**

`src/features/auth/components/social-auth-buttons.tsx`:

```tsx
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
```

- [ ] **Step 2: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 3: 커밋**

```bash
git add src/features/auth/components/social-auth-buttons.tsx
git commit -m "feat(auth): add SocialAuthButtons (Google + Kakao)

공식 브랜드 가이드 준수: Google #FFFFFF+#747775, Kakao #FEE500."
```

---

### Task 3.4: ConsentModal 컴포넌트

**Files:**
- Create: `src/features/auth/components/consent-modal.tsx`
- Test: `src/features/auth/components/consent-modal.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/auth/components/consent-modal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConsentModal } from "./consent-modal";

describe("ConsentModal", () => {
  it("disables submit until both required boxes are checked", () => {
    render(<ConsentModal onSubmit={vi.fn()} />);
    const submit = screen.getByRole("button", { name: /동의하고 시작하기/ });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/이용약관/));
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/개인정보/));
    expect(submit).toBeEnabled();
  });

  it("calls onSubmit with marketingOptIn flag", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConsentModal onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText(/이용약관/));
    fireEvent.click(screen.getByLabelText(/개인정보/));
    fireEvent.click(screen.getByLabelText(/마케팅/));
    fireEvent.click(screen.getByRole("button", { name: /동의하고 시작하기/ }));

    expect(onSubmit).toHaveBeenCalledWith({ marketingOptIn: true });
  });

  it("toggles all when 'select all' is clicked", () => {
    render(<ConsentModal onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/전체 동의/));
    expect(screen.getByLabelText(/이용약관/)).toBeChecked();
    expect(screen.getByLabelText(/개인정보/)).toBeChecked();
    expect(screen.getByLabelText(/마케팅/)).toBeChecked();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test src/features/auth/components/consent-modal.test.tsx --run
```
Expected: FAIL — `Cannot find module './consent-modal'`.

- [ ] **Step 3: 구현 작성**

`src/features/auth/components/consent-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export type ConsentResult = { marketingOptIn: boolean };

export function ConsentModal({
  onSubmit,
}: {
  onSubmit: (result: ConsentResult) => Promise<void> | void;
}) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allChecked = terms && privacy && marketing;
  const canSubmit = terms && privacy && !submitting;

  function toggleAll() {
    const next = !allChecked;
    setTerms(next);
    setPrivacy(next);
    setMarketing(next);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ marketingOptIn: marketing });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <h2 id="consent-title" className="text-lg font-bold text-[var(--chayong-text)]">
          서비스 이용을 위해 동의해 주세요
        </h2>
        <p className="mt-1 text-sm text-[var(--chayong-text-sub)]">
          필수 항목에 동의하시면 차용을 시작할 수 있습니다.
        </p>

        <label className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--chayong-divider)] px-3 py-3 cursor-pointer">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 동의" />
          <span className="font-semibold">전체 동의 (선택 항목 포함)</span>
        </label>

        <div className="mt-3 flex flex-col gap-2">
          <Item
            checked={terms}
            onChange={setTerms}
            required
            label="이용약관"
            href="/terms"
            ariaLabel="이용약관 동의 (필수)"
          />
          <Item
            checked={privacy}
            onChange={setPrivacy}
            required
            label="개인정보 처리방침"
            href="/privacy"
            ariaLabel="개인정보 동의 (필수)"
          />
          <Item
            checked={marketing}
            onChange={setMarketing}
            label="마케팅 정보 수신 (이메일/SMS)"
            ariaLabel="마케팅 수신 동의 (선택)"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-5 h-12 w-full rounded-xl bg-[var(--chayong-primary)] text-white font-semibold text-[15px] transition disabled:opacity-50 hover:bg-[var(--chayong-primary-hover)]"
        >
          {submitting ? "처리 중..." : "동의하고 시작하기"}
        </button>
      </div>
    </div>
  );
}

function Item({
  checked,
  onChange,
  required,
  label,
  href,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  label: string;
  href?: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
        />
        <span className="text-sm">
          <span className={required ? "text-[var(--chayong-primary)]" : "text-[var(--chayong-text-sub)]"}>
            {required ? "(필수) " : "(선택) "}
          </span>
          {label}
        </span>
      </label>
      {href && (
        <Link href={href} target="_blank" className="text-xs text-[var(--chayong-text-sub)] underline">
          보기
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test src/features/auth/components/consent-modal.test.tsx --run
```
Expected: PASS — 3/3.

- [ ] **Step 5: 커밋**

```bash
git add src/features/auth/components/consent-modal.tsx src/features/auth/components/consent-modal.test.tsx
git commit -m "feat(auth): add ConsentModal with terms/privacy/marketing

- 필수 둘 다 체크 시에만 제출 가능
- '전체 동의' 일괄 토글
- 마케팅 옵트인은 onSubmit payload로 전달"
```

---

## Phase 4 — Page Integration

### Task 4.1: LoginForm에 소셜 버튼 추가

**Files:**
- Modify: `src/features/auth/components/login-form.tsx`

- [ ] **Step 1: 컴포넌트 수정**

`src/features/auth/components/login-form.tsx` 전체를 다음으로 교체:

```tsx
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const initialError = queryError ? ERROR_MESSAGES[queryError] ?? null : null;

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
      router.push("/");
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
        <Link href="/signup" className="text-[var(--chayong-primary)] font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 3: 빌드 확인 (서버 컴포넌트 경계 검증)**

```bash
bun run build 2>&1 | tail -20
```
Expected: 빌드 성공 (Module 경계 오류 없음).

- [ ] **Step 4: 커밋**

```bash
git add src/features/auth/components/login-form.tsx
git commit -m "feat(auth): add social login buttons to login form

- Divider + SocialAuthButtons 추가
- searchParams.error → 사용자 친화 메시지 매핑"
```

---

### Task 4.2: SignupForm에 소셜 버튼 추가

**Files:**
- Modify: `src/features/auth/components/signup-form.tsx`

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat src/features/auth/components/signup-form.tsx
```

- [ ] **Step 2: form 마지막에 Divider + SocialAuthButtons 삽입**

기존 form의 마지막 `<Button type="submit">...</Button>` 아래, "이미 계정이 있으신가요?" 링크 위에 다음을 삽입한다 (구체 위치는 현재 컴포넌트 구조 따름):

```tsx
import { SocialAuthButtons } from "./social-auth-buttons";
import { AuthDivider } from "./auth-divider";

// ... 기존 코드 ...

      <AuthDivider />
      <SocialAuthButtons />
```

> 만약 SignupForm이 다단계 wizard라면 첫 단계(이메일 입력) 화면에만 노출. 다른 단계로 이동 후에는 비표시.

- [ ] **Step 3: 타입체크 + 빌드**

```bash
bun run type-check
bun run build 2>&1 | tail -10
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/auth/components/signup-form.tsx
git commit -m "feat(auth): add social login buttons to signup form"
```

---

### Task 4.3: Onboarding consent 페이지

**Files:**
- Create: `src/app/(protected)/onboarding/consent/page.tsx`
- Create: `src/app/(protected)/onboarding/consent/consent-client.tsx`

> Server Component(page)에서 이미 동의한 유저는 `/`로 redirect, 클라이언트 컴포넌트에서 모달 노출 + API 호출.

- [ ] **Step 1: Server page 작성**

`src/app/(protected)/onboarding/consent/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Client wrapper 작성**

`src/app/(protected)/onboarding/consent/consent-client.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ConsentModal, type ConsentResult } from "@/features/auth/components/consent-modal";

export function ConsentClient() {
  const router = useRouter();

  async function handleSubmit(result: ConsentResult) {
    const res = await fetch("/api/auth/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result),
    });
    if (!res.ok) {
      throw new Error("consent failed");
    }
    router.push("/");
    router.refresh();
  }

  return <ConsentModal onSubmit={handleSubmit} />;
}
```

- [ ] **Step 3: 타입체크 + 빌드**

```bash
bun run type-check
bun run build 2>&1 | tail -10
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(protected\)/onboarding/consent/
git commit -m "feat(auth): add /onboarding/consent page

- 서버에서 이미 동의한 유저는 /로 redirect
- 클라이언트에서 ConsentModal → POST /api/auth/consent → 홈"
```

---

### Task 4.4: Terms / Privacy 스텁 페이지

**Files:**
- Create: `src/app/(public)/terms/page.tsx`
- Create: `src/app/(public)/privacy/page.tsx`

- [ ] **Step 1: terms 페이지**

`src/app/(public)/terms/page.tsx`:

```tsx
export const metadata = { title: "이용약관 | 차용" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">이용약관</h1>
      <p className="mt-2 text-sm text-[var(--chayong-text-sub)]">최종 업데이트: 2026-05-08</p>
      <section className="mt-6 text-sm leading-7 text-[var(--chayong-text)]">
        <p>본 약관 본문은 추후 정식 게시될 예정입니다. 서비스 이용에 동의하시는 경우 차용에서 제공하는 중고 승계, 중고 리스/렌트 매물 정보를 열람하고 거래를 위한 채팅·에스크로 등 부가 서비스를 사용하실 수 있습니다.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: privacy 페이지**

`src/app/(public)/privacy/page.tsx`:

```tsx
export const metadata = { title: "개인정보 처리방침 | 차용" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">개인정보 처리방침</h1>
      <p className="mt-2 text-sm text-[var(--chayong-text-sub)]">최종 업데이트: 2026-05-08</p>
      <section className="mt-6 text-sm leading-7 text-[var(--chayong-text)]">
        <p>본 개인정보 처리방침 본문은 추후 정식 게시될 예정입니다. 차용은 서비스 제공에 필요한 최소한의 개인정보(이메일, 이름, 프로필 사진)를 OAuth 공급자(Google, Kakao)로부터 전달받아 처리합니다.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
bun run build 2>&1 | tail -10
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(public\)/terms/ src/app/\(public\)/privacy/
git commit -m "feat(legal): add terms and privacy stub pages

본문은 별도 spec — 현재는 placeholder 문구."
```

---

## Phase 5 — E2E (Playwright)

### Task 5.1: 소셜 버튼 노출 + 모달 사전 검증

**Files:**
- Create: `tests/e2e/social-login-ui.spec.ts`

> OAuth 자체는 외부 의존이라 mock 곤란. UI 노출과 모달 disabled 상태만 검증.

- [ ] **Step 1: 스펙 작성**

`tests/e2e/social-login-ui.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("social login buttons surface", () => {
  test("login page shows Google and Kakao buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google로 로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카카오 로그인" })).toBeVisible();
  });

  test("signup page shows Google and Kakao buttons", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: "Google로 로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카카오 로그인" })).toBeVisible();
  });

  test("login page shows email_exists error message", async ({ page }) => {
    await page.goto("/login?error=email_exists");
    await expect(page.getByText(/이미 다른 방법으로 가입된 이메일/)).toBeVisible();
  });
});
```

- [ ] **Step 2: 실행**

```bash
bun run test:e2e tests/e2e/social-login-ui.spec.ts 2>&1 | tail -20
```
Expected: 3 passed.

- [ ] **Step 3: 커밋**

```bash
git add tests/e2e/social-login-ui.spec.ts
git commit -m "test(e2e): verify social login UI surface on login/signup"
```

---

## Phase 6 — Final Verification

- [ ] **Step 1: 전체 단위 테스트**

```bash
bun run test --run 2>&1 | tail -15
```
Expected: 모든 테스트 PASS, 신규 테스트 7+개 추가됨.

- [ ] **Step 2: 타입체크**

```bash
bun run type-check
```
Expected: 0 errors.

- [ ] **Step 3: 린트**

```bash
bun run lint 2>&1 | tail -10
```
Expected: 0 errors.

- [ ] **Step 4: 프로덕션 빌드**

```bash
bun run build 2>&1 | tail -20
```
Expected: 성공.

- [ ] **Step 5: e2e 전체**

```bash
bun run test:e2e 2>&1 | tail -20
```
Expected: 모든 spec PASS.

- [ ] **Step 6: 검증 요약 푸시**

```bash
git log --oneline -20
git push -u origin worktree-feat+social-login-google-kakao
```

---

## Phase 7 — Manual QA Checklist (Human-only, 사람이 수행)

> 코드 작업과 별개로 다음 환경 설정 + 수동 검증이 필요하다. PR 본문 또는 후속 spec에 결과 기재.

### 환경 설정

- [ ] **GCP**: OAuth 2.0 Client ID 생성, Authorized redirect URI에 `https://<supabase-project>.supabase.co/auth/v1/callback` 등록
- [ ] **Kakao Developers**: 앱 생성 → 카카오 로그인 활성화 → Redirect URI 등록 → 동의 항목에 email 필수
- [ ] **Supabase 대시보드**:
  - Authentication → Providers → Google enable + Client ID/Secret
  - Authentication → Providers → Kakao enable + REST API Key/Secret
  - Authentication → URL Configuration → Site URL & Redirect URLs (dev + prod)

### 시나리오

- [ ] Google 로그인 → 신규 가입 → consent 모달 → 홈 진입
- [ ] Google 재로그인 → 즉시 홈
- [ ] Kakao 로그인 → 신규 가입 → consent 모달 → 홈 진입
- [ ] Kakao 재로그인 → 즉시 홈
- [ ] 이메일로 가입한 계정과 동일 이메일로 Google 로그인 → "이미 다른 방법으로 가입된 이메일" 에러
- [ ] consent 페이지 새로고침 후 직접 `/`로 이동 시도 → middleware 또는 page 가드로 다시 `/onboarding/consent`로 강제
- [ ] 마케팅 동의 false 저장 → DB에서 `marketing_opt_in = false`, `marketing_opt_in_at IS NULL`
- [ ] 모바일 사파리 OAuth redirect 정상

---

## Spec Coverage Self-Check

| Spec 섹션 | 구현 Task |
|----------|-----------|
| §2 User Flow | Phase 2.1 + 2.2 + 4.3 |
| §3 Data Model | Phase 0.1 |
| §4 File Plan | Phase 1~4 전체 |
| §6 UI 사양 | Task 3.2, 3.3 |
| §7 Consent Modal | Task 3.4 |
| §8 API 사양 | Task 2.1, 2.2 |
| §9 Supabase 대시보드 | Phase 7 |
| §10 보안 | Task 1.2, 2.1 |
| §11 Testing | Task 1.1, 1.2, 2.2, 3.4, 5.1 |
| §13 Risks | Phase 7 manual QA |

**Out of scope 확인**: Naver / 마이페이지 연결 / 약관 본문 / 마케팅 철회 UI / audit log / 휴대폰 인증 → Phase 2 spec.
