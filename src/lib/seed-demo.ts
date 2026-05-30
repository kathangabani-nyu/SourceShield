import { getSupabaseAdmin } from "./supabase/server";
import { hashHandle } from "./source-channel";

export async function seedDemoTips(): Promise<{
  claim_group_id: string;
  tip_ids: string[];
}> {
  const supabase = getSupabaseAdmin();
  const groupId = crypto.randomUUID();
  const fingerprint = "city-hall-contract-anomaly";

  const channels = [
    {
      hash: hashHandle("seed:channel-a"),
      summary:
        "A source reports irregular contract approvals at a municipal building.",
    },
    {
      hash: hashHandle("seed:channel-b"),
      summary:
        "Another channel describes similar contract irregularities at city hall.",
    },
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
        next_safe_question:
          "Can you describe the general nature of the contract concern?",
      })
      .select("id")
      .single();

    if (tip) tipIds.push(tip.id);
  }

  return { claim_group_id: groupId, tip_ids: tipIds };
}
