import {
  createKravaUserClient,
  isKravaConfigured,
  provisionKravaUser,
} from "./client";
import { parseAgentChatStream } from "@kravalabs/api-client";
import {
  DURESS_PAUSE_REPLY,
  FALLBACK_INTAKE_REPLY,
  IntakeResultSchema,
  type IntakeResult,
} from "../intake-schema";

const INTAKE_SYSTEM = `You are SourceShield, a pseudonymous newsroom tip intake assistant.
Respond with JSON only — no markdown, no prose outside the JSON object.

Required JSON shape:
{
  "assistant_reply": "short reply to send back to the source via iMessage",
  "sanitized_summary": "journalist-safe summary with ALL names, dates, locations, and identifiers removed",
  "duress_signal": "low" | "medium" | "high",
  "claims": [{ "text": "brief claim description", "fingerprint": "stable-slug-like-id-for-grouping" }],
  "next_safe_question": "a follow-up question that avoids naming people, dates, or places"
}

Rules:
- If the source shows coercion signals ("forget everything", "they made me", "don't tell anyone I said this"), set duress_signal to "high" and set assistant_reply EXACTLY to: "${DURESS_PAUSE_REPLY}"
- Never ask "Are you being forced?" or similar probing questions
- sanitized_summary must never contain raw identifying details
- claim fingerprints should be stable slugs derived from the event (e.g. "city-hall-contract-2024")
- Keep assistant_reply under 300 characters and conversational
- Request text-only tips if the source mentions sending files`;

async function streamAgentText(
  userToken: string,
  inboundText: string,
  retryHint?: string
): Promise<string> {
  const client = createKravaUserClient(userToken);
  const { gatewayToken } = await client.agent.getGatewayCredentials();

  const userContent = retryHint
    ? `${inboundText}\n\n[SYSTEM: Previous response was invalid JSON. ${retryHint}]`
    : inboundText;

  const response = await client.v1.agentChat(
    {
      model: "kimi-k2-5",
      stream: true,
      system: INTAKE_SYSTEM,
      messages: [{ role: "user", content: userContent }],
      temperature: 0.2,
    },
    { gatewayToken }
  );

  let text = "";
  for await (const event of parseAgentChatStream(response)) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      text += String((event.delta as { text?: string }).text ?? "");
    }
  }

  return text;
}

function parseIntakeJson(raw: string): IntakeResult | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return IntakeResultSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function runIntakeLlm(
  handleHash: string,
  inboundText: string
): Promise<IntakeResult> {
  if (!isKravaConfigured()) {
    return mockIntake(inboundText);
  }

  const externalUserId = `source:${handleHash}`;
  const { userToken } = await provisionKravaUser(externalUserId);

  let raw = await streamAgentText(userToken, inboundText);
  let result = parseIntakeJson(raw);

  if (!result) {
    raw = await streamAgentText(
      userToken,
      inboundText,
      "Output valid JSON matching the schema exactly."
    );
    result = parseIntakeJson(raw);
  }

  if (!result) {
    return {
      assistant_reply: FALLBACK_INTAKE_REPLY,
      sanitized_summary: "Tip received; pending review.",
      duress_signal: "low",
      claims: [{ text: "Unparsed tip", fingerprint: "unparsed-tip" }],
      next_safe_question: "Can you describe what happened in general terms?",
    };
  }

  if (result.duress_signal === "high") {
    result.assistant_reply = DURESS_PAUSE_REPLY;
  }

  return result;
}

/** Offline/dev fallback when Krava keys are not set. */
function mockIntake(inboundText: string): IntakeResult {
  const lower = inboundText.toLowerCase();
  const highDuress =
    lower.includes("forget everything") ||
    lower.includes("they made me") ||
    lower.includes("don't tell");

  if (highDuress) {
    return {
      assistant_reply: DURESS_PAUSE_REPLY,
      sanitized_summary: "Source indicated possible coercion; details withheld pending safety review.",
      duress_signal: "high",
      claims: [{ text: "Coercion-related tip", fingerprint: "coercion-signal" }],
      next_safe_question: "",
    };
  }

  return {
    assistant_reply:
      "Thank you for reaching out. We received your message and a journalist will review it. Please share details in text only.",
    sanitized_summary: "New tip received via pseudonymous channel.",
    duress_signal: "low",
    claims: [{ text: "General tip", fingerprint: "general-tip" }],
    next_safe_question: "Can you describe the nature of the concern?",
  };
}

export async function compareClaimsWithLlm(
  claimA: string,
  claimB: string
): Promise<boolean> {
  if (!isKravaConfigured()) {
    return claimA === claimB;
  }

  const { userToken } = await provisionKravaUser("system:corroboration");
  const client = createKravaUserClient(userToken);
  const { gatewayToken } = await client.agent.getGatewayCredentials();

  const response = await client.v1.agentChat(
    {
      model: "kimi-k2-5",
      stream: true,
      system:
        'Answer with JSON only: { "same_event": true|false }. Do these two sanitized claims describe the same underlying event?',
      messages: [
        {
          role: "user",
          content: `Claim A: ${claimA}\nClaim B: ${claimB}`,
        },
      ],
      temperature: 0,
    },
    { gatewayToken }
  );

  let text = "";
  for await (const event of parseAgentChatStream(response)) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      text += String((event.delta as { text?: string }).text ?? "");
    }
  }

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return false;
    const parsed = JSON.parse(match[0]) as { same_event?: boolean };
    return Boolean(parsed.same_event);
  } catch {
    return false;
  }
}
