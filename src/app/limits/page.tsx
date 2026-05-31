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
            <strong className="text-white">Anonymous web intake (application layer).</strong> No
            login, no phone, no browser-stored session, no analytics, no third-party requests. The
            newsroom database stores only sanitized summaries; raw text is processed and may be held
            in Krava encrypted memory. The case code is the only resume secret — the server keeps
            only a one-way channel hash. The app does not intentionally read or persist network
            metadata; full network anonymity requires Tor Browser or an onion mirror.
          </li>
          <li>
            <strong className="text-white">Pseudonymous iMessage path.</strong> Two-way follow-up
            over Linq without exposing identity in the newsroom — but carriers, Apple, and Linq still
            see phone metadata. Not the same as anonymous web intake.
          </li>
          <li>
            Journalists never see phone numbers, chat IDs, or raw transcripts on the dashboard.
          </li>
          <li>
            Similar-claim grouping = &ldquo;distinct channels report a similar claim&rdquo; — not
            proof of independence.
          </li>
          <li>Coercion-risk flags are model signals, not legal or safety determinations.</li>
          <li>Attachments are declined; sources are asked for text-only tips.</li>
        </ul>
        <p className="mt-8 text-sm text-slate-400">
          Full threat model and deploy notes: <code className="text-slate-300">docs/anonymity.md</code>{" "}
          in the repository.
        </p>
      </main>
    </div>
  );
}
