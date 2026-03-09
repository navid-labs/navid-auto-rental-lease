# Pitfalls Research

**Domain:** Korean Used Car Rental/Lease Platform (B2B2C Hybrid, Web-First)
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (domain-specific patterns well-documented; Korean market specifics verified through multiple sources)

## Critical Pitfalls

### Pitfall 1: Supabase RLS Misconfiguration Leaking Dealer Data Across Tenants

**What goes wrong:**
In a B2B2C hybrid model, dealers register vehicles and manage their own inventory. If RLS policies are not correctly scoped to `dealer_id` (or `organization_id`), one dealer can read/modify another dealer's vehicles, contracts, and customer data. The default state for new Supabase tables is RLS *disabled* -- every row is publicly accessible through the Supabase API if you forget to enable it.

**Why it happens:**
- Tables created via SQL Editor or migrations without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` are wide open
- Developers test via Supabase SQL Editor which *bypasses* RLS entirely, giving false confidence
- `auth.uid()` returns the user UUID, not the `dealer_id` -- policies must join through a profiles/dealers table or use JWT custom claims, which is a non-obvious indirection
- Enabling RLS without adding policies silently returns empty results (no error), making it look like a query bug rather than a missing policy

**How to avoid:**
- Include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in every migration file as a standard practice
- Create a pre-deployment checklist script that queries `pg_tables` to verify all public tables have RLS enabled
- Always test RLS from the client SDK, never from the SQL Editor
- Index all columns referenced in RLS policies (`user_id`, `dealer_id`, `organization_id`) -- missing indexes are the top RLS performance killer
- Use a `dealer_id` column on all dealer-scoped tables and write policies that filter via `auth.jwt() ->> 'dealer_id'` or a profiles lookup

**Warning signs:**
- Dealer A can see Dealer B's vehicle listings in development
- Empty query results with no error messages after enabling RLS
- RLS policies use `USING (true)` (every logged-in user sees all rows)
- No index on `dealer_id` or `user_id` columns

**Phase to address:**
Phase 1 (Foundation/DB Schema) -- RLS must be baked into every table from day one. Retrofitting RLS on existing tables with data is error-prone and requires re-testing all queries.

---

### Pitfall 2: Vehicle Double-Booking / Race Condition on Status Updates

**What goes wrong:**
Two customers simultaneously request the same vehicle. Both see status "available," both submit contract applications, and now two contracts reference the same car. This is the single most damaging bug for a rental/lease platform -- it destroys trust and creates legal complications.

**Why it happens:**
- Developers rely on application-level checks (`if status === 'available'`) instead of database-level atomicity
- Supabase's default transaction isolation is READ COMMITTED, which allows concurrent reads of stale state
- Realtime subscriptions have latency -- the UI may show "available" for seconds after another user reserves the vehicle

**How to avoid:**
- Use a PostgreSQL advisory lock or `SELECT ... FOR UPDATE` in an RPC function for the reservation flow
- Implement the reservation as a single atomic database function (Supabase Edge Function or `rpc` call) that checks availability and inserts the reservation in one transaction
- Add a `UNIQUE` constraint or a dedicated `reservations` table with a unique constraint on `(vehicle_id, status)` where status is 'active' -- the database itself prevents duplicates
- Use optimistic UI with server-side validation: show "reserving..." immediately but confirm only after the transaction succeeds

**Warning signs:**
- Contract creation logic does a separate SELECT then INSERT (two round trips)
- No database-level constraint preventing two active contracts for the same vehicle
- Test environment only ever has one user, so race conditions never surface

**Phase to address:**
Phase 2 (Contract/Reservation Flow) -- must be designed with concurrency in mind from the start. A naive implementation that works in demo becomes a liability when shown to investors who ask "what if two people book the same car?"

---

### Pitfall 3: Residual Value Calculation That Doesn't Match Korean Market Reality

**What goes wrong:**
The residual value (used for lease pricing) is calculated using a generic depreciation formula (e.g., straight-line 15%/year), but Korean used car pricing follows different patterns: Korean domestic brands depreciate faster in year 1-2 than imported brands, electric vehicles have unpredictable depreciation tied to battery subsidy policy changes, and seasonal market fluctuations (Chuseok, year-end) create 10-15% price swings. The result is lease quotes that are either unprofitable (too generous) or uncompetitive (too conservative).

**Why it happens:**
- Developers treat residual value as a simple math formula when it's actually a market prediction
- Korean used car market data is notoriously unreliable -- "the stock market is more transparent than the Korean used car market" (industry sentiment from multiple sources)
- No single authoritative data source for Korean used car prices by model/year/condition

**How to avoid:**
- For MVP/demo: use a configurable lookup table (make/model/year -> residual percentage) rather than a formula. Admin can adjust values. This is honest about the complexity.
- Do NOT hard-code depreciation rates -- make them admin-editable per vehicle category
- Display residual value as "estimated" with clear disclaimers in the UI
- Plan for v2 integration with market data APIs (e.g., CODEF used car common price info API, Encar price data)
- Separate the residual value engine from the contract flow so it can be replaced without touching contract logic

**Warning signs:**
- A single `depreciationRate` constant in the codebase
- No admin interface to adjust pricing parameters
- Lease quotes for a 2-year-old Hyundai and a 2-year-old BMW use the same depreciation curve

**Phase to address:**
Phase 2-3 (Lease pricing logic) -- the calculation engine should be an isolated service/module from the start. Even for demo, investors will ask "how do you determine the lease price?" and the answer cannot be "fixed 15% per year."

---

### Pitfall 4: Next.js + Supabase Auth Token Mismanagement in SSR/Middleware

**What goes wrong:**
Authentication works in the browser but breaks in server components, middleware, or API routes. Users see flash-of-unauthenticated-content, get logged out randomly, or (worse) see another user's data because the auth context is stale or missing on the server side.

**Why it happens:**
- Using `supabase.auth.getSession()` in server code -- this reads from local storage/cookie without revalidating. Supabase's own docs warn: "Never trust getSession() inside server code."
- Missing or misconfigured middleware that fails to refresh expired tokens and pass them via cookies
- Next.js 15 no longer caches fetch calls by default, so multiple server components each calling `getUser()` result in redundant Supabase auth requests per page load
- The critical Next.js middleware vulnerability (CVE, CVSS 9.1) allows bypass via `x-middleware-subrequest` header in self-hosted deployments (versions 11.1.4-15.2.2)

**How to avoid:**
- Always use `supabase.auth.getUser()` (not `getSession()`) in server contexts -- it revalidates with the Supabase auth server
- Implement middleware exactly per Supabase's official Next.js SSR guide: refresh token via `getUser()`, set cookies on both request and response
- For Next.js 15: cache the `getUser()` result using React's `cache()` function to avoid duplicate auth calls per request
- Deploy on Vercel (as planned) to avoid the self-hosted middleware vulnerability
- Place `middleware.ts` at the project root (or `/src/middleware.ts` if using src directory)

**Warning signs:**
- `getSession()` calls in server components or API routes
- Users intermittently logged out when navigating between pages
- Auth state differs between client and server rendering (hydration mismatch)
- No `middleware.ts` file in the project

**Phase to address:**
Phase 1 (Auth setup) -- this must be correct from the first authenticated page. Auth bugs compound: every feature built on broken auth inherits the problem.

---

### Pitfall 5: Contract State Machine Without Explicit States and Transitions

**What goes wrong:**
The rental/lease contract lifecycle (inquiry -> application -> review -> approved -> active -> returned -> closed) is managed with ad-hoc `if/else` checks scattered across the codebase. Edge cases emerge: what happens when a contract is cancelled mid-review? When a vehicle is returned early? When a lease is extended? Each new case adds spaghetti logic, and the system enters impossible states (e.g., "active" contract on a "returned" vehicle).

**Why it happens:**
- MVP pressure leads to "just add a status column" approach
- The rental vs. lease distinction creates two overlapping but different state machines that aren't explicitly separated
- Developers underestimate the number of states: application_pending, kyc_pending, credit_check, approved, rejected, deposit_pending, active, overdue, early_return, completed, cancelled, disputed -- easily 10+ states with 20+ valid transitions

**How to avoid:**
- Define an explicit state machine with a states enum and a transitions table at the database level
- Create a single `transition_contract_status` RPC function that validates the transition is legal before updating
- Separate rental and lease contract types -- they share some states but diverge (lease has residual value settlement; rental has daily rate recalculation for extensions)
- Log every state transition with timestamp, actor, and reason in an audit trail table
- Reject invalid transitions at the database level (check constraint or trigger), not just in application code

**Warning signs:**
- Contract status is a free-text string rather than an enum
- Multiple places in the codebase update contract status directly via `UPDATE`
- No audit trail of status changes
- "Unknown status" errors in logs

**Phase to address:**
Phase 2 (Contract flow) -- design the state machine before writing any contract UI. The state diagram should be a planning artifact reviewed before implementation.

---

### Pitfall 6: Demo/Investment MVP That Can't Survive a Live Walkthrough

**What goes wrong:**
The MVP looks polished in screenshots but breaks during a live investor demo. Common failure modes: the license plate API is slow (3-5 seconds) with no loading state, mock eKYC flow doesn't handle back-button/refresh, PDF generation times out, vehicle images load slowly, or the "happy path" works but any deviation crashes the app.

**Why it happens:**
- Building features breadth-first (many features, none robust) instead of depth-first (few features, bulletproof)
- Mock flows are implemented as simple UI-only screens with no state persistence -- refreshing the page during eKYC resets everything
- No error handling for external API failures (license plate API down = broken registration flow)
- Testing only the happy path

**How to avoid:**
- Prioritize demo reliability over feature count: 5 flawless features > 15 fragile features
- Implement every mock flow with real state persistence (save step progress to database, survive page refresh)
- Add loading states, error states, and retry mechanisms for every external API call
- Create a "demo mode" flag that uses cached/seeded data for the license plate API to guarantee instant responses during demos
- Build a demo script and test it end-to-end before every presentation, including intentional "what if" detours
- Pre-seed the database with realistic Korean vehicle data (not lorem ipsum)

**Warning signs:**
- No loading spinners or skeleton screens anywhere in the app
- Mock flows lose state on page refresh
- External API calls have no timeout or fallback
- Demo database has 3 test vehicles named "Test Car 1, 2, 3"

**Phase to address:**
Phase 3-4 (Polish/Demo prep) -- but the mindset of "demo survivability" should influence every phase. Each feature should be demo-tested as it's completed.

---

### Pitfall 7: Korean License Plate API Integration Without Fallback Strategy

**What goes wrong:**
The license plate lookup API (likely from data.go.kr or a commercial provider like apick.app/dataapi.co.kr) is the headline demo feature, but public data APIs in Korea are notorious for: rate limiting (often 1,000 calls/day on free tier), slow response times (2-10 seconds), occasional outages without notice, and inconsistent data formats across vehicle types. When the API fails during a demo or goes down in production, the entire vehicle registration flow breaks.

**Why it happens:**
- Single point of failure with no fallback
- Korean public data APIs require explicit "제3자 정보제공 동의" (third-party consent) for owner-linked queries, which is often overlooked in development
- API keys for data.go.kr have daily quotas that are easy to exhaust during development/testing
- Response format varies between vehicle types (commercial, personal, electric)

**How to avoid:**
- Cache successful API responses in the database -- vehicle specs don't change, so cache aggressively (VIN/plate -> specs mapping)
- Implement graceful degradation: if API fails, show manual input form for vehicle details
- Create a "demo seed" of 20-30 real vehicle lookups cached locally for guaranteed demo performance
- Monitor API quota usage and implement rate limiting on your end
- Handle all response format variations explicitly; don't assume a consistent schema
- Have a backup commercial API provider identified (CODEF, apick.app) in case the primary fails

**Warning signs:**
- No cached responses in the database
- 500 errors when the external API is down
- API key hardcoded or stored in client-side code
- No rate limiting on the lookup endpoint

**Phase to address:**
Phase 2 (Vehicle registration) -- the API integration layer should be built with caching and fallback from day one, not bolted on later.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip RLS during prototyping | Faster development, no policy debugging | Complete security rewrite needed, data leaks between dealers | Never -- even in MVP, dealer data isolation is table stakes |
| Single `vehicles` table for both dealer and company-owned inventory | Simpler schema | Complex queries, ambiguous ownership, different business rules for each type crammed into one model | MVP only if `owner_type` enum column is added from the start |
| Storing vehicle images as base64 in the database | No storage bucket setup needed | DB bloat, slow queries, no CDN, no image transformation | Never |
| Free-text contract status instead of enum | Quick to change | Invalid states, no transition validation, impossible to audit | Never |
| Hardcoded lease terms (12/24/36 months) | Faster UI development | Business cannot adjust offerings without code deploy | MVP only -- must be admin-configurable before launch |
| Single user role check in middleware only | Simple auth | Role changes require middleware updates, no fine-grained permissions | MVP only -- plan migration to policy-based auth |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| License Plate API (data.go.kr) | Not handling the consent requirement (소유자 동의) -- some endpoints require explicit owner consent before returning data | Understand which endpoints require consent vs. which return public vehicle specs only; design the UX flow accordingly |
| License Plate API | Assuming consistent JSON schema across all vehicle types | Parse defensively; use TypeScript discriminated unions or Zod schemas with `.optional()` for all fields |
| Supabase Storage (vehicle photos) | Uploading original 5MB+ photos from dealers without compression | Validate file size on upload (max 2MB), compress client-side before upload, use Supabase Image Transformations for serving (Pro plan) |
| Supabase Auth | Using `signInWithOAuth` without configuring redirect URLs for all environments (local, preview, production) | Set redirect URLs in Supabase dashboard for localhost:3000, Vercel preview URLs (*.vercel.app), and production domain |
| PDF generation (contract) | Server-side PDF generation timing out on Vercel's serverless functions (10s limit on Hobby plan) | Use lightweight PDF libs (e.g., jsPDF on client side or @react-pdf/renderer), or pre-generate templates and fill in data |
| Mock eKYC flow | Building the mock as a completely separate flow from the planned real integration | Design the mock with the same interface/data contract the real eKYC provider (e.g., USEB/CLOVA) will use, so v2 is a drop-in replacement |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all vehicles without pagination | Page loads fine with 20 test vehicles | Implement cursor-based pagination from the start; use Supabase `.range()` | 500+ vehicles (typical for a multi-dealer platform) |
| No image optimization pipeline | Demo loads fast with 5 vehicles | Use Supabase Image Transformations or Next.js `<Image>` with width/height; serve WebP | 50+ vehicles with 5-10 photos each |
| RLS policies with complex joins but no indexes | Queries return in <100ms with 100 rows | Add indexes on all foreign keys and columns used in RLS `USING` clauses | 10,000+ rows per table |
| Fetching vehicle list + details in waterfall (N+1) | Unnoticeable with 10 vehicles | Use Supabase's `select('*, dealer(*), images(*)')` to eager-load relations | 100+ vehicles on search results |
| Supabase Realtime subscriptions without cleanup | Works fine in development | Unsubscribe in `useEffect` cleanup; respect Supabase Realtime limits (concurrent connections) | 50+ concurrent users |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing vehicle owner personal data (name, phone) through the API | Privacy law violation (Korean Personal Information Protection Act / 개인정보보호법) | RLS policies that restrict owner data to authorized roles only; never return owner PII in public vehicle listings |
| Storing Korean resident registration numbers (주민등록번호) for eKYC | Even mock flows that collect real 주민번호 create a legal liability; collection is restricted by law | Mock eKYC must explicitly state "this is a simulation" and use fake data patterns (e.g., 000000-0000000) |
| API keys for license plate API exposed in client-side code | Quota exhaustion, unauthorized usage, potential API provider termination | All external API calls must go through server-side routes (Next.js API routes or Supabase Edge Functions) |
| No rate limiting on vehicle search/contract submission endpoints | Scraping of entire vehicle inventory; spam contract applications | Implement rate limiting via Vercel Edge Middleware or Supabase Edge Functions |
| Dealer accounts sharing a single login | No audit trail; one dealer staff action attributed to another | Require individual accounts per dealer staff member; implement `dealer_id` + `user_id` separation |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing lease monthly payment without total cost breakdown | Users feel deceived when they discover total cost is much higher; erodes trust | Always show: monthly payment, total cost, residual value, and fees breakdown side by side |
| Complex vehicle search filters visible by default on mobile | Filter UI dominates mobile screen; users can't see vehicles | Collapsible filter panel; show 2-3 key filters (price, brand, year) with "more filters" expandable |
| Multi-step contract flow without progress indicator | Users abandon mid-flow not knowing how many steps remain | Clear step indicator (1/5, 2/5...) with ability to go back; persist completed steps |
| No "compare vehicles" feature in MVP | Core user behavior in Korean market -- users compare 2-3 options before deciding | Include a simple side-by-side comparison (specs + monthly payment) as a table-stakes feature |
| Korean vehicle naming conventions ignored | "Hyundai Sonata" instead of "현대 쏘나타" feels foreign to Korean users | Use Korean brand/model names as primary display; English as secondary |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Vehicle listing:** Often missing -- filter state not preserved in URL (user shares link, recipient sees unfiltered results). Verify: copy URL with active filters, open in incognito, confirm filters apply.
- [ ] **Contract PDF:** Often missing -- Korean-specific formatting (won currency with comma separators, Korean date format YYYY년 MM월 DD일, contract party names in Korean). Verify: generated PDF uses correct locale formatting.
- [ ] **Role-based access:** Often missing -- admin can access dealer-only routes (and vice versa) by directly navigating to the URL. Verify: manually type restricted route URLs while logged in as wrong role.
- [ ] **Vehicle status sync:** Often missing -- vehicle shows "available" on listing page but is already reserved. Verify: reserve a vehicle in one browser, check listing in another browser immediately.
- [ ] **Mobile responsive contract flow:** Often missing -- multi-step form works on desktop but inputs overlap or are unreachable on mobile. Verify: complete entire contract flow on a 375px-wide mobile viewport.
- [ ] **Error states for external APIs:** Often missing -- license plate API timeout shows blank screen instead of error message with retry option. Verify: disconnect network, attempt license plate lookup, confirm graceful error.
- [ ] **Dealer dashboard data isolation:** Often missing -- dealer analytics show aggregate data across all dealers instead of only their own. Verify: log in as Dealer A, confirm statistics only reflect Dealer A's vehicles and contracts.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS not enabled on tables | MEDIUM | Audit all tables with `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` cross-referenced with RLS status; enable RLS; add policies; re-test all queries from client SDK |
| Double-booking occurred | HIGH | Implement advisory lock RPC immediately; audit all existing contracts for duplicates; notify affected customers; add unique constraint on active reservations |
| Residual value formula producing bad quotes | LOW | Switch to lookup table approach; admin manually sets residual percentages per category; flag existing quotes for review |
| Auth token issues causing logout | MEDIUM | Replace all `getSession()` with `getUser()`; add proper middleware; implement React `cache()` wrapper; test server-side auth flow end-to-end |
| Contract in impossible state | HIGH | Add state transition audit log retroactively; write migration to fix invalid states; implement state machine validation; prevent further invalid transitions |
| License plate API down during demo | LOW | Pre-seed cache with demo vehicles; add fallback manual input form; implement cached response lookup before API call |
| Investor demo crashes | MEDIUM | Create isolated demo environment with seeded data; build demo script with practiced fallback paths; add "demo mode" environment variable that uses cached data |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS misconfiguration | Phase 1: DB Schema & Auth | Run automated RLS audit query before each deployment; test as each role from client SDK |
| Double-booking race condition | Phase 2: Vehicle & Contract Flow | Write concurrent booking test (two simultaneous requests for same vehicle); verify only one succeeds |
| Residual value inaccuracy | Phase 2-3: Lease Pricing | Review quotes for 5 different vehicle categories with domain expert; verify admin can adjust rates |
| Auth token mismanagement | Phase 1: Auth Setup | Test auth flow: login -> navigate 5 pages -> wait 1 hour -> navigate again; verify no logout |
| Contract state machine chaos | Phase 2: Contract Flow | Enumerate all states and transitions in a diagram; verify each transition via API; confirm invalid transitions are rejected |
| Demo survivability | Phase 4: Polish & Demo Prep | Run full demo script 3 times consecutively; include intentional "wrong" actions; verify graceful recovery |
| License plate API fragility | Phase 2: Vehicle Registration | Test with API disabled (env var); verify fallback works; test with slow API (artificial 10s delay); verify loading state |
| Korean locale formatting | Phase 3: UI Polish | Audit all displayed numbers (currency), dates, and names for Korean formatting |
| Vehicle photo performance | Phase 2-3: Vehicle Listing | Load listing page with 50+ vehicles on throttled 3G connection; verify < 3s meaningful paint |
| PII/Privacy compliance | Phase 1: Schema Design | Review all tables for PII columns; verify RLS prevents unauthorized PII access; confirm mock eKYC doesn't store real data |

## Sources

- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) - RLS production patterns
- [Supabase Official: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - getUser() vs getSession() guidance
- [Supabase Discussion #30334](https://github.com/orgs/supabase/discussions/30334) - SERIALIZABLE isolation for race conditions
- [Supabase Troubleshooting Next.js Auth](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) - Auth issue patterns
- [Car Rental App Development Challenges](https://medium.com/@sumanta_93769/car-rental-app-development-top-challenges-and-practical-solutions-57cbf60c3919) - Platform development pitfalls
- [Korean Used Car Market Analysis](https://www.the-stock.kr/news/articleView.html?idxno=16074) - Market data reliability issues
- [CODEF Used Car Price API](https://developer.codef.io/products/etc/each/clm/used-car-common-price-info) - Korean market price data source
- [Apick Vehicle Info API](https://apick.app/dev_guide/get_car_info) - License plate lookup service
- [Korean Public Data Portal - Vehicle API](https://www.data.go.kr/data/15071233/openapi.do) - Government vehicle data API
- [Supabase Storage Optimizations](https://supabase.com/docs/guides/storage/production/scaling) - Image optimization guidance
- [전자신문: 장기렌탈 시장 규제 문제](https://www.etnews.com/20251022000227) - Korean rental/lease regulatory landscape

---
*Pitfalls research for: Korean Used Car Rental/Lease Platform (Navid Auto)*
*Researched: 2026-03-09*
