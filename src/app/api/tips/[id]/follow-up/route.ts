import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { safeQuestionRewrite } from "@/lib/safe-question";
import { sendLinqTextMessage, isLinqConfigured } from "@/lib/linq/client";
import { requireDashboardAuth } from "@/lib/server-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const WEB_CHAT_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = requireDashboardAuth(request);
  if (authError) return authError;

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

  const isWebOnly = tip.linq_chat_id === WEB_CHAT_PLACEHOLDER;
  const { original, rewritten, wasRewritten, via } =
    await safeQuestionRewrite(message);

  if (!isLinqConfigured() || isWebOnly) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      web_only: isWebOnly,
      message: isWebOnly
        ? "Web intake tip — rewrite preview only (no iMessage thread)."
        : "Linq not configured — rewrite preview only.",
      original,
      rewritten,
      wasRewritten,
      via,
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
    via,
  });
}
