# SourceShield

Live **pseudonymous** two-way follow-up for newsroom tips over Linq iMessage, powered by Krava private inference and encrypted memory.

## Quick start

```bash
cp .env.example .env.local
# Fill in Krava, Supabase (service_role), optional Linq + dashboard secrets

npm install
npm run dev
```

Run **all** Supabase migrations in order:

1. [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
2. [`supabase/migrations/002_tips_realtime_rls.sql`](supabase/migrations/002_tips_realtime_rls.sql)
3. [`supabase/migrations/003_privacy_and_suggestions.sql`](supabase/migrations/003_privacy_and_suggestions.sql) — drops anon `tips` read, adds `next_safe_question`

See [`docs/supabase-setup.md`](docs/supabase-setup.md) — project ref `bsarszpxxsntohgazmsy`.

**Cost:** everything is designed for **$0** — see [`docs/free-tier.md`](docs/free-tier.md).

## Krava key invalid?

If `KRAVA_APP_KEY` is set but returns `401 unauthorized:platform`, intake **falls back to mock** (same as no key) so `/intake` and the dashboard still work. Fix the key with `npm run krava:doctor` when sponsors are available.

## Deploy to Vercel

```bash
npx vercel
```

Set all env vars from `.env.example`, including **`DASHBOARD_SECRET`** and **`INTERNAL_WORKER_SECRET`** on production. Register the Linq webhook when keys arrive:

```bash
npm run register-webhook
```

Or see [`docs/api-verification.md`](docs/api-verification.md).

## Demo flow (no Linq)

1. `/intake` → submit tip → card on `/dashboard` (polls every 4s)
2. Select card → **Preview rewrite (dry-run)** with an unsafe question
3. Optional: seed corroboration cards (see below)

With Linq configured, step 2 sends via iMessage instead of dry-run.

## Seed demo data

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Authorization: Bearer $INTERNAL_WORKER_SECRET"
```

## Architecture

- `POST /api/linq/webhook` — ACK-first ingress (HMAC verify + dedupe)
- `POST /api/linq/process` — background worker (Krava LLM + Linq reply)
- Raw transcripts → Krava encrypted memory only
- App DB → sanitized summaries, duress signals, claim fingerprints
- `GET /api/tips` + follow-up — protected by `DASHBOARD_SECRET` on production

See [`DECISIONS.md`](DECISIONS.md) for design log.
