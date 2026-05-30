# Free tier — no paid services

SourceShield is built to stay on **$0/month** infrastructure for the hackathon demo.

## Confirmed $0 (as of setup)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Supabase** (SourceShield) | Free | **$0/mo** | Plugin reported `$0` at project creation. Ref: `bsarszpxxsntohgazmsy` |
| **Vercel** | Hobby | **$0** | Deploy the Next.js app only on the free Hobby plan — do not enable Pro/Teams |
| **Linq** | Hackathon/sponsor | **$0** | Use credentials from Linq reps at the event — not a personal paid account |
| **Krava** | Hackathon | **$0** | Use `KRAVA_APP_KEY` from [krava.io](https://krava.io) / event — not a production billing account |

## Supabase — stay free

- **One active project for this demo:** SourceShield only.
- **PriorityTrac** (`azxcjudhylipmpdkvakd`) is waking up from an earlier restore — **pause it** in [Project Settings → General](https://supabase.com/dashboard/project/azxcjudhylipmpdkvakd/settings/general) once status is Active, so you only run one database. It still counts toward your **2 free project slots** while it exists, but pausing avoids compute use.
- Do **not** upgrade the org to Pro or add paid add-ons (Compute, IPv4, etc.).
- Free-tier limits are plenty for demo volume: small DB, Realtime on one table, low API traffic.
- After the event: **pause or delete** SourceShield if you are not continuing the project.

### What would cost money (avoid)

- 3+ active Supabase projects on a free org
- Supabase Pro plan or overage on egress/storage (unlikely in a 2-day demo)
- Vercel Pro, commercial integrations, or high-bandwidth abuse
- Personal Linq/Krava accounts with billing enabled outside hackathon credits

## Krava — minimize usage (still free at event)

The app **falls back to mock intake** when `KRAVA_APP_KEY` is unset — no API calls, no cost.

When the key is set (hackathon quota):

- One intake LLM call per inbound message
- Optional corroboration LLM compare (only when fingerprints don’t match)
- Use hackathon-provided key only; don’t attach a paid production app key

## Vercel — stay on Hobby

```bash
npx vercel --prod
```

- Use the default **Hobby** team (personal free).
- Do not add Vercel Postgres, KV, or other paid storage — Supabase is the only DB.
- Set env vars in the dashboard; no need for paid features.

## Quick audit before demo

- [ ] Supabase: only **SourceShield** is active; PriorityTrac is **paused**
- [ ] Supabase org billing: **Free** plan (check [org billing](https://supabase.com/dashboard/org/plnhmgliwdmkodrgfnmx/billing))
- [ ] Vercel: **Hobby** project, no Pro trial started
- [ ] Keys: Linq + Krava are **hackathon** keys, not personal paid accounts
- [ ] No `.env` pointing at production/paid third-party services

## After hackathon

1. Pause or delete project `bsarszpxxsntohgazmsy` if unused.
2. Remove Vercel deployment or leave on Hobby (idle Hobby apps are free).
3. Revoke hackathon API keys if sponsors recommend it.
