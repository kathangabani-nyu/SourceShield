import { NextRequest, NextResponse } from "next/server";
import type { MessageReceivedWebhookEvent } from "@linqapp/sdk/resources/webhooks";
import { triggerWorker } from "@/lib/app-url";
import { verifyLinqWebhook } from "@/lib/linq/verify-webhook";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.LINQ_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get("x-webhook-timestamp");
  const signature = request.headers.get("x-webhook-signature");

  const verified = verifyLinqWebhook(rawBody, timestamp, signature, secret);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 401 });
  }

  let payload: MessageReceivedWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as MessageReceivedWebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (payload.event_type !== "message.received") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!isSupabaseConfigured()) {
    triggerWorker({
      event_id: payload.event_id,
      event_type: payload.event_type,
      data: payload.data,
    });
    return NextResponse.json({ ok: true, queued: true, dedupe: "skipped" });
  }

  const supabase = getSupabaseAdmin();
  const chatId = payload.data?.chat?.id ?? null;
  const messageId = payload.data?.id ?? null;

  const { error, count } = await supabase.from("linq_events").insert(
    {
      event_id: payload.event_id,
      event_type: payload.event_type,
      status: "processing",
      chat_id: chatId,
      message_id: messageId,
    },
    { count: "exact" }
  );

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, dedupe: true });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ ok: true, dedupe: true });
  }

  triggerWorker({
    event_id: payload.event_id,
    event_type: payload.event_type,
    data: payload.data,
  });

  return NextResponse.json({ ok: true, queued: true });
}
