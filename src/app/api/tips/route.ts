import { NextRequest, NextResponse } from "next/server";
import { countDistinctChannelsForTip } from "@/lib/corroboration";
import { requireDashboardAuth } from "@/lib/server-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = requireDashboardAuth(request);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ tips: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data: tips, error } = await supabase
    .from("tips")
    .select(
      "id, sanitized_summary, duress_signal, claim_fingerprint, claim_group_id, source_channel_id, next_safe_question, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const enriched = await Promise.all(
    (tips ?? []).map(async (tip) => ({
      ...tip,
      distinct_channel_count: await countDistinctChannelsForTip(tip.id),
    }))
  );

  return NextResponse.json({ tips: enriched });
}
