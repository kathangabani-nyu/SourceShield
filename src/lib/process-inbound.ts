import type { MessageEventV2 } from "@linqapp/sdk/resources/webhooks";
import { assignClaimGroup } from "./corroboration";
import { extractInboundText } from "./linq/extract-text";
import { sendLinqTextMessage, isLinqConfigured } from "./linq/client";
import { runIntakeLlm } from "./krava/intake-llm";
import { saveRawTranscript } from "./krava/memory";
import { provisionKravaUser } from "./krava/client";
import {
  MEDIA_ONLY_REPLY,
  TEXT_ONLY_REPLY,
} from "./intake-schema";
import { hashHandle } from "./source-channel";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase/server";

export type InboundPayload = {
  event_id: string;
  event_type: string;
  data: MessageEventV2;
};

export async function processInboundEvent(
  payload: InboundPayload
): Promise<{ ok: boolean; error?: string }> {
  const { event_id, data } = payload;

  if (data.direction !== "inbound") {
    await markEventDone(event_id);
    return { ok: true };
  }

  const chatId = data.chat.id;
  const messageId = data.id;
  const handleHash = hashHandle(data.sender_handle.handle);

  const extracted = extractInboundText(data.parts);

  let replyText: string;
  let sanitizedSummary = "Non-text inbound message";
  let duressSignal: "low" | "medium" | "high" = "low";
  let claimFingerprint = "non-text";

  if (extracted.kind === "media_only") {
    replyText = MEDIA_ONLY_REPLY;
  } else if (extracted.kind === "empty") {
    replyText = TEXT_ONLY_REPLY;
  } else {
    const intake = await runIntakeLlm(handleHash, extracted.text);
    replyText = extracted.hasMedia
      ? `${intake.assistant_reply}\n\n${TEXT_ONLY_REPLY}`
      : intake.assistant_reply;
    sanitizedSummary = intake.sanitized_summary;
    duressSignal = intake.duress_signal;
    claimFingerprint =
      intake.claims[0]?.fingerprint ?? `claim-${handleHash.slice(0, 12)}`;

    const externalUserId = `source:${handleHash}`;
    try {
      const { userToken } = await provisionKravaUser(externalUserId);
      await saveRawTranscript(
        userToken,
        `[${new Date().toISOString()}] inbound\n${extracted.text}`
      );
    } catch {
      // Raw transcript storage failure must not block the live reply
    }
  }

  if (isSupabaseConfigured() && extracted.kind === "text") {
    const supabase = getSupabaseAdmin();

    const { data: channel, error: channelError } = await supabase
      .from("source_channels")
      .upsert(
        { linq_handle_hash: handleHash },
        { onConflict: "linq_handle_hash" }
      )
      .select("id, krava_user_id")
      .single();

    if (channelError || !channel) {
      await markEventFailed(event_id);
      return { ok: false, error: "channel_upsert_failed" };
    }

    if (!channel.krava_user_id) {
      try {
        const { userId } = await provisionKravaUser(`source:${handleHash}`);
        await supabase
          .from("source_channels")
          .update({ krava_user_id: userId })
          .eq("id", channel.id);
      } catch {
        // Non-blocking
      }
    }

    const { data: tip, error: tipError } = await supabase
      .from("tips")
      .insert({
        source_channel_id: channel.id,
        linq_chat_id: chatId,
        sanitized_summary: sanitizedSummary,
        duress_signal: duressSignal,
        claim_fingerprint: claimFingerprint,
      })
      .select("id")
      .single();

    if (tipError || !tip) {
      await markEventFailed(event_id);
      return { ok: false, error: "tip_insert_failed" };
    }

    await assignClaimGroup(tip.id, claimFingerprint, sanitizedSummary);
  }

  if (isLinqConfigured()) {
    const idempotencyKey = `reply-${event_id}`;
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        await supabase.from("outbound_messages").upsert(
          {
            idempotency_key: idempotencyKey,
            linq_chat_id: chatId,
            direction: "bot",
          },
          { onConflict: "idempotency_key", ignoreDuplicates: true }
        );
      }

      await sendLinqTextMessage(chatId, replyText, idempotencyKey);
    } catch {
      await markEventFailed(event_id);
      return { ok: false, error: "linq_send_failed" };
    }
  }

  await markEventDone(event_id, chatId, messageId);
  return { ok: true };
}

async function markEventDone(
  eventId: string,
  chatId?: string,
  messageId?: string
) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  await supabase
    .from("linq_events")
    .update({
      status: "done",
      processed_at: new Date().toISOString(),
      ...(chatId ? { chat_id: chatId } : {}),
      ...(messageId ? { message_id: messageId } : {}),
    })
    .eq("event_id", eventId);
}

async function markEventFailed(eventId: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  await supabase
    .from("linq_events")
    .update({
      status: "failed",
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
}

export async function processWebIntake(
  sessionId: string,
  text: string
): Promise<{ tipId: string | null; reply: string }> {
  const handleHash = hashHandle(`web:${sessionId}`);
  const intake = await runIntakeLlm(handleHash, text);

  let tipId: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();

    const { data: channel } = await supabase
      .from("source_channels")
      .upsert(
        { linq_handle_hash: handleHash },
        { onConflict: "linq_handle_hash" }
      )
      .select("id")
      .single();

    if (channel) {
      const { data: tip } = await supabase
        .from("tips")
        .insert({
          source_channel_id: channel.id,
          linq_chat_id: "00000000-0000-0000-0000-000000000000",
          sanitized_summary: intake.sanitized_summary,
          duress_signal: intake.duress_signal,
          claim_fingerprint:
            intake.claims[0]?.fingerprint ?? `web-${handleHash.slice(0, 12)}`,
        })
        .select("id")
        .single();

      if (tip) {
        tipId = tip.id;
        await assignClaimGroup(
          tip.id,
          intake.claims[0]?.fingerprint ?? "web-tip",
          intake.sanitized_summary
        );
      }
    }
  }

  try {
    const { userToken } = await provisionKravaUser(`source:${handleHash}`);
    await saveRawTranscript(userToken, `[web] ${text}`);
  } catch {
    // Non-blocking
  }

  return { tipId, reply: intake.assistant_reply };
}
