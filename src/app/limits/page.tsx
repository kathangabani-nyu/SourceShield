import Link from "next/link";

const LIMITS = [
  {
    index: "01",
    title: "Anonymous web intake",
    body: "No login, no phone, no browser-stored session, no analytics, and no third-party requests. The app does not intentionally read or persist network metadata. Full network anonymity requires Tor Browser or an onion mirror.",
    tech: "TLS · Cache-Control: no-store on intake · platform logs (Vercel) outside app control.",
  },
  {
    index: "02",
    title: "Krava memory boundary",
    body: "Raw text is processed and may be held in Krava encrypted memory. The newsroom database stores sanitized summaries, never the original transcript.",
    tech: "AES-256-GCM · memory.save/memory.search · GCM chosen for authenticated encryption (integrity + confidentiality).",
  },
  {
    index: "03",
    title: "Case-code recovery",
    body: "The case code is the only resume secret. If a source loses it, SourceShield cannot recover the thread for them.",
    tech: "UUIDv4 user-held · channel hash SHA-256(web:uuid) — no email reset path by design.",
  },
  {
    index: "04",
    title: "Linq is different",
    body: "The iMessage path is pseudonymous, not anonymous. Carriers, Apple, and Linq can still see phone-message metadata even though the journalist dashboard cannot.",
    tech: "Inbound webhook HMAC-SHA256 · handle hashed before DB · linq_chat_id server-only.",
  },
  {
    index: "05",
    title: "Signals are review aids",
    body: "Similar-claim grouping is not proof of independence, and coercion-risk flags are model signals, not legal or safety determinations.",
    tech: "claim_fingerprint slug · distinct_channel_count — compares sanitized metadata only.",
  },
  {
    index: "06",
    title: "Text only",
    body: "Attachments are declined. Sources are asked for text-only tips so sensitive files do not leak identity through embedded metadata.",
    tech: "Media-only inbound → safety reply · no blob storage in app DB.",
  },
];

export default function LimitsPage() {
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
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/story">Demo story</Link>
          </div>
        </nav>

        <main className="ss-limits-main">
          <section className="ss-wrap ss-limits-hero">
            <p className="ss-kicker">Honest limits</p>
            <h1 className="ss-section-title">The shield is real, and so are its edges.</h1>
            <p className="ss-section-lede">
              SourceShield is designed around minimal exposure. It still names the boundary clearly,
              so sources know when they need Tor, an onion mirror, or a different channel entirely.
            </p>
          </section>

          <section className="ss-wrap ss-limits-page-grid" aria-label="SourceShield limits">
            {LIMITS.map((limit) => (
              <article key={limit.index} className="ss-limit">
                <span>{limit.index}</span>
                <h2>{limit.title}</h2>
                <p>{limit.body}</p>
                {limit.tech ? <p className="ss-tech-note">{limit.tech}</p> : null}
              </article>
            ))}
          </section>

          <section className="ss-wrap ss-limits-doc">
            <p>
              Full threat model and deploy notes live in{" "}
              <code>docs/anonymity.md</code>.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
