import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { processWebIntake } from "@/lib/process-inbound";
import { isValidSessionId } from "@/lib/session-id";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Web intake — deliberate stance on metadata:
 * This route does not read or persist x-forwarded-for, x-vercel-ip-*, or user-agent.
 * Network-layer anonymity is Tor/onion hosting; Vercel infra may still log requests.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let text: string | undefined;
  let providedSessionId: string | undefined;

  if (contentType.includes("application/json")) {
    let body: { text?: string; session_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
    }
    text = body.text?.trim();
    providedSessionId = body.session_id?.trim();
  } else if (isForm) {
    const form = await request.formData();
    text = String(form.get("text") ?? "").trim();
    const rawSession = form.get("session_id");
    providedSessionId = rawSession ? String(rawSession).trim() : undefined;
  } else {
    return NextResponse.json(
      { error: "unsupported_content_type" },
      { status: 400, headers: NO_STORE },
    );
  }

  if (!text) {
    if (isForm) {
      return NextResponse.redirect(new URL("/intake?error=empty_text", request.url), 303);
    }
    return NextResponse.json({ error: "empty_text" }, { status: 400, headers: NO_STORE });
  }

  if (providedSessionId && !isValidSessionId(providedSessionId)) {
    if (isForm) {
      return NextResponse.redirect(new URL("/intake?error=invalid_case", request.url), 303);
    }
    return NextResponse.json({ error: "invalid_session_id" }, { status: 400, headers: NO_STORE });
  }

  const sessionId = providedSessionId ?? randomUUID();
  const result = await processWebIntake(sessionId, text);

  const payload = {
    ok: true,
    session_id: sessionId,
    tip_id: result.tipId,
    reply: result.reply,
    sanitized_summary: result.sanitized_summary,
    duress_signal: result.duress_signal,
    next_safe_question: result.next_safe_question,
    engine: result.engine,
    memory_recalled: result.memory_recalled,
    db_saved: result.db_saved,
    db_error: result.db_error,
    memory_saved: result.memory_saved,
    warnings: [
      ...(result.engine === "mock"
        ? [
            "Krava inference unavailable — showing regex mock sanitization. Fix KRAVA_APP_KEY for live demo.",
          ]
        : []),
      ...(result.db_error ? [`Dashboard card not saved: ${result.db_error}`] : []),
    ],
  };

  if (isForm) {
    const url = new URL("/intake", request.url);
    url.searchParams.set("case", sessionId);
    if (result.memory_recalled) url.searchParams.set("recalled", "1");
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json(payload, { headers: NO_STORE });
}
