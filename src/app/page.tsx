"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const beats = [
  {
    num: "01",
    title: "Sealed at the source",
    body: "Raw transcripts live only inside encrypted memory. They are never stored in the open, never logged for the dashboard, and never treated as newsroom copy.",
  },
  {
    num: "02",
    title: "Sanitized on arrival",
    body: "Names, dates, numbers, and places soften into safe tokens before a journalist reads a word. Context remains; identity recedes.",
  },
  {
    num: "03",
    title: "A thread that stays open",
    body: "Pseudonymous two-way follow-up keeps the conversation alive over iMessage without exposing who is on the other end.",
  },
];

const limits = [
  {
    tag: "The boundary",
    title: "Anonymous web intake still has edges.",
    body: "Without Linq follow-up, SourceShield does not ask for a phone number or identity. Browser, hosting, and network metadata can still exist outside the app.",
  },
  {
    tag: "The signal",
    title: "A similar claim is a lead, not proof.",
    body: "When separate channels echo the same story, SourceShield surfaces it as a signal worth chasing, never as independent corroboration.",
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
            <a href="#limits">Honest limits</a>
            <Link href="/intake">Submit a tip</Link>
          </div>
        </nav>

        <header className="ss-hero">
          <div className="ss-kicker ss-reveal ss-in">Pseudonymous source protection</div>
          <h1 className="ss-title ss-reveal ss-in ss-d1">
            Truth, <em>without a trace.</em>
          </h1>
          <p className="ss-lede ss-reveal ss-in ss-d2">
            Newsroom tips travel through encrypted light. Raw words stay sealed in private memory;
            journalists receive only what is safe to know.
          </p>
          <div className="ss-cta-row ss-reveal ss-in ss-d3">
            <Link href="/intake" className="ss-btn ss-btn-primary">
              Submit a tip
            </Link>
            <a href="#how" className="ss-btn ss-btn-ghost">
              See how it works
            </a>
          </div>
          <div className="ss-hero-status ss-reveal ss-in ss-d4">
            <span className="ss-pulse" aria-hidden="true" />
            Encrypted memory online - channel secured
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
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ss-block" id="limits" aria-labelledby="limits-title">
          <div className="ss-wrap">
            <div className="ss-eyebrow ss-reveal">What we will not pretend</div>
            <h2 id="limits-title" className="ss-section-title ss-reveal ss-d1">
              Honesty is part of the protection.
            </h2>
            <p className="ss-section-lede ss-reveal ss-d2">
              The shield is real, and so are its edges. We tell sources exactly where it ends.
            </p>
            <div className="ss-limits-grid">
              {limits.map((limit, index) => (
                <article key={limit.tag} className={`ss-limit ss-reveal ss-d${index + 1}`}>
                  <span>{limit.tag}</span>
                  <h3>{limit.title}</h3>
                  <p>{limit.body}</p>
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
            </div>
          </div>
        </section>

        <footer className="ss-footer">
          <div className="ss-wrap ss-foot-inner">
            <span>SourceShield - pseudonymous newsroom intake</span>
            <div className="ss-foot-links">
              <a href="#how">How it works</a>
              <a href="#limits">Honest limits</a>
              <Link href="/intake">Submit a tip</Link>
            </div>
            <span>Krava x Linq</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
