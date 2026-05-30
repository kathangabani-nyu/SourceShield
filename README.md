# SourceShield

Live **pseudonymous** two-way follow-up for newsroom tips over Linq iMessage, powered by Krava private inference and encrypted memory.

## Quick start

```bash
cp .env.example .env.local
# Fill in Linq, Krava, and Supabase credentials

npm install
npm run dev
```

Run the Supabase migration in [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).

**Supabase project (plugin-provisioned):** see [`docs/supabase-setup.md`](docs/supabase-setup.md) — project ref `bsarszpxxsntohgazmsy`. Copy **service_role** from the dashboard into `.env.local`.

**Cost:** everything is designed for **$0** — see [`docs/free-tier.md`](docs/free-tier.md).

## Deploy to Vercel

```bash
npx vercel
```

Set all env vars from `.env.example`. Register the Linq webhook:

```bash
npm run register-webhook
```

Or see [`docs/api-verification.md`](docs/api-verification.md).

## Demo flow

1. Text the Linq number → card on `/dashboard`
2. Journalist follow-up → safe-question rewrite → iMessage reply
3. Second source → similar-claim count updates
4. Duress language → bot pauses, flag goes high
5. Fallback: `/intake` web path if iMessage is down

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

See [`DECISIONS.md`](DECISIONS.md) for design log.
