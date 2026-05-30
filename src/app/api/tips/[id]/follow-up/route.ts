import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { safeQuestionRewrite } from "@/lib/safe-question";
import { sendLinqTextMessage, isLinqConfigured } from "@/lib/linq/client";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: tip, error } = await supabase
    .from("tips")
    .select("id, linq_chat_id")
    .eq("id", id)
    .single();

  if (error || !tip) {
    return NextResponse.json({ error: "tip_not_found" }, { status: 404 });
  }

  if (tip.linq_chat_id === "00000000-0000-0000-0000-000000000000") {
    return NextResponse.json(
      { error: "web_only_tip", message: "This tip came via the web passkey path — no iMessage chat to reply to." },
      { status: 422 }
    );
  }

  const { original, rewritten, wasRewritten } = safeQuestionRewrite(message);

  if (!isLinqConfigured()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      original,
      rewritten,
      wasRewritten,
    });
  }

  const idempotencyKey = `journalist-${randomUUID()}`;

  await supabase.from("outbound_messages").insert({
    idempotency_key: idempotencyKey,
    linq_chat_id: tip.linq_chat_id,
    direction: "journalist",
  });

  await sendLinqTextMessage(tip.linq_chat_id, rewritten, idempotencyKey);

  return NextResponse.json({
    ok: true,
    original,
    rewritten,
    wasRewritten,
  });
}
