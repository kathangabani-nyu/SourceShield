import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { hashHandle } from "@/lib/source-channel";

export const runtime = "nodejs";

/**
 * Seeds two demo tips with overlapping claim fingerprints for corroboration demo.
 * Protect with INTERNAL_WORKER_SECRET in production.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const groupId = crypto.randomUUID();
  const fingerprint = "city-hall-contract-anomaly";

  const channels = [
    { hash: hashHandle("seed:channel-a"), summary: "A source reports irregular contract approvals at a municipal building." },
    { hash: hashHandle("seed:channel-b"), summary: "Another channel describes similar contract irregularities at city hall." },
  ];

  const tipIds: string[] = [];

  for (const ch of channels) {
    const { data: channel } = await supabase
      .from("source_channels")
      .upsert({ linq_handle_hash: ch.hash }, { onConflict: "linq_handle_hash" })
      .select("id")
      .single();

    if (!channel) continue;

    const { data: tip } = await supabase
      .from("tips")
      .insert({
        source_channel_id: channel.id,
        linq_chat_id: "00000000-0000-0000-0000-000000000001",
        sanitized_summary: ch.summary,
        duress_signal: "low",
        claim_fingerprint: fingerprint,
        claim_group_id: groupId,
      })
      .select("id")
      .single();

    if (tip) tipIds.push(tip.id);
  }

  return NextResponse.json({
    ok: true,
    claim_group_id: groupId,
    tip_ids: tipIds,
    message: "Seeded 2 distinct channels with a similar claim.",
  });
}
