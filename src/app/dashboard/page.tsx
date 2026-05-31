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
  const labels = {
    low: "Coercion risk: low",
    medium: "Coercion risk: medium",
    high: "Coercion risk: high",
  };

  return <span className={`ss-duress ss-duress-${level}`}>{labels[level]}</span>;
}

function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="source-shield-home">
      <div className="ss-ambient" aria-hidden="true">
        <div className="ss-aurora ss-a1" />
        <div className="ss-aurora ss-a2" />
        <div className="ss-aurora ss-a3" />
      </div>
      <div className="ss-vignette" aria-hidden="true" />
      <div className="ss-grain" aria-hidden="true" />

      <div className="ss-page">
        <nav className="ss-nav" aria-label="Primary">
          <Link href="/" className="ss-mark">
            <span className="ss-glyph" aria-hidden="true" />
            SourceShield
          </Link>
          <div className="ss-navlinks">
            <Link href="/intake">Source intake</Link>
            <Link href="/story">Demo story</Link>
            <Link href="/limits">Honest limits</Link>
          </div>
        </nav>
        {children}
      </div>
    </div>
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
      setError("Could not reach /api/tips. Check deployment and DASHBOARD_SECRET.");
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
      setError("Demo seed request failed.");
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
  const highRiskCount = tips.filter((tip) => tip.duress_signal === "high").length;
  const corroboratedCount = tips.filter((tip) => tip.distinct_channel_count > 1).length;

  if (needsAuth) {
    return (
      <AppChrome>
        <main className="ss-dashboard-main ss-auth-main">
          <form onSubmit={handleAuthSubmit} className="ss-glass ss-auth-card">
            <p className="ss-kicker">Journalist access</p>
            <h1 className="ss-section-title">Unlock the desk.</h1>
            <p className="ss-section-lede">
              Enter the dashboard secret from your environment. It is stored in this browser session
              only.
            </p>
            <p className="ss-tech-note">
              Bearer DASHBOARD_SECRET → sessionStorage · gates GET /api/tips in production · separate
              from INTERNAL_WORKER_SECRET.
            </p>
            <label htmlFor="dashboard-secret">Dashboard secret</label>
            <input
              id="dashboard-secret"
              type="password"
              value={authInput}
              onChange={(e) => setAuthInput(e.target.value)}
              placeholder="Bearer secret"
              autoComplete="off"
            />
            <button type="submit" className="ss-btn ss-btn-primary">
              Unlock dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                clearDashboardSecret();
                setAuthInput("");
              }}
              className="ss-auth-clear"
            >
              Clear saved secret
            </button>
          </form>
        </main>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <main className="ss-dashboard-main">
        <section className="ss-wrap ss-dashboard-hero">
          <div>
            <p className="ss-kicker">Journalist view</p>
            <h1 className="ss-section-title">The desk. Nothing else.</h1>
            <p className="ss-section-lede">
              Review sanitized case cards, keep raw transcripts out of the newsroom database, and
              rewrite follow-ups before they reach a source.
            </p>
            <p className="ss-tech-note">
              Service-role API only · no linq_chat_id or raw text in responses · follow-ups rewritten
              via Krava before Linq send.
            </p>
          </div>
          <div className="ss-glass ss-status-panel">
            <p className="ss-card-label">
              <span className="ss-dot" aria-hidden="true" />
              System path
            </p>
            <IntegrationStatusChips />
          </div>
        </section>

        <section className="ss-wrap ss-metric-row" aria-label="Dashboard summary">
          <div className="ss-metric">
            <span>Cards</span>
            <strong>{loading ? "--" : tips.length}</strong>
          </div>
          <div className="ss-metric">
            <span>Corroborated</span>
            <strong>{loading ? "--" : corroboratedCount}</strong>
          </div>
          <div className="ss-metric">
            <span>High risk</span>
            <strong>{loading ? "--" : highRiskCount}</strong>
          </div>
          <div className="ss-metric">
            <span>Linq</span>
            <strong>{linqLive ? "Live" : "Dry"}</strong>
          </div>
        </section>

        <section className="ss-wrap ss-desk-layout">
          <div className="ss-desk-column">
            <div className="ss-panel-heading">
              <div>
                <p className="ss-eyebrow">Case cards</p>
                <h2>Sanitized intake queue</h2>
                <p className="ss-tech-note">
                  Postgres tips: sanitized_summary, duress_signal, claim_fingerprint — SHA-256 handles
                  never surfaced here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDemoCards()}
                disabled={seeding}
                className="ss-btn ss-btn-ghost ss-small-btn"
              >
                {seeding ? "Loading..." : "Load demo"}
              </button>
            </div>

            {error && (
              <div className="ss-alert ss-alert-error">
                <strong>Dashboard cannot load tips</strong>
                <span>{error}</span>
              </div>
            )}

            {loading && <p className="ss-muted-line">Loading case cards...</p>}

            {!loading && !dbDown && tips.length === 0 && (
              <div className="ss-glass ss-empty-state">
                <p>No case cards yet.</p>
                <div className="ss-empty-actions">
                  <Link href="/intake" className="ss-btn ss-btn-primary ss-small-btn">
                    Submit via intake
                  </Link>
                  <button
                    type="button"
                    onClick={() => void loadDemoCards()}
                    disabled={seeding}
                    className="ss-btn ss-btn-ghost ss-small-btn"
                  >
                    {seeding ? "Loading..." : "Load demo cards"}
                  </button>
                </div>
              </div>
            )}

            <ul className="ss-case-list">
              {tips.map((tip) => (
                <li key={tip.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(tip.id)}
                    className={`ss-case-card${selectedId === tip.id ? " ss-case-card-active" : ""}`}
                  >
                    <span className="ss-case-id">{tip.id.slice(0, 8)}</span>
                    <p>{tip.sanitized_summary}</p>
                    <div className="ss-case-meta">
                      <DuressBadge level={tip.duress_signal} />
                      {tip.distinct_channel_count > 1 && (
                        <span className="ss-channel-chip">
                          {tip.distinct_channel_count} distinct channels
                        </span>
                      )}
                    </div>
                    <time>{new Date(tip.created_at).toLocaleString()}</time>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="ss-glass ss-followup-panel">
            <p className="ss-card-label">
              <span className="ss-dot" aria-hidden="true" />
              Safe follow-up filter
            </p>

            {!selected ? (
              <div className="ss-followup-empty">
                <h2>Select a card.</h2>
                <p>
                  The source identity stays out of view. Pick a sanitized case to preview the
                  question that would be sent back.
                </p>
                <p className="ss-tech-note">
                  Regex strip + optional Krava rewrite · unsafe names/dates removed before iMessage
                  outbound.
                </p>
              </div>
            ) : (
              <>
                <div className="ss-selected-card">
                  <span className="ss-case-id">{selected.id.slice(0, 8)}</span>
                  <p>{selected.sanitized_summary}</p>
                  <DuressBadge level={selected.duress_signal} />
                </div>

                {selected.next_safe_question && (
                  <div className="ss-suggested-question">
                    <p>Suggested follow-up</p>
                    <strong>{selected.next_safe_question}</strong>
                    <button
                      type="button"
                      onClick={() => fillSuggestedQuestion(selected.next_safe_question!)}
                    >
                      Use this question
                    </button>
                  </div>
                )}

                <form onSubmit={handleFollowUp} className="ss-followup-form">
                  <label htmlFor="follow-up">Draft a follow-up question</label>
                  <textarea
                    id="follow-up"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Try: Did the same manager approve the change?"
                    rows={5}
                  />
                  <button
                    type="submit"
                    disabled={sending || !followUp.trim()}
                    className="ss-btn ss-btn-primary"
                  >
                    {sending
                      ? "Processing..."
                      : linqLive
                        ? "Send via iMessage"
                        : "Preview safe rewrite"}
                  </button>
                </form>

                {lastResult && (
                  <div className="ss-rewrite-card">
                    <p>
                      {lastResult.dry_run
                        ? "Dry run, nothing sent"
                        : lastResult.wasRewritten
                          ? "Rewritten before send"
                          : "Sent as written"}
                      {lastResult.via ? <span> ({lastResult.via})</span> : null}
                    </p>
                    {lastResult.message ? <small>{lastResult.message}</small> : null}
                    <div>
                      <span>Your draft</span>
                      <del>{lastResult.original}</del>
                    </div>
                    <div>
                      <span>Source would receive</span>
                      <strong>{lastResult.rewritten}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        </section>

        <section className="ss-wrap ss-dashboard-limits">
          <div className="ss-limit">
            <span>01</span>
            <h3>Raw words stay sealed</h3>
            <p>No phone numbers, chat IDs, or raw transcripts are shown on the journalist desk.</p>
            <p className="ss-tech-note">
              Raw text in Krava AES-256-GCM memory · dashboard reads sanitized rows via service role
              only.
            </p>
          </div>
          <div className="ss-limit">
            <span>02</span>
            <h3>Signals are not proof</h3>
            <p>Similar-claim counts and coercion-risk flags guide review; they do not verify facts.</p>
            <p className="ss-tech-note">
              claim_fingerprint grouping · LLM duress_signal enum — not forensic evidence.
            </p>
          </div>
        </section>
      </main>
    </AppChrome>
  );
}
