# Web intake anonymity — threat model & deploy notes

SourceShield separates **anonymous web intake** (application-layer minimization + Tor guidance)
from **pseudonymous iMessage follow-up** (Linq thread continuity). This document is the precise
claim operators and sources should rely on.

## The claim we ship (application layer)

> Anonymous web intake at the application layer: no login, no phone, no browser-stored session, no
> analytics, no third-party requests, and **no raw text in the newsroom database**. For network
> anonymity use Tor Browser; for the strongest protection use the onion mirror.

## What we do **not** claim

| Avoid saying | Say instead |
|--------------|-------------|
| "We store nothing" | The newsroom database stores **only sanitized summaries**; raw text is processed and may be held in **Krava encrypted memory**. |
| "We never see your IP" | The **app route does not intentionally read or persist** network metadata; **Vercel infrastructure** still receives `x-vercel-ip-*` and may keep platform logs. Network anonymity requires **Tor / onion hosting**. |
| "The case code lives only with you" | The case code is the **only resume secret** you hold; the server stores a **one-way channel hash** (`web:<sessionId>` → `hashHandle`). |
| "Totally anonymous" (hosted site) | **Anonymous at the app layer** on the public site; **strongest** path is Tor + self-hosted onion with logs disabled. |

## What the web path collects (intentionally)

| Data | Collected by app? | Where it goes |
|------|-------------------|---------------|
| Tip text (raw) | Yes — required for Krava sanitization | Krava encrypted memory (`saveRawTranscript`); **not** Postgres dashboard copy |
| Sanitized summary | Yes | Supabase `tips` (journalist dashboard) |
| Case code (UUIDv4) | Generated server-side; user may resume with it | Hashed channel key only — not stored as plaintext resume token in DB |
| Browser localStorage session | **No** — removed; case code is user-held |
| IP / User-Agent / x-forwarded-for | **Not read by** `POST /api/intake/web` | May exist in **Vercel edge/platform logs** outside app control |
| Analytics / third-party scripts | **No** — CSP `default-src 'self'`; fonts via `next/font` (self-hosted at build) |

## Continuity without a browser fingerprint

1. First submit → server returns a **case code** (UUIDv4). UI instructs: **write it down** (primary); optional clipboard copy (secondary — other apps may read clipboard).
2. Reload → **no auto-resume** (no `localStorage`).
3. Paste case code into **Resume a thread** → next submit sends `session_id` → Krava memory can recall prior context (`memory_recalled`).

Malformed `session_id` values are rejected with **400** (JSON) or redirect error (form).

## No-JavaScript path

Tor Browser “Safest” mode disables JavaScript. `/intake` includes a `<noscript>` HTML form that
POSTs `application/x-www-form-urlencoded` to `/api/intake/web` and redirects back with
`?case=<uuid>` so the code appears without scripts.

## Content-Security-Policy

`next.config.ts` sets:

- `default-src 'self'; connect-src 'self'; …` — no external trackers, fonts, or pixels at runtime.
- `Referrer-Policy: no-referrer`, `Permissions-Policy` disables geolocation/mic/camera/FLoC.

`style-src` / `script-src` include `'unsafe-inline'` for Next.js injected chunks today; strict
nonce CSP is a follow-up.

## Known edge: raw text must reach the server

Krava sanitization runs **server-side**. Raw text transits HTTPS to Vercel/Krava — we do **not**
claim client-side-only processing. Client-side PII stripping before upload is **out of scope**
(would fight Krava’s need for raw input).

## Tor & onion mirror (optional real deployment)

The hosted **Vercel deployment cannot disable platform request logs**. For sources who need network
anonymity, document:

1. Run the app bound to **localhost** behind `tor` HiddenService.
2. Set `NEXT_PUBLIC_ONION_URL=http://….onion` so `/intake` shows the mirror link.
3. Disable reverse-proxy access logs (e.g. Nginx `access_log off`) on self-hosted mirrors.
4. Prefer Tor Browser for sources; onion is strongest when app + network layer align.

Production onion hosting is a separate deploy — configuration notes only in this repo.

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ONION_URL` | Optional `.onion` URL shown on `/intake` |

## Related code

- `src/app/intake/` — case code UI, Tor callout, noscript form
- `src/app/api/intake/web/route.ts` — UUID validation, `Cache-Control: no-store`
- `src/lib/session-id.ts` — UUIDv4 format check
- `next.config.ts` — CSP and privacy headers
