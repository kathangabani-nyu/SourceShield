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
          Pseudonymous newsroom tips — raw text stays in Krava; journalists see sanitized summaries
          only.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            System status
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
            Submit a tip (web)
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="text-lg font-semibold text-white">60-second demo</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-slate-300">
            <li>
              <Link href="/intake" className="text-sky-400 hover:underline">
                /intake
              </Link>{" "}
              — tip with a name and date → watch raw vs sanitized side by side
            </li>
            <li>Dashboard — select the card → unsafe follow-up → rewritten before send</li>
            <li>Submit again in the same browser — Krava memory recalls prior context</li>
          </ol>
        </section>

        <section className="mt-10 rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200">Two limits that matter</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <strong className="text-slate-300">Pseudonymous ≠ anonymous</strong> — metadata
              exists outside our DB.
            </li>
            <li>
              <strong className="text-slate-300">Similar claim ≠ independent corroboration</strong>{" "}
              — channel count is a signal, not proof.
            </li>
          </ul>
          <Link href="/limits" className="mt-3 inline-block text-sm text-sky-400 hover:underline">
            Full limits &amp; scope →
          </Link>
        </section>
      </main>
    </div>
  );
}
