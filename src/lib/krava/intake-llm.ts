import { isKravaConfigured, provisionKravaUser } from "./client";
import { streamKravaText } from "./chat";
import { searchMemoryContext } from "./memory";
import { isKravaRuntimeError } from "./runtime";
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
- Request text-only tips if the source mentions sending files
- Use any prior memory context to keep the conversation coherent across messages`;

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

  try {
    const externalUserId = `source:${handleHash}`;
    const { userToken } = await provisionKravaUser(externalUserId);

    const priorContext = await searchMemoryContext(userToken, inboundText);
    const userContent = priorContext
      ? `Prior context from encrypted memory (for continuity only):\n${priorContext}\n\nNew inbound message:\n${inboundText}`
      : inboundText;

    let raw = await streamKravaText(userToken, INTAKE_SYSTEM, userContent);
    let result = parseIntakeJson(raw);

    if (!result) {
      raw = await streamKravaText(
        userToken,
        INTAKE_SYSTEM,
        `${userContent}\n\n[SYSTEM: Output valid JSON matching the schema exactly.]`
      );
      result = parseIntakeJson(raw);
    }

    if (!result) {
      return structuredFallback();
    }

    if (result.duress_signal === "high") {
      result.assistant_reply = DURESS_PAUSE_REPLY;
    }

    return result;
  } catch (err) {
    if (isKravaRuntimeError(err)) {
      return mockIntake(inboundText);
    }
    throw err;
  }
}

function structuredFallback(): IntakeResult {
  return {
    assistant_reply: FALLBACK_INTAKE_REPLY,
    sanitized_summary: "Tip received; pending review.",
    duress_signal: "low",
    claims: [{ text: "Unparsed tip", fingerprint: "unparsed-tip" }],
    next_safe_question: "Can you describe what happened in general terms?",
  };
}

/** Offline/dev fallback when Krava keys are missing or API rejects the call. */
export function mockIntake(inboundText: string): IntakeResult {
  const lower = inboundText.toLowerCase();
  const highDuress =
    lower.includes("forget everything") ||
    lower.includes("they made me") ||
    lower.includes("don't tell");

  if (highDuress) {
    return {
      assistant_reply: DURESS_PAUSE_REPLY,
      sanitized_summary:
        "Source indicated possible coercion; details withheld pending safety review.",
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

  try {
    const { userToken } = await provisionKravaUser("system:corroboration");
    const text = await streamKravaText(
      userToken,
      'Answer with JSON only: { "same_event": true|false }. Do these two sanitized claims describe the same underlying event?',
      `Claim A: ${claimA}\nClaim B: ${claimB}`,
      0
    );

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return false;
    const parsed = JSON.parse(match[0]) as { same_event?: boolean };
    return Boolean(parsed.same_event);
  } catch (err) {
    if (isKravaRuntimeError(err)) {
      return claimA === claimB;
    }
    return false;
  }
}

const SAFE_REWRITE_SYSTEM = `You rewrite journalist follow-up questions for a pseudonymous source channel.
Remove or generalize ALL names, dates, specific locations, phone numbers, and identifying details.
Return ONLY the rewritten question text — no JSON, no explanation. Keep it one short question.`;

export async function rewriteSafeQuestionWithKrava(
  draftQuestion: string
): Promise<string | null> {
  if (!isKravaConfigured()) return null;

  try {
    const { userToken } = await provisionKravaUser("system:safe-question");
    const rewritten = await streamKravaText(
      userToken,
      SAFE_REWRITE_SYSTEM,
      `Rewrite this journalist follow-up safely:\n${draftQuestion}`,
      0
    );

    const trimmed = rewritten.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (err) {
    if (isKravaRuntimeError(err)) return null;
    throw err;
  }
}
