import Link from "next/link";

export default function LimitsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← SourceShield
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Limits &amp; honest scope</h1>
        <ul className="mt-8 list-inside list-disc space-y-4 text-slate-300">
          <li>
            <strong className="text-white">Pseudonymous, not anonymous.</strong> Linq, Apple, and
            carriers see phone metadata. Our webhook sees inbound payloads.
          </li>
          <li>
            Journalists never see phone numbers, chat IDs, or raw transcripts on the dashboard.
          </li>
          <li>
            Similar-claim grouping = &ldquo;distinct channels report a similar claim&rdquo; — not
            proof of independence.
          </li>
          <li>Coercion-risk flags are model signals, not legal or safety determinations.</li>
          <li>
            Web path uses browser session continuity (localStorage), not hardware passkeys.
            iMessage sources return via the same Linq thread.
          </li>
          <li>
            Attachments are declined; sources are asked for text-only tips.
          </li>
        </ul>
      </main>
    </div>
  );
}
