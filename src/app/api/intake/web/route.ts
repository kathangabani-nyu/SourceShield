import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { processWebIntake } from "@/lib/process-inbound";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { text?: string; session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }

  const sessionId = body.session_id ?? randomUUID();
  const result = await processWebIntake(sessionId, text);

  return NextResponse.json({
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
  });
}
