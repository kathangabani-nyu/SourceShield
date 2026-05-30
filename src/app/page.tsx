import Link from "next/link";
import { IntegrationStatusChips } from "@/components/integration-status-chips";

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

        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Live integration status
          </h2>
          <div className="mt-3">
            <IntegrationStatusChips />
          </div>
        </section>

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
          <p className="mt-4 text-sm text-slate-400">
            <strong className="text-slate-300">No Linq keys?</strong> Use{" "}
            <Link href="/intake" className="text-sky-400 hover:underline">
              /intake
            </Link>{" "}
            plus dashboard <strong className="text-slate-300">Preview rewrite (dry-run)</strong> —
            intentional, not broken.
          </p>
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
      </main>
    </div>
  );
}
