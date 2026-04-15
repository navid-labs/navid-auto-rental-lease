# CLAUDE.md — 차용(Chayong) 플랫폼

중고 승계 + 중고 리스/렌트 거래 플랫폼.
"플랫폼은 유입 도구, 계약은 사람이 만든다"

## 읽지 말 것 (토큰 절약)

- `node_modules/`, `.next/`, `dist/`, `build/`, `.git/`, `coverage/`
- `*.log`, `*.lock`
- `prisma/migrations/` (schema.prisma만 참조)
- `.gemini/`, `.omc/`, `.firecrawl/`, `.context/`, `.planning/`

## Package Manager

**Always use `bun`** (not npm/yarn):
- Install: `bun add <package>` / `bun add -D <package>`
- Scripts: `bun run <script>` or `bun <script>`

## Commands

```bash
# Development
bun dev               # Next.js dev (http://localhost:3000)
bun run build         # Production build
bun run lint          # ESLint
bun run type-check    # TypeScript check (tsc --noEmit)

# Testing
bun run test          # Unit tests (vitest) — 주의: `bun test`는 bun 내장 러너
bun run test:e2e      # E2E tests (Playwright)

# Database (PostgreSQL via Prisma + Supabase)
bun run db:generate   # Generate Prisma client
bun run db:push       # Push schema (prisma db push)
bun run db:seed       # Seed database
bun run db:studio     # Open Prisma Studio
```

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL via Prisma 6 (Supabase)
- **Auth**: Supabase Auth (@supabase/ssr)
- **Realtime**: Supabase Realtime (chat)
- **Storage**: Supabase Storage (이미지 업로드)
- **Payment**: 토스페이먼츠 SDK (에스크로)
- **Package Manager**: bun
- **Testing**: Vitest (unit) + Playwright (e2e)

## Project Structure

```
src/
├── app/
│   ├── (public)/              # 공개 페이지 (HOME, LIST, DETAIL, SELL, GUIDE)
│   ├── (auth)/                # 인증 (LOGIN, SIGNUP)
│   ├── (protected)/           # 보호 (CHAT, PAYMENT, MY)
│   ├── admin/                 # 관리자 (대시보드, 리드, 매물, 에스크로)
│   └── api/                   # API routes
│       ├── listings/          # 매물 CRUD + brands + images
│       ├── chat/              # 채팅 rooms/messages/read
│       ├── payment/           # 에스크로 prepare/confirm
│       ├── favorites/         # 찜 toggle + my
│       ├── notifications/     # 알림 list + mark-read
│       ├── admin/             # 관리자 leads/listings/escrow
│       └── upload/            # 이미지 업로드
├── components/
│   ├── ui/                    # shadcn + 차용 공유 (VehicleCard, PriceDisplay, TrustBadge, FilterBar, StepIndicator, ImageUpload)
│   └── layout/                # Header, HeaderAuth, Footer, MobileNav, NotificationBell
├── features/
│   ├── listings/              # 매물 (gallery, cost-calculator, cta-sidebar, share, mobile-cta, grid, advanced-filters, use-favorite hook)
│   ├── chat/                  # 채팅 (room-list, message-area)
│   ├── payment/               # 결제 (escrow-checkout)
│   ├── sell/                  # 매물 등록 (sell-wizard)
│   ├── my/                    # 마이페이지 (dashboard, listing-card)
│   ├── auth/                  # 인증 (login-form, signup-form)
│   └── admin/                 # 관리자 (sidebar, lead-table, listing-admin-table, escrow-admin-table)
├── lib/
│   ├── db/prisma.ts           # Prisma client
│   ├── supabase/              # client.ts, server.ts, auth.ts
│   ├── api/auth-guard.ts      # API 인증/인가 미들웨어 (requireAuth, requireRole)
│   ├── finance/calculations.ts # 비용 계산 (calcTotalAcquisitionCost, checkIsVerified)
│   ├── chat/contact-filter.ts # 연락처 차단 (containsContactInfo, sanitizeMessage)
│   └── utils/format.ts        # 통화 포맷 (formatKRW, formatKRWCompact)
└── types/index.ts             # Prisma 타입 + ListingCardData, ListingWithImages
```

## Database Schema

10개 Prisma 모델:

| 모델 | 역할 |
|------|------|
| Profile | 유저 (BUYER/SELLER/DEALER/ADMIN) |
| Listing | 매물 (TRANSFER/USED_LEASE/USED_RENTAL) |
| ListingImage | 매물 이미지 |
| ChatRoom | 채팅방 (buyer + seller per listing) |
| ChatMessage | 채팅 메시지 (TEXT/IMAGE/SYSTEM) |
| ConsultationLead | 상담 리드 (WAITING/CONSULTING/CONTRACTED) |
| EscrowPayment | 에스크로 결제 (PENDING→PAID→RELEASED/REFUNDED) |
| Favorite | 찜 |
| Notification | 알림 |

## API Security

- **Public**: `GET /api/listings`, `GET /api/listings/[id]`, `GET /api/listings/brands`
- **Auth required**: 나머지 모든 API (requireAuth)
- **Admin only**: `/api/admin/*` (requireRole("ADMIN"))
- senderId/buyerId/sellerId는 항상 세션에서 추출 (body 무시)
- PUT은 allowlist 필드만 업데이트 가능

## Design System

```
Primary:    #3182F6 (토스 블루)
Background: #FFFFFF
Surface:    #F9FAFB
Text:       #111111
Sub Text:   #687684
Caption:    #8B95A1
Divider:    #E5E8EB
Success:    #00C471
Danger:     #F04452
```

CSS vars: `--chayong-primary`, `--chayong-text`, `--chayong-text-sub`, etc.
Font: Pretendard Variable (via `<link>` in layout.tsx)

### UI 원칙
- 월 납입금을 가장 크게 표시 (전체 금액 강조 금지)
- 카드형 UI + shadow-sm + hover:shadow-lg
- 버튼: h-12, rounded-xl, font-semibold, text-[15px]
- 금융 앱 느낌 (토스/카카오뱅크 스타일)

## Environment Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_... (optional, 없으면 테스트 모드)
```

## Code Conventions

- Named exports (default export 지양)
- Server Components by default; `"use client"` 필요할 때만
- `var(--chayong-*)` CSS vars 사용
- API routes: `requireAuth()` / `requireRole()` + try/catch + 입력 검증

### Performance Rules

- 독립 async 호출은 `Promise.all()` 사용
- 대형 라이브러리(100KB+)는 `next/dynamic` import
- 서버 컴포넌트에서 중복 fetch 시 `React.cache()` 사용

## Testing

- **Unit** (29 tests): `src/lib/finance/`, `src/lib/chat/`, `src/lib/utils/`
- **E2E** (20 specs): `tests/e2e/` — navigation, auth, sell wizard, detail

## Concept Designs

- `docs/concept-designs/01-chayong-reference-ui.png`
- `docs/concept-designs/02-chayong-page-wireframes.png`
- `docs/concept-designs/03-chayong-mvp-spec.png`
- `docs/superpowers/specs/2026-04-08-chayong-platform-design.md`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
