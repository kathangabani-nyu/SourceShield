"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IntegrationStatusChips } from "@/components/integration-status-chips";
import {
  clearDashboardSecret,
  getDashboardAuthHeaders,
  storeDashboardSecret,
} from "@/lib/dashboard-client";

type Tip = {
  id: string;
  sanitized_summary: string;
  duress_signal: "low" | "medium" | "high";
  claim_fingerprint: string;
  distinct_channel_count: number;
  next_safe_question: string | null;
  created_at: string;
};

type FollowUpResult = {
  original: string;
  rewritten: string;
  wasRewritten: boolean;
  via?: string;
  dry_run?: boolean;
  message?: string;
};

function DuressBadge({ level }: { level: Tip["duress_signal"] }) {
  const styles = {
    low: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
  };
  const labels = {
    low: "Coercion risk: low",
    medium: "Coercion risk: medium",
    high: "Coercion risk: high",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function DashboardPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [linqLive, setLinqLive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<FollowUpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbDown, setDbDown] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadTips = useCallback(async () => {
    try {
      const res = await fetch("/api/tips", { headers: getDashboardAuthHeaders() });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      setNeedsAuth(false);
      const data = await res.json();
      if (!res.ok) {
        setTips([]);
        setDbDown(true);
        setError(data.message ?? data.error ?? `Tips API error (${res.status})`);
        return;
      }
      setDbDown(false);
      setTips(data.tips ?? []);
      setError(null);
    } catch {
      setDbDown(true);
      setError("Could not reach /api/tips — check deployment and DASHBOARD_SECRET.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadDemoCards() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: getDashboardAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Could not load demo cards");
        return;
      }
      await loadTips();
    } catch {
      setError("Demo seed request failed");
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadTips();
    });
    void fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setLinqLive(Boolean(d?.integrations?.linq?.configured)))
      .catch(() => setLinqLive(false));

    const interval = setInterval(() => void loadTips(), 4000);
    return () => clearInterval(interval);
  }, [loadTips]);

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    storeDashboardSecret(authInput);
    setLoading(true);
    void loadTips();
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !followUp.trim()) return;

    setSending(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await fetch(`/api/tips/${selectedId}/follow-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDashboardAuthHeaders(),
        },
        body: JSON.stringify({ message: followUp }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setNeedsAuth(true);
          return;
        }
        setError(data.message ?? data.error ?? "Send failed");
        return;
      }
      setLastResult({
        original: data.original,
        rewritten: data.rewritten,
        wasRewritten: data.wasRewritten,
        via: data.via,
        dry_run: data.dry_run,
        message: data.message,
      });
      setFollowUp("");
    } catch {
      setError("Network error sending follow-up.");
    } finally {
      setSending(false);
    }
  }

  function fillSuggestedQuestion(question: string) {
    setFollowUp(question);
  }

  const selected = tips.find((t) => t.id === selectedId);

  if (needsAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <form
          onSubmit={handleAuthSubmit}
          className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6"
        >
          <h1 className="text-lg font-semibold">Dashboard access</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter <code className="text-sky-300">DASHBOARD_SECRET</code> from your env (stored in
            this browser session only).
          </p>
          <input
            type="password"
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
            className="mt-4 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Bearer secret"
            autoComplete="off"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500"
          >
            Unlock dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              clearDashboardSecret();
              setAuthInput("");
            }}
            className="mt-2 w-full text-xs text-slate-500 hover:text-slate-300"
          >
            Clear saved secret
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SourceShield</h1>
            <p className="text-sm text-slate-400">Journalist dashboard — pseudonymous tips only</p>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            Limits &amp; overview
          </Link>
        </div>
        <div className="mx-auto mt-4 max-w-6xl">
          <IntegrationStatusChips />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Case cards
          </h2>
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
              <p className="font-medium">Dashboard cannot load tips</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          )}
          {loading && <p className="text-slate-400">Loading…</p>}
          {!loading && !dbDown && tips.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-slate-400">
              <p>No case cards yet.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/intake"
                  className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-sky-300 hover:border-sky-500"
                >
                  Submit via web intake
                </Link>
                <button
                  type="button"
                  onClick={() => void loadDemoCards()}
                  disabled={seeding}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700 disabled:opacity-50"
                >
                  {seeding ? "Loading demo…" : "Load demo case cards"}
                </button>
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {tips.map((tip) => (
              <li key={tip.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(tip.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedId === tip.id
                      ? "border-sky-500 bg-slate-900"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{tip.sanitized_summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DuressBadge level={tip.duress_signal} />
                    {tip.distinct_channel_count > 1 && (
                      <span className="rounded-full bg-sky-900/50 px-2 py-0.5 text-xs text-sky-300">
                        {tip.distinct_channel_count} distinct channels report a similar claim
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(tip.created_at).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Follow-up (safe-question filter)
          </h2>
          {!selected ? (
            <p className="rounded-lg border border-dashed border-slate-700 p-6 text-slate-400">
              Select a case card to preview or send a follow-up.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="mb-4 text-sm text-slate-300">{selected.sanitized_summary}</p>

              {selected.next_safe_question && (
                <div className="mb-4 rounded-md border border-sky-900/50 bg-sky-950/30 p-3">
                  <p className="text-xs font-medium uppercase text-sky-400">
                    Suggested follow-up (from intake)
                  </p>
                  <p className="mt-1 text-sm text-sky-100">{selected.next_safe_question}</p>
                  <button
                    type="button"
                    onClick={() => fillSuggestedQuestion(selected.next_safe_question!)}
                    className="mt-2 text-xs text-sky-400 hover:text-sky-300"
                  >
                    Use this question →
                  </button>
                </div>
              )}

              <form onSubmit={handleFollowUp} className="space-y-3">
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder='Try: "Did John Smith say this on March 3rd?" — regex + Krava rewrite.'
                  rows={4}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !followUp.trim()}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {sending
                    ? "Processing…"
                    : linqLive
                      ? "Send follow-up via iMessage"
                      : "Preview rewrite (dry-run)"}
                </button>
              </form>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              {lastResult && (
                <div className="mt-4 space-y-2 rounded-md border border-slate-700 bg-slate-950 p-3 text-sm">
                  <p className="font-medium text-slate-300">
                    {lastResult.dry_run
                      ? "Dry-run — nothing sent to iMessage"
                      : lastResult.wasRewritten
                        ? "Rewritten before send"
                        : "Sent as written"}
                    {lastResult.via && (
                      <span className="ml-2 text-xs text-slate-500">({lastResult.via})</span>
                    )}
                  </p>
                  {lastResult.message && (
                    <p className="text-xs text-amber-300/90">{lastResult.message}</p>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Your draft</p>
                    <p className="text-slate-400 line-through">{lastResult.original}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Source would receive</p>
                    <p className="text-emerald-300">{lastResult.rewritten}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200/80">
            <p className="font-medium text-amber-200">Dashboard limits</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-200/70">
              <li>No phone numbers, chat IDs, or raw transcripts shown</li>
              <li>Similar-claim count is channel-based, not proof of independence</li>
              <li>Coercion-risk flag is a model signal, not a determination</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
