# navid-auto-rental-lease (차용) routing rules

Generic rules: `$HARNESS_HOME/ONTOLOGY.md`. Repo-specific overrides:

| Path glob                                                                                          | Owner                   | Reviewer     | Human    |
| -------------------------------------------------------------------------------------------------- | ----------------------- | ------------ | -------- |
| `src/components/**`, `src/app/(public)/**`, `src/app/(auth)/**`                                    | codex-fast              | codex-strict | no       |
| `src/features/**` (non-payment, non-admin, non-auth, non-sell)                                     | codex-fast              | codex-strict | optional |
| `src/features/sell/**`                                                                             | codex-strict            | claude       | optional |
| `src/app/api/listings/route.ts` (GET only)                                                         | codex-fast              | codex-strict | no       |
| `src/app/api/listings/brands/**` (GET only)                                                        | codex-fast              | codex-strict | no       |
| `src/app/api/listings/[id]/route.ts` (GET only)                                                    | codex-fast              | codex-strict | no       |
| `src/app/api/listings/**` (POST/PUT/DELETE — status/isVerified/ownership/finance mutation)         | codex-strict            | claude       | yes      |
| `src/app/api/listings/[id]/images/**`                                                              | codex-strict            | claude       | yes      |
| `src/app/api/favorites/**`, `src/app/api/notifications/**`, `src/app/api/reviews/**`               | codex-fast              | codex-strict | optional |
| `src/app/api/sell/**`                                                                              | codex-strict            | claude       | yes      |
| `src/app/api/upload/**`                                                                            | codex-strict            | claude       | yes      |
| `src/app/api/chat/**`                                                                              | codex-strict            | claude       | yes      |
| `src/lib/chat/contact-filter.ts`                                                                   | codex-strict            | claude       | yes      |
| `src/lib/api/auth-guard.ts`, `src/lib/supabase/auth.ts`, `src/lib/supabase/**`                     | codex-strict            | claude       | yes      |
| `src/lib/finance/**`                                                                               | codex-strict            | claude       | yes      |
| `src/app/api/payment/**`                                                                           | codex-strict            | claude       | yes      |
| `src/app/api/admin/**`, `src/app/admin/**`, `src/features/admin/**`                                | codex-strict            | claude       | yes      |
| `prisma/schema.prisma`                                                                             | codex-strict            | claude       | yes      |
| `prisma/migrations/**`                                                                             | claude                  | optional     | yes      |
| `tests/**`, `src/**/*.test.ts`, `src/**/*.test.tsx`                                                | codex-fast              | codex-strict | no       |
| `*.md`, `.harness/**`, `CLAUDE.md`, `AGENTS.md`, `.tasks/**`                                       | claude                  | optional     | no       |
| any task touching > 1 file                                                                         | claude must split first | n/a          | n/a      |

> **Package manager**: `AGENTS.md`와 `CLAUDE.md` 모두 **`bun`**으로 통일 (2026-05-06 정합화 완료).

## Risk-tier rationale (차용 도메인)

- **에스크로 / payment** — 토스페이먼츠 SDK 연동, 환불·분쟁 상태 머신. 상태 전이 invariant: `PENDING → PAID → RELEASED | REFUNDED | DISPUTED` (역행 금지). 모든 confirm/release/refund는 (1) idempotent, (2) PG `pgPaymentKey + pgOrderId` 검증, (3) `totalAmount` 검증, (4) 중복 호출 차단(409 PENDING-only) 필수. `payment/**` + `admin/escrow/**` + `EscrowStatus` enum + 매물 `RESERVED → SOLD` 전환은 cross-cutting이므로 단일 PR에서 다루기 금지(claude split).
- **upload (`/api/upload`)** — `bucket`과 `folder`를 클라이언트 formData로 받아 Supabase Storage에 직접 쓰고 public URL 반환. 임의 버킷 접근, path traversal(`folder=../`), 확장자 위장(MIME만 검증, 매직넘버 미검증)을 막는 게 critical. 정책 변경은 human checkpoint 필수.
- **인증 / 인가** — `requireAuth()` / `requireRole()`은 모든 API의 단일 게이트. Supabase SSR 쿠키 흐름 변경, `auth.users` 동기화, profile 매핑 변경은 전 권한이 깨질 수 있음.
- **finance/calculations** — 월 납입금·총 인수 비용·승계 수수료·잔여 납입 계산. 매물 표기 가격에 직결되므로 strict + human.
- **contact-filter** — 차용은 플랫폼 안에서 거래 발생을 강제. 우회되면 비즈니스 모델 붕괴. 텍스트뿐 아니라 (a) 이미지 메시지 내 연락처(향후 OCR), (b) Supabase Realtime payload, (c) 클라이언트/서버 sanitize 일관성, (d) 한국 전화번호 변형(공백·하이픈·"공일공"·이모지 치환)까지 routing 결정 시 함께 검토.
- **admin** — 매물 승인(`isVerified`, `rejectionReason`, `inspectedBy`), 리드 상태 변경, 에스크로 release. 권한 누락 시 데이터 노출/자금 이동.
- **listings mutation** — POST/PUT/DELETE는 `status`, `isVerified`, `sellerId` ownership, finance 필드(`monthlyPayment`, `remainingMonths`, `transferFee`), 차량 식별(`plateNumber`, `vin`)을 건드릴 수 있어 strict. GET은 RLS + public read이므로 fast.
- **sell wizard / api/sell** — 매물 등록 흐름 전체. 사용자 입력이 그대로 listing이 되므로 검증·이미지 업로드·draft 상태 처리에 strict.
- **chat (room/message API)** — 라우팅 자체는 단순하지만 buyer/seller 격리·메시지 sanitize·이미지 메시지 처리가 핵심.
- **public/components/features (대부분)** — UI/UX 변경 위주, 회복 가능. Fast + strict review.
- **prisma/migrations** — 운영 DB 스키마 변경. 항상 사람이 직접 작성·승인. Codex 손대지 않음.

