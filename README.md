# Kirayadar — Build Rental Trust. On Both Sides.

> A rental payment recording and reliability scoring platform for Pakistani renters and landlords.

---

## The Problem

In Pakistan, **millions of tenants pay rent on time, every month — but have nothing to show for it.**

When they apply for a new rental, landlords have no way to verify their reliability. References are informal. Disputes are common. Good tenants lose out to bad first impressions, and landlords take on unknown risk with every new tenant.

There is no rental history. No record. No trust layer.

---

## The Users

**Tenants** — salaried professionals, students, and self-employed individuals paying Rs. 20,000–150,000/month. They want to build a verifiable track record that proves they are reliable, so future landlords say yes faster.

**Landlords** — property owners managing 1–10 units. They want confidence before handing over keys, and a simple way to verify payments without chasing receipts.

---

## The Solution

**Kirayadar** is a two-sided platform where:

1. **Tenants record rent payments** — via JazzCash, Easypaisa, bank transfer, or Raast — with reference numbers as proof.
2. **Landlords confirm payments** — a one-tap verification that locks in the record.
3. After 3+ confirmed payments, a **Kirayadar Score (300–850)** is generated — a rental reliability score, not a credit score.
4. Landlords can **screen any tenant by phone number** before accepting them.

No real money moves through the platform. No payment gateway license required. The value is in the **verified record**, not the transaction.

---

## Kirayadar Score

| Band | Range | Meaning |
|---|---|---|
| Building | 300–579 | Early history, limited data |
| Fair | 580–669 | Some late payments or short tenure |
| Good | 670–739 | Mostly on time, decent history |
| Excellent | 740–799 | Reliable, consistent payer |
| Exceptional | 800–850 | Perfect record, long tenure |

**Score formula:**
```
raw = onTimeRate×0.40 + tenureFactor×0.25 + amountConsistency×0.15 + verificationLevel×0.20
score = 300 + round(raw × 550)
```

Payment weight: `0.5` (pending, unconfirmed) → `1.0` (landlord-confirmed). Only confirmed payments count toward the score at full weight.

---

## Key Design Decisions

**1. Two-step confirmation, not self-reported data**
Tenants record payments; landlords confirm them. This prevents fraud — a tenant cannot inflate their own score. The landlord's confirmation is what gives the record its credibility.

**2. No real money movement**
The platform records *proof* of payment (reference numbers from JazzCash/Easypaisa/bank), not the payment itself. This removes all regulatory and licensing complexity while delivering the same trust signal.

**3. Score minimum of 3 confirmed payments**
A single confirmed month means nothing statistically. Three months is the minimum meaningful pattern. This prevents gaming with one-off payments.

**4. Dual user roles with distinct visual identities**
Tenants see emerald green; landlords see blue. This is intentional — the two roles have entirely different workflows and mental models. Color prevents disorientation when demoing or switching roles.

**5. OTP auth, phone-first**
Pakistan's internet users are mobile-first. Phone number is the universal identifier. No email required, no password to forget.

---

## Demo Accounts

All accounts use OTP `0000`.

| Phone | Name | Role | Score |
|---|---|---|---|
| 03000000001 | Hamza Khan | Tenant | ~782 Excellent |
| 03000000002 | Ahmad Raza | Landlord | — |
| 03000000003 | Sana Malik | Tenant | ~641 Fair |
| 03000000004 | Bilal Ahmed | Tenant | ~578 Building |

---

## Tech Stack

- **Next.js 16** App Router — React Server Components + Server Actions
- **Prisma 7** + `@prisma/adapter-pg` — PostgreSQL via Supabase
- **Tailwind v4** + **shadcn/ui** — component library
- **Recharts** — score history chart
- **Zod v4** — server-side validation
- **Cookie sessions** — HMAC-signed, httpOnly, no JWT

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
# Create .env.local with:
# DATABASE_URL=postgresql://...
# SESSION_SECRET=your-secret

# 3. Push schema + seed demo data
npx prisma db push
npx prisma db seed

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Connect this GitHub repo in Vercel
2. Add environment variables in Vercel project settings:
   - `DATABASE_URL` — your Supabase session pooler URL
   - `SESSION_SECRET` — any long random string
3. Deploy — `prisma generate` runs automatically via `postinstall`

> Use the **Session Pooler** URL from Supabase (not the direct connection) — Vercel's serverless functions require it.
