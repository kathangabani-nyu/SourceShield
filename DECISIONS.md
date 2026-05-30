# SourceShield — Decision Log

Format: date — decision — why

- 2026-05-30 — Scope: single headline, bulletproof. Why: one wow moment beats three shallow ones.
- 2026-05-30 — Headline: live two-way pseudonymous follow-up over Linq iMessage. Why: flashiest + Linq-sponsor aligned.
- 2026-05-30 — Corroboration + duress = supporting beats. Why: keep the live chain simple.
- 2026-05-30 — "Pseudonymous," not "anonymous"; add Limits slide; do NOT claim passkey return on the iMessage path. Why: handle/metadata are exposed to Linq/Apple/carrier/webhook.
- 2026-05-30 — Webhook is ACK-first; Krava + Linq outbound run in a background worker. Why: Linq ~10s timeout + at-least-once delivery → sync processing risks retries/duplicate sends on stage.
- 2026-05-30 — Linq send uses `{ message: { parts, idempotency_key } }` (key inside `message`); prefer the SDK. Why: top-level shape is wrong and causes silent failures.
- 2026-05-30 — Honest demo labels: "similar claim" not "independent corroboration"; "duress signal" not "duress detection." Neutral bot pause copy; never ask "are you being forced?"
- 2026-05-30 — Strict no-raw-logging / no-raw-in-DB rule; chat_id/message_id/handle hash = sensitive.
- 2026-05-30 — Attachments cut: request text-only, safety-reply to inbound media.
- 2026-05-30 — Deploy to Vercel (stable webhook URL); pin webhook `?version=2026-02-03`. No laptop ngrok.
- 2026-05-30 — Cut pgvector/embeddings, `public_interest_score`, `evidence_strength`, prod test plan.
- 2026-05-30 — Task Zero: verify Krava + Linq shapes vs. live docs + sponsor reps before coding.
- 2026-05-30 — Krava integration: `createKravaPlatformClient` for server-side user provisioning + per-source `createKravaClient` with `userToken` for memory/inference. Why: platform client is the documented server path; userToken scopes encrypted memory per pseudonymous source.
- 2026-05-30 — Linq webhook payload: use `webhook_version: 2026-02-03` format (`MessageEventV2` in SDK). Why: message fields at top level of `data`, not nested under `message`.
- 2026-05-30 — Dedicated Supabase project `SourceShield` (`bsarszpxxsntohgazmsy`, us-east-1) via Cursor plugin; separate from PriorityTrac. Why: hackathon isolation + clean demo DB.
- 2026-05-30 — Cost guardrail: Supabase Free ($0), Vercel Hobby, hackathon Linq/Krava keys only; PriorityTrac paused so only one DB runs. Why: user requires zero spend.
- 2026-05-30 — Krava intake catches API 401/errors → `mockIntake` so web fallback never 500s on bad keys. Why: hackathon keys often invalid before sponsor fixes.
- 2026-05-30 — Follow-up dry-run before rejecting web-only tips; Linq missing = intentional preview mode. Why: main privacy demo must work without iMessage.
- 2026-05-30 — `DASHBOARD_SECRET` on `/api/tips` + follow-up in production; `INTERNAL_WORKER_SECRET` required for worker/seed on production. Why: service role routes must not be public on deploy.
