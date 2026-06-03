# SourceShield — Supabase project

Created via the **Supabase Cursor plugin**.

| Field | Value |
|-------|-------|
| Project name | SourceShield |
| Project ref | `bsarszpxxsntohgazmsy` |
| Region | us-east-1 |
| API URL | `https://bsarszpxxsntohgazmsy.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/bsarszpxxsntohgazmsy |

## Migrations applied (via plugin)

1. `initial_sourceshield_schema` — `linq_events`, `source_channels`, `tips`, `outbound_messages`, Realtime on `tips`
2. `tips_realtime_rls` — RLS on all tables (historical; anon read removed in step 3)
3. `privacy_and_suggestions` — **drops** `anon_read_tips` (no `linq_chat_id` leak via anon key); adds `next_safe_question`. Dashboard polls `/api/tips` (service role server-side).

Local SQL mirrors: [`supabase/migrations/`](../supabase/migrations/)

## What you still need to do (one manual step)

The plugin can fetch the **anon** key but **not** the **service_role** key. You need it for the webhook worker and API routes.

1. Open [Project Settings → API](https://supabase.com/dashboard/project/bsarszpxxsntohgazmsy/settings/api)
2. Copy **Project URL**, **anon public**, and **service_role** (secret)
3. Paste into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bsarszpxxsntohgazmsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret from dashboard>
```

Also set on **Vercel** (same three vars) before production deploy.

## Verify

```bash
npm run dev
curl http://localhost:3000/api/tips
# → {"tips":[]} when empty

curl -X POST http://localhost:3000/api/seed \
  -H "Authorization: Bearer $INTERNAL_WORKER_SECRET"
# → seeded corroboration tips
```

## Security note

Migration **003** drops `anon_read_tips` so the browser anon key cannot read `linq_chat_id` or other tip columns. The dashboard loads tips via **`GET /api/tips`** (service role server-side), optionally gated by **`DASHBOARD_SECRET`** on production. Sensitive tables (`linq_events`, `source_channels`, `outbound_messages`) deny anon access.
