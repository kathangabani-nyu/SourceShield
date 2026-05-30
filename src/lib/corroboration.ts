import { compareClaimsWithLlm } from "./krava/intake-llm";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase/server";

export async function assignClaimGroup(
  tipId: string,
  claimFingerprint: string,
  sanitizedSummary: string
): Promise<number> {
  if (!isSupabaseConfigured()) return 1;

  const supabase = getSupabaseAdmin();

  const { data: matches } = await supabase
    .from("tips")
    .select("id, claim_fingerprint, claim_group_id, sanitized_summary")
    .eq("claim_fingerprint", claimFingerprint)
    .neq("id", tipId);

  if (matches?.length) {
    const groupId = matches[0].claim_group_id ?? crypto.randomUUID();
    await supabase
      .from("tips")
      .update({ claim_group_id: groupId, updated_at: new Date().toISOString() })
      .in("id", [...matches.map((m) => m.id), tipId]);

    const { count } = await supabase
      .from("tips")
      .select("source_channel_id", { count: "exact", head: true })
      .eq("claim_group_id", groupId);

    return count ?? 1;
  }

  const { data: recentTips } = await supabase
    .from("tips")
    .select("id, sanitized_summary, claim_group_id, source_channel_id")
    .neq("id", tipId)
    .order("created_at", { ascending: false })
    .limit(10);

  for (const other of recentTips ?? []) {
    const same =
      other.sanitized_summary === sanitizedSummary ||
      (await compareClaimsWithLlm(sanitizedSummary, other.sanitized_summary));

    if (same) {
      const groupId = other.claim_group_id ?? crypto.randomUUID();
      await supabase
        .from("tips")
        .update({ claim_group_id: groupId, updated_at: new Date().toISOString() })
        .in("id", [other.id, tipId]);

      const { data: grouped } = await supabase
        .from("tips")
        .select("source_channel_id")
        .eq("claim_group_id", groupId);

      const distinctChannels = new Set(
        grouped?.map((t) => t.source_channel_id) ?? []
      );
      return distinctChannels.size;
    }
  }

  return 1;
}

export async function countDistinctChannelsForTip(
  tipId: string
): Promise<number> {
  if (!isSupabaseConfigured()) return 1;

  const supabase = getSupabaseAdmin();
  const { data: tip } = await supabase
    .from("tips")
    .select("claim_group_id, source_channel_id")
    .eq("id", tipId)
    .single();

  if (!tip?.claim_group_id) return 1;

  const { data: grouped } = await supabase
    .from("tips")
    .select("source_channel_id")
    .eq("claim_group_id", tip.claim_group_id);

  return new Set(grouped?.map((t) => t.source_channel_id) ?? []).size;
}
