import { getOnionUrl } from "@/lib/app-url";
import { IntakeClient } from "./intake-client";

type IntakePageProps = {
  searchParams: Promise<{
    case?: string;
    error?: string;
    recalled?: string;
  }>;
};

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams;
  const onionUrl = getOnionUrl();

  return (
    <>
      <noscript>
        <style>{`#intake-app { display: none !important; }`}</style>
        <div className="source-shield-home ss-noscript-intake">
          <main className="ss-wrap" style={{ maxWidth: 640, padding: "3rem 2rem" }}>
            <h1>Web intake (no JavaScript)</h1>
            <p>
              Submit a tip without scripts. You will receive a case code on the next page — write
              it down; it is the only way to resume.
            </p>
            {params.case ? (
              <p>
                <strong>Your case code:</strong> {params.case}
              </p>
            ) : null}
            {params.error === "empty_text" ? <p>Tip text was empty.</p> : null}
            {params.error === "invalid_case" ? <p>That case code is not valid.</p> : null}
            <form method="POST" action="/api/intake/web">
              <label htmlFor="noscript-text">What do you need to report?</label>
              <br />
              <textarea id="noscript-text" name="text" rows={6} required />
              <br />
              <label htmlFor="noscript-session">Case code (optional — to resume)</label>
              <br />
              <input id="noscript-session" name="session_id" type="text" autoComplete="off" />
              <br />
              <button type="submit">Send in confidence</button>
            </form>
            {onionUrl ? (
              <p>
                Tor mirror: <a href={onionUrl}>{onionUrl}</a>
              </p>
            ) : null}
          </main>
        </div>
      </noscript>
      <div id="intake-app">
        <IntakeClient
          onionUrl={onionUrl}
          urlCaseCode={params.case ?? null}
          urlError={params.error ?? null}
          urlRecalled={params.recalled === "1"}
        />
      </div>
    </>
  );
}
