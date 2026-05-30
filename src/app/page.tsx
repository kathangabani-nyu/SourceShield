import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-sky-400">
          Krava × Linq Hackathon
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">SourceShield</h1>
        <p className="mt-4 text-lg text-slate-300">
          Live pseudonymous follow-up for newsroom tips — with privacy limits made explicit.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-medium hover:bg-sky-500"
          >
            Journalist dashboard
          </Link>
          <Link
            href="/intake"
            className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium hover:border-slate-500"
          >
            Web intake fallback
          </Link>
          <Link
            href="/api/health"
            className="rounded-md border border-slate-800 px-5 py-2.5 text-sm text-slate-400 hover:text-white"
          >
            Health check
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="text-lg font-semibold text-white">Headline demo</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-slate-300">
            <li>Source texts the Linq iMessage number → sanitized card appears live</li>
            <li>Journalist sends an unsafe follow-up → app rewrites it → lands on phone</li>
            <li>Source replies → two-way loop closes on stage</li>
          </ol>
        </section>

        <section className="mt-12 rounded-lg border border-amber-900/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-semibold text-amber-200">Limits (what we do NOT claim)</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-amber-100/80">
            <li>
              <strong className="text-amber-100">Pseudonymous, not anonymous.</strong> Linq,
              Apple, and carriers see phone metadata. Our webhook sees the inbound payload.
            </li>
            <li>
              Journalists never see phone numbers or raw transcripts on this dashboard.
            </li>
            <li>
              Similar-claim grouping means &ldquo;distinct channels report a similar
              claim&rdquo; — independence is a newsroom judgment, not a cryptographic guarantee.
            </li>
            <li>
              Coercion-risk flags are model signals; the bot pauses neutrally and never asks
              &ldquo;Are you being forced?&rdquo;
            </li>
            <li>
              Passkey return applies to the web fallback path only — iMessage sources return via
              the same Linq thread.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">Krava primitives in use</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Private inference (TEE-routed LLM intake)",
              "Encrypted memory (raw transcripts)",
              "Platform user provisioning (per-source scope)",
              "Passkey return (web fallback)",
            ].map((item) => (
              <li
                key={item}
                className="rounded-md border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
