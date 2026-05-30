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
  });
}
