"use client";

import Link from "next/link";
import { useState } from "react";

const SESSION_KEY = "sourceshield_web_session";

function readStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

type IntakeResponse = {
  reply: string;
  sanitized_summary: string;
  duress_signal: string;
  engine: "krava" | "mock";
  memory_recalled: boolean;
  db_saved: boolean;
  db_error: string | null;
  memory_saved: boolean;
  warnings?: string[];
  tip_id: string | null;
};

export default function IntakePage() {
  const [sessionId, setSessionId] = useState<string | null>(readStoredSessionId);
  const [text, setText] = useState("");
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [submittedRaw, setSubmittedRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSubmittedRaw(text.trim());

    try {
      const res = await fetch("/api/intake/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Intake failed");
        return;
      }
      setSessionId(data.session_id);
      try {
        localStorage.setItem(SESSION_KEY, data.session_id);
      } catch {
        // Non-blocking
      }
      setResult(data);
      setText("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Web intake</h1>
            <p className="text-sm text-slate-400">Session continuity — same backend as iMessage</p>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300">
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Raw text is processed by Krava (private inference + encrypted memory). Journalists only
          see the <strong className="text-slate-200">sanitized summary</strong> on the dashboard —
          never this box.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Example: "My manager John Smith signed a $2M deal on March 3rd 2024…"'
            rows={6}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Processing…" : "Submit tip"}
          </button>
        </form>

        {sessionId && (
          <p className="mt-4 text-xs text-slate-500">
            Session: {sessionId.slice(0, 8)}… — return in this browser to continue the thread
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {result && submittedRaw && (
          <div className="mt-8 space-y-4">
            {result.warnings?.map((w) => (
              <p
                key={w}
                className="rounded-md border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200"
              >
                {w}
              </p>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4">
                <p className="text-xs font-medium uppercase text-red-300">
                  Raw (Krava encrypted memory only)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-red-100/90">{submittedRaw}</p>
                <p className="mt-2 text-xs text-red-300/70">
                  {result.memory_saved
                    ? "Saved to Krava memory"
                    : "Memory save skipped or unavailable"}
                  {result.memory_recalled ? " · prior context recalled" : ""}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
                <p className="text-xs font-medium uppercase text-emerald-300">
                  Sanitized (Postgres / dashboard)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100">
                  {result.sanitized_summary}
                </p>
                <p className="mt-2 text-xs text-emerald-300/80">
                  Engine: {result.engine === "krava" ? "Krava LLM" : "Mock (Krava unavailable)"}{" "}
                  · Duress: {result.duress_signal}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Assistant reply</p>
              <p className="mt-2 text-slate-100">{result.reply}</p>
            </div>

            {result.db_error && (
              <p className="rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                Dashboard card not saved: {result.db_error}
              </p>
            )}
            {result.db_saved && result.tip_id && (
              <p className="text-sm text-sky-300">
                Card saved — open{" "}
                <Link href="/dashboard" className="underline hover:text-sky-200">
                  dashboard
                </Link>{" "}
                to send a safe follow-up.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
