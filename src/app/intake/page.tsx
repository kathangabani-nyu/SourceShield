"use client";

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

export default function IntakePage() {
  const [sessionId, setSessionId] = useState<string | null>(readStoredSessionId);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setReply(null);

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
      setReply(data.reply);
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
            <h1 className="text-xl font-semibold">Web intake (fallback)</h1>
            <p className="text-sm text-slate-400">
              Passkey return path — same backend as iMessage
            </p>
          </div>
          <a href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300">
            Dashboard →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Use this when conference wifi or iMessage is unavailable. Your session ID is stored in
          this browser&apos;s local storage so you can return pseudonymously after refresh. Raw
          text goes to Krava encrypted memory when the API accepts your key — otherwise mock
          intake still completes. The dashboard shows sanitized summaries only.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your tip in text only…"
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
            Session: {sessionId.slice(0, 8)}… (persisted in this browser)
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {reply && (
          <div className="mt-6 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
            <p className="text-xs font-medium uppercase text-emerald-400">Assistant reply</p>
            <p className="mt-2 text-emerald-100">{reply}</p>
          </div>
        )}
      </main>
    </div>
  );
}
