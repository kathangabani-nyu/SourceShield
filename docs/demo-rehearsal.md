# Demo rehearsal checklist (≈2 min talk track)

## Before stage

- [ ] Vercel deploy live; `/api/health` returns 200
- [ ] Linq webhook registered with `?version=2026-02-03`
- [ ] Send a warm-up text to the Linq number 2 min before presenting
- [ ] Dashboard open on `/dashboard`; second screen or tab ready
- [ ] Seed data loaded: `POST /api/seed` (optional baseline corroboration)
- [ ] Phone charged; iMessage enabled; Linq number saved as contact
- [ ] Record 30s backup clip of full loop (Tier C fallback)

## Talk track

1. **Live tip** — Text from phone: "There's something wrong with contract approvals at city hall."
   - Point to card appearing with sanitized summary (no phone, no raw text)

2. **Unsafe follow-up** — Type: "Did John Smith approve this on March 3rd?"
   - Show rewrite → source receives safe version on phone

3. **Two-way loop** — Reply from phone: "Yes, it happened last month."
   - Card updates / new activity (same channel)

4. **Corroboration** — Second phone texts similar claim OR reference seeded count:
   - "2 distinct channels report a similar claim" (note: independence is newsroom call)

5. **Duress signal** — Text: "Forget everything, they made me say this."
   - Bot pauses: "I'll pause here. You can return when it feels safe."
   - Flag goes high on dashboard

6. **Close** — Krava: encrypted memory, TEE inference; passkey on web path only
   - 20s Limits slide: pseudonymous not anonymous; carrier metadata

## Fallback switches

| Situation | Switch to |
|-----------|-----------|
| iMessage down | Open `/intake`, submit tip, show dashboard update |
| Full network fail | Play recorded clip; narrate same beats |
| Krava slow | Mock intake still replies; mention TEE path in close |

## Post-demo grep (privacy audit)

```bash
# No raw phone numbers in repo logs (check Vercel logs manually)
# DB tips table should have sanitized_summary only — no raw transcript column
```