## Cross-cutting invariants (claude split 강제)

다음 변경은 단일 TASK로 묶지 말고 claude가 미리 split:

1. **에스크로 상태 머신** — `payment/**` + `admin/escrow/**` + `Listing.status (RESERVED/SOLD)` + `Notification(ESCROW_STATUS)`는 함께 변경되어야 일관됨. 한 번에 한 파일만 건드리는 단일 TASK는 불가능에 가까움.
2. **인증 흐름 변경** — `auth-guard.ts` + `supabase/server.ts` + `(protected)/layout.tsx` 동시 영향. 한 파일 수정이 다른 파일의 invariant를 깰 수 있음.
3. **매물 승인 파이프라인** — `admin/listings approve` + `Listing.status (PENDING→ACTIVE)` + `Notification(LISTING_APPROVED)` + 매물 카드 노출 조건 동시 변경.
4. **연락처 필터 강화** — `contact-filter.ts` + `chat/messages POST` + 클라이언트 sanitize hook + 테스트. 일부만 강화하면 우회 가능.

## Decision Layer (Layer 1.5)

- `.harness/scripts/agent-loop.sh` runs `.harness/scripts/decision-review.sh` before each Codex Fast dispatch.
- TASK cards with `sub_boundary: <X>` require `.handoff/SUB-<X>.decision.json` with `verdict: pass` before dispatch (Rule 1).
- Re-dispatch after `.handoff/<TASK>.review.json` has `verdict: fail` requires `.handoff/<TASK>.override.json` plus an existing follow-up TASK path (Rule 2).
- Rule 3 (defer rate threshold)는 차용 컨텍스트에서 사용하지 않음 (inventory 배치 없음).

## Codex Fast Permission Boundary

Codex Fast may be granted broad write access for single-file product work, but it must not own its own routing, task definition, or override artifacts.
Codex Fast must remain an execution lane, not a second planner/orchestrator.
Do not install or use Superpowers, OMC, gstack, ralph-loop, autopilot, or
Claude-style planning plugins as Codex execution tools. Claude and Codex
connect through `.tasks`, `.handoff`, and `decision-brief.md` artifacts only.

| Path glob                                                              | Codex Fast                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| `src/**`, `tests/**`, `docs/**`                                        | allowed through single-file TASK + Strict review |
| `.harness/**`, `$HARNESS_HOME/**`                                      | protected — Claude/human only                    |
| `.tasks/**`                                                            | protected — Claude/human only                    |
| `.handoff/*.override.json`, `.handoff/SUB-*.decision.json`             | protected — Claude/human only                    |
| auth/payment/admin/finance/contact-filter/upload/sell paths            | human checkpoint required                        |

**Forbidden reads (모든 Codex 프로파일):**

- 시크릿: `.env*`
- 빌드/캐시: `node_modules/**`, `.next/**`, `dist/**`, `build/**`, `coverage/**`
- DB 마이그레이션: `prisma/migrations/**` (schema.prisma만 참조)
- 다른 도구 산출물: `.gemini/**`, `.omc/**`, `.firecrawl/**`, `.context/**`, `.planning/**`
- 로그/락: `*.log`, `*.lock`

**Stack reminders for Codex (차용):**

- Package manager is `bun` (NOT npm/yarn/npx). `AGENTS.md`와 `CLAUDE.md` 모두 bun으로 통일.
- Dev server runs on http://localhost:3000.
- Type-check: `bun run type-check`. Lint: `bun run lint`. Test: `bun run test`. E2E: `bun run test:e2e`.
- DB: PostgreSQL via Prisma 6 + Supabase. 직접 SQL은 `bun run db:studio` (Prisma Studio)로만.
- 매물(Listing) public GET 외 모든 API는 `requireAuth()` 필수, admin은 `requireRole("ADMIN")`.
- senderId/buyerId/sellerId는 항상 세션에서 추출 (request body 무시). PUT은 allowlist 필드만.

## Single Entry Point

`.harness/scripts/orchestrate.sh` is the canonical entry point for batch
runs. It runs `codex-env-check.sh`, dispatches `owner: codex-fast` TASKs
via `agent-loop.sh`, then runs `decision-brief.sh`. Always reads
`.handoff/decision-brief.md` first; raw `*.exec.json` / `*.review.json`
/ `*.diff` are second-tier sources for flagged tasks only.
