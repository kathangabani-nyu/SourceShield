"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const beats = [
  {
    num: "01",
    title: "Sealed at the source",
    body: "Raw transcripts live only inside encrypted memory. They are never stored in the open, never logged for the dashboard, and never treated as newsroom copy.",
    tech: "Krava memory.save · AES-256-GCM (authenticated encryption) · scoped per pseudonymous userToken — chosen for tamper detection + industry-standard at-rest sealing.",
  },
  {
    num: "02",
    title: "Sanitized on arrival",
    body: "Names, dates, numbers, and places soften into safe tokens before a journalist reads a word. Context remains; identity recedes.",
    tech: "kimi-k2-5 via Krava agentChat inside a TEE · structured JSON intake · only sanitized_summary lands in Postgres.",
  },
  {
    num: "03",
    title: "A thread that stays open",
    body: "Pseudonymous two-way follow-up keeps the conversation alive over iMessage without exposing who is on the other end.",
    tech: "Linq outbound · idempotency_key per message · sender handle hashed SHA-256 before any DB write.",
  },
];

export default function HomePage() {
  const [safeView, setSafeView] = useState(false);
  const [userTouchedToggle, setUserTouchedToggle] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".source-shield-home .ss-reveal:not(.ss-in)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ss-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (userTouchedToggle || !cardRef.current) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!interval) {
            interval = setInterval(() => setSafeView((current) => !current), 3600);
          }
        } else if (interval) {
          clearInterval(interval);
          interval = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [userTouchedToggle]);

  function chooseView(nextSafeView: boolean) {
    setUserTouchedToggle(true);
    setSafeView(nextSafeView);
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
          <Link href="/" className="ss-mark" aria-label="SourceShield home">
            <span className="ss-glyph" aria-hidden="true" />
            SourceShield
          </Link>
          <div className="ss-navlinks">
            <a href="#how">How it works</a>
            <Link href="/story">Story</Link>
            <Link href="/intake">Submit a tip</Link>
          </div>
        </nav>

        <header className="ss-hero">
          <div className="ss-kicker ss-reveal ss-in">Anonymous web · pseudonymous iMessage</div>
          <h1 className="ss-title ss-reveal ss-in ss-d1">
            Truth, <em>sanitized before the desk.</em>
          </h1>
          <p className="ss-lede ss-reveal ss-in ss-d2">
            Anonymous web intake at the application layer — no login, no phone, no browser session, no
            analytics, no third-party requests, and no raw text in the newsroom database. For network
            anonymity, use Tor Browser.
          </p>
          <div className="ss-cta-row ss-reveal ss-in ss-d3">
            <Link href="/intake" className="ss-btn ss-btn-primary">
              Submit a tip
            </Link>
            <a href="#how" className="ss-btn ss-btn-ghost">
              See how it works
            </a>
            <Link href="/story" className="ss-btn ss-btn-ghost">
              Story
            </Link>
          </div>
          <div className="ss-hero-status ss-reveal ss-in ss-d4">
            <span className="ss-pulse" aria-hidden="true" />
            Encrypted memory online - channel secured
            <span className="ss-tech-note">
              AES-256-GCM at rest · TLS in transit · SHA-256 channel hashes
            </span>
          </div>
        </header>

        <section className="ss-block" id="how" aria-labelledby="redaction-title">
          <div className="ss-wrap ss-center">
            <div className="ss-eyebrow ss-reveal">The moment a tip arrives</div>
            <h2 id="redaction-title" className="ss-section-title ss-reveal ss-d1">
              Redaction, rendered as light.
            </h2>
            <p className="ss-section-lede ss-reveal ss-d2">
              A source writes plainly: names, dates, places, and all. Before a journalist ever sees
              it, the sensitive details dissolve into safe tokens. Nothing is blacked out. It simply
              lifts away.
            </p>

            <div className="ss-stage ss-reveal ss-d2">
              <div ref={cardRef} className={`ss-glass ${safeView ? "ss-state-safe" : ""}`}>
                <div className="ss-card-head">
                  <span className="ss-card-label">
                    <span className="ss-dot" aria-hidden="true" />
                    <span>{safeView ? "As the journalist sees it" : "As the source wrote it"}</span>
                  </span>
                  <span className="ss-card-label ss-card-muted">Tip #4471</span>
                </div>
                <p className="ss-tip-text">
                  <span className="ss-redact" data-token="[name]">
                    Daniel&nbsp;Okafor
                  </span>{" "}
                  told me that on{" "}
                  <span className="ss-redact" data-token="[date]">
                    March&nbsp;3rd
                  </span>{" "}
                  the shipment was rerouted through the{" "}
                  <span className="ss-redact" data-token="[facility]">
                    Eastgate&nbsp;depot
                  </span>
                  . He works in logistics and saw the manifest himself, reachable at{" "}
                  <span className="ss-redact" data-token="[contact]">
                    +1&nbsp;415&nbsp;555&nbsp;0179
                  </span>
                  .
                </p>
              </div>
              <div className="ss-toggle-wrap">
                <div className="ss-toggle" role="group" aria-label="Tip view">
                  <button
                    type="button"
                    className={!safeView ? "ss-on" : ""}
                    onClick={() => chooseView(false)}
                  >
                    Source view
                  </button>
                  <button
                    type="button"
                    className={safeView ? "ss-on" : ""}
                    onClick={() => chooseView(true)}
                  >
                    Journalist view
                  </button>
                </div>
              </div>
              <p className="ss-card-caption">
                The raw transcript never leaves encrypted memory. The dashboard only ever holds the
                sanitized version.
              </p>
              <p className="ss-tech-note ss-card-caption">
                Split-storage: Krava ciphertext vs. Postgres sanitized_summary only — anon RLS blocks
                direct tip reads from the browser.
              </p>
            </div>
          </div>
        </section>

        <section className="ss-block" aria-labelledby="guarantees-title">
          <div className="ss-wrap">
            <div className="ss-eyebrow ss-reveal">Three quiet guarantees</div>
            <h2 id="guarantees-title" className="ss-section-title ss-reveal ss-d1">
              A shield you never have to think about.
            </h2>
            <div className="ss-beats">
              {beats.map((beat, index) => (
                <article key={beat.num} className={`ss-beat ss-reveal ss-d${index + 1}`}>
                  <div className="ss-num">{beat.num}</div>
                  <h3>{beat.title}</h3>
                  <p>{beat.body}</p>
                  {"tech" in beat && beat.tech ? (
                    <p className="ss-tech-note">{beat.tech}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ss-block ss-closing" id="submit" aria-labelledby="closing-title">
          <div className="ss-wrap">
            <h2 id="closing-title" className="ss-section-title ss-reveal">
              Speak freely.
              <br />
              Stay unseen.
            </h2>
            <p className="ss-lede ss-reveal ss-d1">
              If you carry something the public needs to know, send it into the light and stay in
              the shadow.
            </p>
            <div className="ss-cta-row ss-reveal ss-d2">
              <Link href="/intake" className="ss-btn ss-btn-primary">
                Submit a tip
              </Link>
              <Link href="/dashboard" className="ss-btn ss-btn-ghost">
                Journalist dashboard
              </Link>
              <Link href="/story" className="ss-btn ss-btn-ghost">
                Presentation mode
              </Link>
            </div>
          </div>
        </section>

        <footer className="ss-footer">
          <div className="ss-wrap ss-foot-inner">
            <span>SourceShield - pseudonymous newsroom intake</span>
            <div className="ss-foot-links">
              <a href="#how">How it works</a>
              <Link href="/story">Story</Link>
              <Link href="/intake">Submit a tip</Link>
            </div>
            <span>Krava x Linq</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
