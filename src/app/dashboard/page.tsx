"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type Tip = {
  id: string;
  sanitized_summary: string;
  duress_signal: "low" | "medium" | "high";
  claim_fingerprint: string;
  distinct_channel_count: number;
  created_at: string;
};

type FollowUpResult = {
  original: string;
  rewritten: string;
  wasRewritten: boolean;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<FollowUpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTips() {
      try {
        const res = await fetch("/api/tips");
        const data = await res.json();
        if (active) setTips(data.tips ?? []);
      } catch {
        if (active) setError("Could not load tips.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTips();

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      const interval = setInterval(() => void loadTips(), 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }

    const channel = supabase
      .channel("tips-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tips" },
        () => {
          void loadTips();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !followUp.trim()) return;

    setSending(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await fetch(`/api/tips/${selectedId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: followUp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Send failed");
        return;
      }
      setLastResult({
        original: data.original,
        rewritten: data.rewritten,
        wasRewritten: data.wasRewritten,
      });
      setFollowUp("");
    } catch {
      setError("Network error sending follow-up.");
    } finally {
      setSending(false);
    }
  }

  const selected = tips.find((t) => t.id === selectedId);

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
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Case cards
          </h2>
          {loading && <p className="text-slate-400">Loading…</p>}
          {!loading && tips.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-700 p-6 text-slate-400">
              No tips yet. Text the Linq number to create a live card.
            </p>
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
              Select a case card to send a follow-up.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="mb-4 text-sm text-slate-300">{selected.sanitized_summary}</p>
              <form onSubmit={handleFollowUp} className="space-y-3">
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder='Try: "Did John Smith say this on March 3rd?" — we rewrite before sending.'
                  rows={4}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !followUp.trim()}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send follow-up via iMessage"}
                </button>
              </form>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              {lastResult && (
                <div className="mt-4 space-y-2 rounded-md border border-slate-700 bg-slate-950 p-3 text-sm">
                  <p className="font-medium text-slate-300">
                    {lastResult.wasRewritten ? "Rewritten before send" : "Sent as written"}
                  </p>
                  <div>
                    <p className="text-xs text-slate-500">Your draft</p>
                    <p className="text-slate-400 line-through">{lastResult.original}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Source receives</p>
                    <p className="text-emerald-300">{lastResult.rewritten}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200/80">
            <p className="font-medium text-amber-200">Dashboard limits</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-200/70">
              <li>No phone numbers or raw transcripts shown</li>
              <li>Similar-claim count is channel-based, not proof of independence</li>
              <li>Coercion-risk flag is a model signal, not a determination</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
