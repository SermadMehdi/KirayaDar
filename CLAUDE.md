@AGENTS.md

# Kiraya Score — Developer Reference

## Product
Rental payment recording and reliability scoring platform for Pakistani renters (Rs. 20k-150k/mo).
Tenants record rent payments via JazzCash/Easypaisa/bank/Raast, landlords confirm, after 3+ confirmed
payments a Kiraya Score (300-850) is generated. No real money movement, no gateway, no license needed.

## TERMINOLOGY — NEVER VIOLATE
- NEVER use: "credit score", "credit report", "credit bureau"
- ALWAYS use: "Kiraya Score", "Rental Reliability Report", "rental payment platform"

## Stack (EXACT VERSIONS — DO NOT UPGRADE)
- Next.js **16.2.4** App Router, TypeScript (strict off)
- Tailwind v4 + shadcn/ui (Base UI flavor) — Button uses @radix-ui/react-slot for asChild
- Prisma **7.7.0** + SQLite via @prisma/adapter-better-sqlite3 (NOT the legacy schema url= approach)
- Recharts, Zod v4, date-fns, lucide-react
- Cookie sessions (httpOnly, HMAC) — mocked OTP "0000"
- NO: AI, Stripe, real SMS, Redux, tRPC, Docker, tests, NextAuth/Clerk

## Critical Prisma 7 Facts
- Schema has NO `url` field in datasource — url lives in `prisma.config.ts`
- Database file is at `./dev.db` (project ROOT, not ./prisma/dev.db)
- Generator: `prisma-client` (not `prisma-client-js`), output → `src/generated/prisma/`
- Import client: `import { PrismaClient } from "@/generated/prisma/client"`
- Instantiate with adapter: `new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) } as any)`
- Zod v4: use `.issues[0].message` NOT `.errors[0].message`
- Seed: `npx prisma db seed` (configured in prisma.config.ts migrations.seed = "tsx prisma/seed.ts")

## Critical Next.js 16 Facts
- Middleware file is `src/proxy.ts` (NOT middleware.ts — deprecated in v16)
- Export function named `proxy()`, not `middleware()`
- proxy.ts runs in Edge Runtime — use `src/lib/auth-edge.ts` (Web Crypto API), NOT `src/lib/auth.ts` (Node crypto)
- `useSearchParams()` must be wrapped in `<Suspense>` boundary

## File Structure
```
src/
  app/
    page.tsx                   # Landing
    login/page.tsx
    signup/page.tsx
    tenant/
      layout.tsx               # Session guard
      dashboard/page.tsx
      score/page.tsx           # Kiraya Score page
      tenancies/page.tsx
      tenancies/new/page.tsx
      tenancies/[id]/page.tsx
      pay/[tenancyId]/page.tsx # Core payment flow
    landlord/
      layout.tsx
      dashboard/page.tsx
      confirm/page.tsx         # Confirm tenancies + payments
      screen/page.tsx          # Check tenant score by phone
  components/
    navbar.tsx, tenancy-card.tsx, payment-row.tsx
    score-display.tsx, score-breakdown.tsx, score-chart.tsx
    empty-state.tsx
    ui/                        # shadcn components
  lib/
    db.ts                      # Prisma singleton
    auth.ts                    # Node.js crypto session (server only)
    auth-edge.ts               # Web Crypto session (proxy/edge)
    score.ts                   # Deterministic score algorithm
    format.ts                  # formatPKR, formatDate
    validation.ts              # Zod schemas
    actions/
      auth.ts, tenancies.ts, payments.ts, user.ts
  proxy.ts                     # Route protection
prisma/
  schema.prisma                # Models: User, Property, Tenancy, Payment, KirayaScore
  seed.ts                      # Run: npx prisma db seed
  dev.db                       # NOT here — actual db is ./dev.db at project root
```

## Score Algorithm (src/lib/score.ts)
- Needs ≥3 confirmed payments; returns null otherwise
- raw = onTimeRate×0.4 + tenureFactor×0.25 + amountConsistency×0.15 + verificationLevel×0.20
- score = 300 + round(raw × 550)
- Bands: 300-579 Building(red) | 580-669 Fair(yellow) | 670-739 Good(blue) | 740-799 Excellent(green) | 800-850 Exceptional(purple)
- Payment weight: 0.5 pending, 1.0 confirmed

## Auth
- OTP always "0000" — // MOCK: replace with real OTP in production
- Session cookie: kiraya_session, httpOnly, signed with SESSION_SECRET from .env.local
- SERVER_SECRET default: "kiraya-dev-secret" (set in .env.local)

## Code Rules
- Server Actions for mutations in /lib/actions/*; return {ok, data} | {ok: false, error}
- All Prisma access through /lib/db.ts
- Absolute imports: "@/lib/..."
- No default exports except pages/layouts
- Money: "Rs. 85,000" via formatPKR(); Dates: "15 Aug 2025" via formatDate()

## Demo Accounts (seed is idempotent, re-run anytime)
| Phone       | Name        | Role     | Score   |
|-------------|-------------|----------|---------|
| 03000000001 | Hamza Khan  | tenant   | ~780    |
| 03000000002 | Ahmad Raza  | landlord | —       |
| 03000000003 | Sana Malik  | tenant   | ~640    |
| 03000000004 | Bilal Ahmed | tenant   | ~580    |

## Quick Start
```bash
npm install
npx prisma db seed   # re-seeds demo data
npm run dev          # http://localhost:3000
```
