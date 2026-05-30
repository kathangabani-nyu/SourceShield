import { NextRequest, NextResponse } from "next/server";
import { processInboundEvent } from "@/lib/process-inbound";
import type { WorkerPayload } from "@/lib/app-url";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { payload?: WorkerPayload };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = body.payload;
  if (!payload?.event_id || !payload.data) {
    return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data: eventRow } = await supabase
      .from("linq_events")
      .select("status")
      .eq("event_id", payload.event_id)
      .single();

    if (eventRow?.status === "done") {
      return NextResponse.json({ ok: true, skipped: true });
    }
  }

  const result = await processInboundEvent(payload);
  return NextResponse.json(result);
}
