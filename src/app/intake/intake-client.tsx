"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidSessionId } from "@/lib/session-id";

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
  session_id: string;
};

type IntakeClientProps = {
  onionUrl: string | null;
  urlCaseCode?: string | null;
  urlError?: string | null;
  urlRecalled?: boolean;
};

export function IntakeClient({
  onionUrl,
  urlCaseCode,
  urlError,
  urlRecalled,
}: IntakeClientProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caseCodeShown, setCaseCodeShown] = useState<string | null>(urlCaseCode ?? null);
  const [resumeInput, setResumeInput] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [submittedRaw, setSubmittedRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "empty_text"
      ? "Tip text was empty."
      : urlError === "invalid_case"
        ? "That case code is not valid."
        : null,
  );
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const activeCaseCode = caseCodeShown ?? (result ? result.session_id : null);

  function applyResume() {
    const trimmed = resumeInput.trim();
    if (!trimmed) {
      setResumeError("Enter your case code.");
      return;
    }
    if (!isValidSessionId(trimmed)) {
      setResumeError("Case codes look like xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.");
      return;
    }
    setSessionId(trimmed);
    setResumeError(null);
    setResumeInput("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSubmittedRaw(text.trim());
    setCaseCodeShown(null);

    try {
      const res = await fetch("/api/intake/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_session_id"
            ? "That case code is not valid."
            : (data.error ?? "Intake failed"),
        );
        return;
      }
      setSessionId(data.session_id);
      setCaseCodeShown(data.session_id);
      setResult(data);
      setText("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copyCaseCode() {
    if (!activeCaseCode) return;
    try {
      await navigator.clipboard.writeText(activeCaseCode);
      setCopyHint("Copied. Other apps on this device may still read the clipboard.");
    } catch {
      setCopyHint("Copy failed. Write the code down instead.");
    }
  }

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
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/story">Story</Link>
          </div>
        </nav>

        <main className="ss-intake-main">
          <div className="ss-wrap ss-intake-shell">
            <section className="ss-intake-copy">
              <p className="ss-kicker">Anonymous web intake</p>
              <h1 className="ss-section-title">Submit in confidence.</h1>
              <p className="ss-section-lede">
                No login, no phone, no browser-stored session. The newsroom database holds only
                sanitized summaries; raw text is processed in Krava encrypted memory.
              </p>
              <p className="ss-tech-note">
                POST /api/intake/web · TLS · Cache-Control: no-store · no analytics pixels.
              </p>

              <div className="ss-intake-route-map" aria-label="Privacy pipeline">
                <div>
                  <span>01</span>
                  <strong>Source sends</strong>
                  <p>Plain text enters over the anonymous web path.</p>
                  <p className="ss-tech-note">HTTPS · no cookies · no localStorage session.</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>Krava seals</strong>
                  <p>Raw words stay in encrypted memory for source-held continuity.</p>
                  <p className="ss-tech-note">
                    memory.save · AES-256-GCM · per-source userToken from users.getOrCreate.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <strong>Desk sees safe</strong>
                  <p>Journalists receive a sanitized card, never the original transcript.</p>
                  <p className="ss-tech-note">
                    Supabase tips row: summary + duress + claim_fingerprint only.
                  </p>
                </div>
              </div>

              <aside className="ss-intake-callout">
                <p>
                  <strong>Using Tor Browser?</strong> It hides your IP from SourceShield. An onion
                  mirror is the strongest path.
                  {onionUrl ? (
                    <>
                      {" "}
                      <a href={onionUrl} className="ss-intake-link">
                        Open onion mirror
                      </a>
                    </>
                  ) : null}
                </p>
                <p>
                  <strong>Not using Tor?</strong> We log nothing intentionally, but your ISP or
                  network can see you reached this site. For network anonymity, open this page in Tor
                  Browser.
                </p>
              </aside>
            </section>

            <section className="ss-glass ss-intake-composer" aria-label="Submit a tip">
              <div className="ss-intake-card-head">
                <span className="ss-source-id">
                  <span className="ss-dot" aria-hidden="true" />
                  Anonymous web session
                </span>
                <span className="ss-mono-note">TLS 1.3 in transit</span>
              </div>

              {activeCaseCode ? (
                <div className="ss-case-panel" role="status">
                  <p className="ss-case-label">Your case code - write this down</p>
                  <p className="ss-case-code">{activeCaseCode}</p>
                  <p className="ss-case-warn">
                    This is the only way to resume your thread. We cannot recover it if you lose it.
                  </p>
                  <p className="ss-tech-note">
                    UUIDv4 case code · server maps SHA-256(web:uuid) — never stores the code as a
                    lookup column.
                  </p>
                  <button
                    type="button"
                    className="ss-btn ss-btn-ghost ss-case-copy"
                    onClick={copyCaseCode}
                  >
                    Copy to clipboard
                  </button>
                  {copyHint ? <p className="ss-case-hint">{copyHint}</p> : null}
                  {(result?.memory_recalled || urlRecalled) && (
                    <p className="ss-case-hint">Prior context recalled from Krava memory.</p>
                  )}
                </div>
              ) : null}

              <div className="ss-intake-resume">
                <label htmlFor="resume-case">Resume a thread</label>
                <div className="ss-intake-resume-row">
                  <input
                    id="resume-case"
                    type="text"
                    value={resumeInput}
                    onChange={(event) => setResumeInput(event.target.value)}
                    placeholder="Paste your case code"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button type="button" className="ss-btn ss-btn-ghost" onClick={applyResume}>
                    Use code
                  </button>
                </div>
                {resumeError ? <p className="ss-intake-error">{resumeError}</p> : null}
                {sessionId && !activeCaseCode ? (
                  <p className="ss-case-hint">Case code set for your next submit.</p>
                ) : null}
              </div>

              <form onSubmit={handleSubmit} className="ss-intake-form">
                <label htmlFor="tip-text">What do you need to report?</label>
                <textarea
                  id="tip-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Example: On March 15, contracts were backdated to avoid an audit window..."
                  rows={7}
                />
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="ss-btn ss-btn-primary"
                >
                  {loading ? "Processing..." : "Send in confidence"}
                </button>
              </form>

              {error ? <p className="ss-intake-error">{error}</p> : null}
            </section>

            {result && submittedRaw ? (
              <section className="ss-intake-results">
                {result.warnings?.map((warning) => (
                  <p key={warning} className="ss-intake-warn">
                    {warning}
                  </p>
                ))}

                <div className="ss-intake-panels">
                  <div className="ss-glass ss-intake-panel ss-intake-panel-raw">
                    <p className="ss-card-label">
                      <span className="ss-dot" aria-hidden="true" />
                      Raw - Krava encrypted memory only
                    </p>
                    <p className="ss-tip-text">{submittedRaw}</p>
                    <p className="ss-card-caption">
                      {result.memory_saved
                        ? "Saved to Krava memory"
                        : "Memory save skipped or unavailable"}
                      {result.memory_recalled ? " - prior context recalled" : ""}
                    </p>
                    <p className="ss-tech-note">
                      AES-256-GCM ciphertext · decryption scoped to this source&apos;s Krava
                      userToken — not in Postgres.
                    </p>
                  </div>
                  <div className="ss-glass ss-intake-panel">
                    <p className="ss-card-label">
                      <span className="ss-dot" aria-hidden="true" />
                      Sanitized - newsroom database
                    </p>
                    <p className="ss-tip-text">{result.sanitized_summary}</p>
                    <p className="ss-card-caption">
                      Engine: {result.engine === "krava" ? "Krava LLM" : "Mock"} - Duress:{" "}
                      {result.duress_signal}
                    </p>
                    <p className="ss-tech-note">
                      {result.engine === "krava"
                        ? "kimi-k2-5 agentChat · TEE inference · JSON schema validated server-side."
                        : "Regex mock fallback when Krava key unavailable — same UI, heuristic strip."}
                    </p>
                  </div>
                </div>

                <div className="ss-glass ss-intake-reply">
                  <p className="ss-card-label">Assistant reply</p>
                  <p className="ss-tip-text">{result.reply}</p>
                </div>

                {result.db_error ? (
                  <p className="ss-intake-error">Dashboard card not saved: {result.db_error}</p>
                ) : null}
                {result.db_saved && result.tip_id ? (
                  <p className="ss-case-hint">
                    Card saved. Open{" "}
                    <Link href="/dashboard" className="ss-intake-link">
                      dashboard
                    </Link>{" "}
                    to send a safe follow-up.
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
